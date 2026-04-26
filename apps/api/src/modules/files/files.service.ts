import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditAction, FileScanStatus, UserRoleCode } from "@saqbol/db";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { Response } from "express";
import type { Express } from "express";
import type { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { PrismaService } from "../../prisma/prisma.service";
import {
  buildSafeStoredFileName,
  getSafeDownloadName
} from "./helpers/file-name.helper";
import { validateComplaintUploadFile } from "./helpers/file-validation.helper";

@Injectable()
export class FilesService {
  private readonly uploadRoot = process.env.UPLOADS_ROOT ?? resolve(process.cwd(), "..", "..", "uploads");

  constructor(private readonly prisma: PrismaService) {}

  async uploadComplaintFile(
    user: AuthenticatedUser,
    complaintId: string,
    file: Express.Multer.File | undefined
  ) {
    validateComplaintUploadFile(file);

    const complaint = await this.prisma.complaint.findFirst({
      where: {
        id: complaintId,
        citizenUserId: user.userId
      }
    });

    if (!complaint) {
      throw new NotFoundException("Complaint not found.");
    }

    const folder = join(this.uploadRoot, "complaints", complaint.id);
    await mkdir(folder, { recursive: true });

    const storedFileName = buildSafeStoredFileName(file.originalname);
    const objectKey = `complaints/${complaint.id}/${storedFileName}`;
    const absolutePath = join(this.uploadRoot, objectKey);
    const checksumSha256 = createHash("sha256").update(file.buffer).digest("hex");

    await writeFile(absolutePath, file.buffer);

    const complaintFile = await this.prisma.complaintFile.create({
      data: {
        complaintId: complaint.id,
        uploadedByUserId: user.userId,
        originalFileName: file.originalname,
        storageBucket: "local",
        storageObjectKey: objectKey,
        mimeType: file.mimetype || "application/octet-stream",
        fileSizeBytes: BigInt(file.size),
        checksumSha256,
        fileStatus: FileScanStatus.ACTIVE,
        scanCompletedAt: new Date(),
        isInternal: false
      }
    });

    return {
      ...complaintFile,
      fileSizeBytes: Number(complaintFile.fileSizeBytes)
    };
  }

  async downloadComplaintFile(
    user: AuthenticatedUser,
    fileId: string,
    response: Response
  ) {
    const complaintFile = await this.prisma.complaintFile.findFirst({
      where: {
        id: fileId,
        deletedAt: null,
        fileStatus: FileScanStatus.ACTIVE
      },
      include: {
        complaint: true
      }
    });

    if (!complaintFile) {
      throw new NotFoundException("File not found.");
    }

    const isOwner = complaintFile.complaint.citizenUserId === user.userId;
    const isStaff = this.isStaff(user);

    if (!isOwner && !isStaff) {
      throw new ForbiddenException("You do not have access to this file.");
    }

    const absolutePath = join(this.uploadRoot, complaintFile.storageObjectKey);
    await stat(absolutePath);

    if (isStaff) {
      await this.prisma.auditLog.create({
        data: {
          actorUserId: user.userId,
          actionType: AuditAction.FILE_DOWNLOADED,
          entityType: "complaint_file",
          entityId: complaintFile.id,
          metadata: {
            complaintId: complaintFile.complaintId,
            originalFileName: complaintFile.originalFileName
          }
        }
      });
    }

    response.setHeader("Content-Type", complaintFile.mimeType);
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${getSafeDownloadName(complaintFile.originalFileName)}"`
    );

    await new Promise<void>((resolveStream, rejectStream) => {
      createReadStream(absolutePath)
        .on("error", rejectStream)
        .on("end", resolveStream)
        .pipe(response);
    });
  }

  private isStaff(user: AuthenticatedUser) {
    const staffRoles: UserRoleCode[] = [
      UserRoleCode.OPERATOR,
      UserRoleCode.SUPERVISOR,
      UserRoleCode.ADMIN
    ];

    return user.roles.some((role) => staffRoles.includes(role));
  }
}
