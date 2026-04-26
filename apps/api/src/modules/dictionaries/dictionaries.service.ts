import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditAction } from "@saqbol/db";
import type { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateFraudTypeDto } from "./dto/create-fraud-type.dto";
import { CreateRegionDto } from "./dto/create-region.dto";
import { UpdateFraudTypeDto } from "./dto/update-fraud-type.dto";
import { UpdateRegionDto } from "./dto/update-region.dto";

@Injectable()
export class DictionariesService {
  constructor(private readonly prisma: PrismaService) {}

  getPublicRegions() {
    return this.prisma.region.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        {
          sortOrder: "asc"
        },
        {
          nameRu: "asc"
        }
      ]
    });
  }

  getPublicFraudTypes() {
    return this.prisma.fraudType.findMany({
      where: {
        isActive: true,
        deletedAt: null
      },
      orderBy: [
        {
          sortOrder: "asc"
        },
        {
          nameRu: "asc"
        }
      ]
    });
  }

  async createRegion(user: AuthenticatedUser, dto: CreateRegionDto) {
    const region = await this.prisma.region.create({
      data: {
        code: dto.code,
        kind: dto.kind,
        nameRu: dto.nameRu,
        nameKz: dto.nameKz ?? dto.nameRu,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true
      }
    });

    await this.writeDictionaryAudit(user, "region", region.id, "created", region.code);
    return region;
  }

  async updateRegion(user: AuthenticatedUser, id: string, dto: UpdateRegionDto) {
    await this.ensureRegionExists(id);

    const region = await this.prisma.region.update({
      where: {
        id
      },
      data: {
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.kind !== undefined ? { kind: dto.kind } : {}),
        ...(dto.nameRu !== undefined ? { nameRu: dto.nameRu } : {}),
        ...(dto.nameKz !== undefined ? { nameKz: dto.nameKz ?? dto.nameRu ?? "" } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {})
      }
    });

    await this.writeDictionaryAudit(user, "region", region.id, "updated", region.code);
    return region;
  }

  async deactivateRegion(user: AuthenticatedUser, id: string) {
    await this.ensureRegionExists(id);

    const linkedComplaints = await this.prisma.complaint.count({
      where: {
        regionId: id
      }
    });

    if (linkedComplaints > 0) {
      const region = await this.prisma.region.update({
        where: {
          id
        },
        data: {
          isActive: false
        }
      });
      await this.writeDictionaryAudit(user, "region", id, "deactivated", region.code);
      return region;
    }

    const region = await this.prisma.region.update({
      where: {
        id
      },
      data: {
        isActive: false
      }
    });

    await this.writeDictionaryAudit(user, "region", id, "deactivated", region.code);
    return region;
  }

  async createFraudType(user: AuthenticatedUser, dto: CreateFraudTypeDto) {
    const fraudType = await this.prisma.fraudType.create({
      data: {
        code: dto.code,
        nameRu: dto.nameRu,
        nameKz: dto.nameKz ?? dto.nameRu,
        descriptionRu: dto.descriptionRu ?? null,
        descriptionKz: dto.descriptionKz ?? null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true
      }
    });

    await this.writeDictionaryAudit(user, "fraud_type", fraudType.id, "created", fraudType.code);
    return fraudType;
  }

  async updateFraudType(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateFraudTypeDto
  ) {
    await this.ensureFraudTypeExists(id);

    const fraudType = await this.prisma.fraudType.update({
      where: {
        id
      },
      data: {
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.nameRu !== undefined ? { nameRu: dto.nameRu } : {}),
        ...(dto.nameKz !== undefined ? { nameKz: dto.nameKz ?? dto.nameRu ?? "" } : {}),
        ...(dto.descriptionRu !== undefined
          ? { descriptionRu: dto.descriptionRu ?? null }
          : {}),
        ...(dto.descriptionKz !== undefined
          ? { descriptionKz: dto.descriptionKz ?? null }
          : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {})
      }
    });

    await this.writeDictionaryAudit(user, "fraud_type", fraudType.id, "updated", fraudType.code);
    return fraudType;
  }

  async archiveFraudType(user: AuthenticatedUser, id: string) {
    const fraudType = await this.ensureFraudTypeExists(id);

    const linkedComplaints = await this.prisma.complaint.count({
      where: {
        fraudTypeId: id
      }
    });

    if (linkedComplaints > 0 && fraudType.isActive === false) {
      throw new BadRequestException("Fraud type is already inactive.");
    }

    const archivedFraudType = await this.prisma.fraudType.update({
      where: {
        id
      },
      data: {
        isActive: false,
        deletedAt: new Date()
      }
    });

    await this.writeDictionaryAudit(
      user,
      "fraud_type",
      archivedFraudType.id,
      "archived",
      archivedFraudType.code
    );

    return archivedFraudType;
  }

  private async ensureRegionExists(id: string) {
    const region = await this.prisma.region.findUnique({
      where: {
        id
      }
    });

    if (!region) {
      throw new NotFoundException("Region not found.");
    }

    return region;
  }

  private async ensureFraudTypeExists(id: string) {
    const fraudType = await this.prisma.fraudType.findUnique({
      where: {
        id
      }
    });

    if (!fraudType) {
      throw new NotFoundException("Fraud type not found.");
    }

    return fraudType;
  }

  private writeDictionaryAudit(
    user: AuthenticatedUser,
    dictionaryType: string,
    entityId: string,
    operation: string,
    code: string
  ) {
    return this.prisma.auditLog.create({
      data: {
        actorUserId: user.userId,
        actionType: AuditAction.SETTING_UPDATED,
        entityType: dictionaryType,
        entityId,
        metadata: {
          operation,
          code
        }
      }
    });
  }
}
