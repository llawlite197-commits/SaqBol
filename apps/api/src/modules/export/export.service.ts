import { Injectable, NotFoundException } from "@nestjs/common";
import {
  AuditAction,
  ExportJobStatus,
  ExportJobType,
  Prisma
} from "@saqbol/db";
import ExcelJS from "exceljs";
import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { Response } from "express";
import type { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { PrismaService } from "../../prisma/prisma.service";
import {
  ComplaintExportFormat,
  ExportComplaintsDto
} from "./dto/export-complaints.dto";
import { ListExportJobsDto } from "./dto/list-export-jobs.dto";
import { toCsv } from "./helpers/csv.helper";

type ExportRow = Record<string, string | number | null>;

@Injectable()
export class ExportService {
  private readonly exportRoot = process.env.EXPORTS_ROOT ?? resolve(process.cwd(), "..", "..", "exports");

  constructor(private readonly prisma: PrismaService) {}

  async exportComplaints(user: AuthenticatedUser, dto: ExportComplaintsDto) {
    await mkdir(this.exportRoot, { recursive: true });

    const jobType =
      dto.format === ComplaintExportFormat.XLSX
        ? ExportJobType.COMPLAINTS_XLSX
        : ExportJobType.COMPLAINTS_CSV;

    const job = await this.prisma.exportJob.create({
      data: {
        requestedByUserId: user.userId,
        jobType,
        jobStatus: ExportJobStatus.PROCESSING,
        filters: this.buildFilterSnapshot(dto) as Prisma.InputJsonValue,
        startedAt: new Date()
      }
    });

    await this.writeAudit(user, AuditAction.EXPORT_REQUESTED, job.id, {
      format: dto.format,
      filters: this.buildFilterSnapshot(dto)
    });

    try {
      const complaints = await this.prisma.complaint.findMany({
        where: this.buildComplaintWhere(dto),
        include: {
          region: true,
          fraudType: true,
          citizenUser: {
            select: {
              email: true,
              phone: true
            }
          },
          currentAssigneeEmployee: {
            include: {
              user: {
                select: {
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      });

      const rows = complaints.map<ExportRow>((complaint) => ({
        complaintNumber: complaint.complaintNumber,
        status: complaint.currentStatus,
        region: complaint.region.nameRu,
        fraudType: complaint.fraudType.nameRu,
        incidentAt: complaint.incidentAt?.toISOString() ?? null,
        damageAmount: complaint.damageAmount?.toString() ?? null,
        citizenEmail: complaint.citizenUser.email,
        citizenPhone: complaint.citizenUser.phone,
        assigneeEmail: complaint.currentAssigneeEmployee?.user.email ?? null,
        createdAt: complaint.createdAt.toISOString()
      }));

      const extension = dto.format === ComplaintExportFormat.XLSX ? "xlsx" : "csv";
      const fileName = `complaints-${job.id}.${extension}`;
      const absolutePath = join(this.exportRoot, fileName);

      if (dto.format === ComplaintExportFormat.XLSX) {
        await this.writeXlsx(absolutePath, rows);
      } else {
        await writeFile(absolutePath, toCsv(rows), "utf8");
      }

      const completedJob = await this.prisma.exportJob.update({
        where: {
          id: job.id
        },
        data: {
          jobStatus: ExportJobStatus.COMPLETED,
          fileName,
          storageBucket: "local",
          storageObjectKey: fileName,
          rowCount: rows.length,
          completedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      await this.writeAudit(user, AuditAction.EXPORT_COMPLETED, job.id, {
        fileName,
        rowCount: rows.length
      });

      return completedJob;
    } catch (error) {
      await this.prisma.exportJob.update({
        where: {
          id: job.id
        },
        data: {
          jobStatus: ExportJobStatus.FAILED,
          failedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : "Export failed."
        }
      });

      throw error;
    }
  }

  async listJobs(query: ListExportJobsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(query.status ? { jobStatus: query.status } : {})
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.exportJob.findMany({
        where,
        include: {
          requestedByUser: {
            select: {
              id: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        skip,
        take: limit
      }),
      this.prisma.exportJob.count({ where })
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async downloadJob(user: AuthenticatedUser, jobId: string, response: Response) {
    const job = await this.prisma.exportJob.findUnique({
      where: {
        id: jobId
      }
    });

    if (!job || job.jobStatus !== ExportJobStatus.COMPLETED || !job.storageObjectKey) {
      throw new NotFoundException("Export file not found.");
    }

    const absolutePath = join(this.exportRoot, job.storageObjectKey);
    await stat(absolutePath);

    await this.writeAudit(user, AuditAction.EXPORT_COMPLETED, job.id, {
      operation: "download",
      fileName: job.fileName
    });

    response.setHeader(
      "Content-Type",
      job.jobType === ExportJobType.COMPLAINTS_XLSX
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "text/csv; charset=utf-8"
    );
    response.setHeader("Content-Disposition", `attachment; filename="${job.fileName}"`);

    await new Promise<void>((resolveStream, rejectStream) => {
      createReadStream(absolutePath)
        .on("error", rejectStream)
        .on("end", resolveStream)
        .pipe(response);
    });
  }

  private buildComplaintWhere(dto: ExportComplaintsDto) {
    return {
      ...(dto.status ? { currentStatus: dto.status } : {}),
      ...(dto.regionId ? { regionId: dto.regionId } : {}),
      ...(dto.fraudTypeId ? { fraudTypeId: dto.fraudTypeId } : {}),
      ...(dto.dateFrom || dto.dateTo
        ? {
            createdAt: {
              ...(dto.dateFrom ? { gte: new Date(dto.dateFrom) } : {}),
              ...(dto.dateTo ? { lte: new Date(dto.dateTo) } : {})
            }
          }
        : {})
    };
  }

  private buildFilterSnapshot(dto: ExportComplaintsDto) {
    return {
      format: dto.format,
      status: dto.status ?? null,
      regionId: dto.regionId ?? null,
      fraudTypeId: dto.fraudTypeId ?? null,
      dateFrom: dto.dateFrom ?? null,
      dateTo: dto.dateTo ?? null
    };
  }

  private async writeXlsx(path: string, rows: ExportRow[]) {
    if (rows.length === 0) {
      rows = [
        {
          complaintNumber: null,
          status: null,
          region: null,
          fraudType: null,
          incidentAt: null,
          damageAmount: null,
          citizenEmail: null,
          citizenPhone: null,
          assigneeEmail: null,
          createdAt: null
        }
      ];
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Complaints");
    const headers = Object.keys(rows[0]);

    worksheet.columns = headers.map((header) => ({
      header,
      key: header,
      width: 24
    }));

    for (const row of rows) {
      worksheet.addRow(row);
    }

    worksheet.getRow(1).font = { bold: true };
    await workbook.xlsx.writeFile(path);
  }

  private writeAudit(
    user: AuthenticatedUser,
    actionType: AuditAction,
    entityId: string,
    metadata: Record<string, unknown>
  ) {
    return this.prisma.auditLog.create({
      data: {
        actorUserId: user.userId,
        actionType,
        entityType: "export_job",
        entityId,
        metadata: metadata as Prisma.InputJsonValue
      }
    });
  }
}
