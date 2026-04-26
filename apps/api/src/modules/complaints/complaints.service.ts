import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import {
  CommentVisibility,
  ComplaintContactType,
  ComplaintStatus,
  FileScanStatus,
  Prisma,
  RequestSource
} from "@saqbol/db";
import type { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { PrismaService } from "../../prisma/prisma.service";
import { AddComplaintCommentDto } from "./dto/add-complaint-comment.dto";
import { AdditionalInfoDto } from "./dto/additional-info.dto";
import { AssignComplaintDto } from "./dto/assign-complaint.dto";
import { CreateComplaintDto } from "./dto/create-complaint.dto";
import { CreatePublicComplaintDto } from "./dto/create-public-complaint.dto";
import { ListAdminComplaintsDto } from "./dto/list-admin-complaints.dto";
import { ListMyComplaintsDto } from "./dto/list-my-complaints.dto";
import { UpdateComplaintStatusDto } from "./dto/update-complaint-status.dto";

const complaintInclude = {
  region: true,
  fraudType: true,
  contacts: true,
  files: true,
  statusHistory: { orderBy: { createdAt: "desc" as const } },
  comments: { orderBy: { createdAt: "desc" as const } },
  currentAssigneeEmployee: true
};

@Injectable()
export class ComplaintsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPublicComplaint(dto: CreatePublicComplaintDto, files: Express.Multer.File[] = []) {
    const citizen = await this.getDemoCitizenUserId();
    const complaintNumber = await this.generateComplaintNumber();

    const complaint = await this.prisma.complaint.create({
      data: {
        complaintNumber,
        citizenUserId: citizen,
        regionId: dto.regionId,
        fraudTypeId: dto.fraudTypeId,
        title: "Public complaint",
        description: dto.description,
        incidentAt: new Date(dto.incidentDate),
        damageAmount: dto.damageAmount ? new Prisma.Decimal(dto.damageAmount) : undefined,
        currentStatus: ComplaintStatus.NEW,
        submissionSource: RequestSource.PUBLIC_WEB,
        metadata: {
          fullName: dto.fullName,
          iin: dto.iin,
          phone: dto.phone,
          email: dto.email,
          scammerData: dto.scammerData ?? null
        },
        contacts: dto.scammerData
          ? {
              create: [
                {
                  contactType: ComplaintContactType.PHONE,
                  rawValue: dto.scammerData,
                  normalizedValue: dto.scammerData,
                  isPrimary: true
                }
              ]
            }
          : undefined,
        files: files.length
          ? {
              create: files.map((file) => ({
                uploadedByUserId: citizen,
                originalFileName: file.originalname,
                storageBucket: "local",
                storageObjectKey: file.path,
                mimeType: file.mimetype,
                fileSizeBytes: BigInt(file.size),
                fileStatus: FileScanStatus.ACTIVE
              }))
            }
          : undefined,
        statusHistory: {
          create: {
            toStatus: ComplaintStatus.NEW,
            reasonText: "Public complaint created"
          }
        }
      }
    });

    return { id: complaint.id, complaintNumber: complaint.complaintNumber };
  }

  async createComplaint(user: AuthenticatedUser, dto: CreateComplaintDto) {
    const complaintNumber = await this.generateComplaintNumber();
    return this.prisma.complaint.create({
      data: {
        complaintNumber,
        citizenUserId: user.userId,
        regionId: dto.regionId,
        fraudTypeId: dto.fraudTypeId,
        title: dto.title,
        description: dto.description,
        incidentAt: dto.incidentDate ? new Date(dto.incidentDate) : undefined,
        damageAmount: dto.damageAmount !== undefined ? new Prisma.Decimal(dto.damageAmount) : undefined,
        currentStatus: ComplaintStatus.NEW,
        contacts: dto.contacts?.length
          ? {
              create: dto.contacts.map((contact) => ({
                contactType: contact.type,
                rawValue: contact.value,
                normalizedValue: contact.value.trim().toLowerCase(),
                label: contact.label,
                isPrimary: contact.isPrimary ?? false
              }))
            }
          : undefined,
        statusHistory: {
          create: {
            toStatus: ComplaintStatus.NEW,
            changedByUserId: user.userId,
            reasonText: "Complaint created"
          }
        }
      },
      include: complaintInclude
    });
  }

  async listMyComplaints(user: AuthenticatedUser, query: ListMyComplaintsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = { citizenUserId: user.userId };
    const [items, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        include: { region: true, fraudType: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.complaint.count({ where })
    ]);

    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getCitizenComplaintById(user: AuthenticatedUser, complaintId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      include: complaintInclude
    });
    if (!complaint) throw new NotFoundException("Complaint not found");
    if (complaint.citizenUserId !== user.userId) throw new ForbiddenException("Access denied");
    return complaint;
  }

  async addCitizenAdditionalInfo(user: AuthenticatedUser, complaintId: string, dto: AdditionalInfoDto) {
    await this.getCitizenComplaintById(user, complaintId);
    await this.prisma.complaintComment.create({
      data: {
        complaintId,
        authorUserId: user.userId,
        visibility: CommentVisibility.CITIZEN,
        commentText: dto.message
      }
    });

    if (dto.contacts?.length) {
      await this.prisma.complaintContact.createMany({
        data: dto.contacts.map((contact) => ({
          complaintId,
          contactType: contact.type,
          rawValue: contact.value,
          normalizedValue: contact.value.trim().toLowerCase(),
          label: contact.label,
          isPrimary: contact.isPrimary ?? false
        })),
        skipDuplicates: true
      });
    }

    return this.getCitizenComplaintById(user, complaintId);
  }

  async listAdminComplaints(query: ListAdminComplaintsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ComplaintWhereInput = {
      currentStatus: query.status,
      regionId: query.regionId,
      fraudTypeId: query.fraudTypeId,
      currentAssigneeEmployeeId: query.assignedToId,
      createdAt: {
        gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
        lte: query.dateTo ? new Date(query.dateTo) : undefined
      },
      OR: query.search
        ? [
            { complaintNumber: { contains: query.search, mode: "insensitive" } },
            { title: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } }
          ]
        : undefined
    };

    const [items, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        include: { region: true, fraudType: true, currentAssigneeEmployee: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.complaint.count({ where })
    ]);

    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getAdminComplaintById(complaintId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      include: complaintInclude
    });
    if (!complaint) throw new NotFoundException("Complaint not found");
    return complaint;
  }

  async updateComplaintStatus(user: AuthenticatedUser, complaintId: string, dto: UpdateComplaintStatusDto) {
    const complaint = await this.getAdminComplaintById(complaintId);
    const terminalStatuses: ComplaintStatus[] = [ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED, ComplaintStatus.DUPLICATE];
    const resolvedAt = terminalStatuses.includes(dto.status)
      ? new Date()
      : null;

    return this.prisma.$transaction(async (tx) => {
      await tx.complaintStatusHistory.create({
        data: {
          complaintId,
          fromStatus: complaint.currentStatus,
          toStatus: dto.status,
          reasonCode: dto.reasonCode,
          reasonText: dto.reasonText,
          changedByUserId: user.userId
        }
      });

      return tx.complaint.update({
        where: { id: complaintId },
        data: {
          currentStatus: dto.status,
          lastStatusChangedAt: new Date(),
          resolvedAt
        },
        include: complaintInclude
      });
    });
  }

  async assignComplaint(user: AuthenticatedUser, complaintId: string, dto: AssignComplaintDto) {
    await this.getAdminComplaintById(complaintId);
    return this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        currentAssigneeEmployeeId: dto.assigneeEmployeeId,
        currentStatus: ComplaintStatus.ASSIGNED,
        statusHistory: {
          create: {
            fromStatus: ComplaintStatus.NEW,
            toStatus: ComplaintStatus.ASSIGNED,
            changedByUserId: user.userId,
            reasonText: "Complaint assigned"
          }
        }
      },
      include: complaintInclude
    });
  }

  async addAdminComment(user: AuthenticatedUser, complaintId: string, dto: AddComplaintCommentDto) {
    await this.getAdminComplaintById(complaintId);
    return this.prisma.complaintComment.create({
      data: {
        complaintId,
        authorUserId: user.userId,
        visibility: dto.visibility ?? CommentVisibility.INTERNAL,
        commentText: dto.text
      }
    });
  }

  async getComplaintHistory(complaintId: string) {
    await this.getAdminComplaintById(complaintId);
    return this.prisma.complaintStatusHistory.findMany({
      where: { complaintId },
      orderBy: { createdAt: "desc" },
      include: { changedByUser: true }
    });
  }

  private async generateComplaintNumber() {
    const year = new Date().getFullYear();
    const count = await this.prisma.complaint.count();
    return `SB-${year}-${String(count + 1).padStart(5, "0")}`;
  }

  private async getDemoCitizenUserId() {
    const user = await this.prisma.user.findFirst({
      where: { email: "citizen@example.com" },
      select: { id: true }
    });
    if (user) return user.id;

    const fallback = await this.prisma.user.findFirst({
      where: { accountType: "CITIZEN" },
      select: { id: true }
    });
    if (!fallback) throw new NotFoundException("Demo citizen user not found");
    return fallback.id;
  }
}
