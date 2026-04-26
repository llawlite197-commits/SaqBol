import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  AuditAction,
  BlacklistSource,
  ComplaintContactType,
  Prisma,
  RequestSource
} from "@saqbol/db";
import type { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { PrismaService } from "../../prisma/prisma.service";
import { CheckBlacklistDto } from "./dto/check-blacklist.dto";
import { CreateBlacklistEntryDto } from "./dto/create-blacklist-entry.dto";
import { ListAdminBlacklistDto } from "./dto/list-admin-blacklist.dto";
import { ListMyCheckHistoryDto } from "./dto/list-my-check-history.dto";
import { UpdateBlacklistEntryDto } from "./dto/update-blacklist-entry.dto";
import { normalizeSuspiciousValue } from "./helpers/normalize.helper";
import {
  buildRiskExplanation,
  calculateRiskLevel
} from "./helpers/risk-scoring.helper";

@Injectable()
export class BlacklistService {
  constructor(private readonly prisma: PrismaService) {}

  async checkValue(params: {
    dto: CheckBlacklistDto;
    user?: AuthenticatedUser | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const normalizedValue = normalizeSuspiciousValue(params.dto.type, params.dto.value);

    const [matchedEntry, complaintMatches] = await Promise.all([
      this.prisma.blacklistEntry.findFirst({
        where: {
          entryType: params.dto.type,
          normalizedValue,
          isActive: true,
          deletedAt: null
        },
        include: {
          fraudType: true,
          region: true
        }
      }),
      this.prisma.complaintContact.findMany({
        where: {
          contactType: params.dto.type,
          normalizedValue
        },
        distinct: ["complaintId"],
        select: {
          complaintId: true
        }
      })
    ]);

    const complaintCount = complaintMatches.length;
    const riskLevel = calculateRiskLevel({
      hasActiveBlacklistEntry: Boolean(matchedEntry),
      complaintCount
    });

    const explanation = buildRiskExplanation({
      riskLevel,
      hasActiveBlacklistEntry: Boolean(matchedEntry),
      complaintCount,
      typeLabel: params.dto.type
    });

    const responsePayload = {
      type: params.dto.type,
      normalizedValue,
      riskLevel,
      complaintCount,
      matchFound: Boolean(matchedEntry),
      explanation
    };

    await this.prisma.blacklistCheck.create({
      data: {
        checkedByUserId: params.user?.userId ?? null,
        checkType: params.dto.type,
        inputValue: params.dto.value,
        normalizedValue,
        matchedBlacklistEntryId: matchedEntry?.id ?? null,
        matchFound: Boolean(matchedEntry),
        matchCount: complaintCount,
        source: RequestSource.PUBLIC_WEB,
        requestIp: params.ip ?? null,
        userAgent: params.userAgent?.toString() ?? null,
        responsePayload
      }
    });

    return {
      type: params.dto.type,
      value: params.dto.value,
      normalizedValue,
      riskLevel,
      complaintCount,
      matchFound: Boolean(matchedEntry),
      explanation
    };
  }

  async getMyCheckHistory(user: AuthenticatedUser, query: ListMyCheckHistoryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      checkedByUserId: user.userId,
      ...(query.type ? { checkType: query.type } : {})
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.blacklistCheck.findMany({
        where,
        orderBy: {
          createdAt: "desc"
        },
        skip,
        take: limit
      }),
      this.prisma.blacklistCheck.count({ where })
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

  async listAdminBlacklist(query: ListAdminBlacklistDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(query.type ? { entryType: query.type } : {}),
      ...(query.regionId ? { regionId: query.regionId } : {}),
      ...(query.fraudTypeId ? { fraudTypeId: query.fraudTypeId } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              {
                rawValue: {
                  contains: query.search,
                  mode: "insensitive" as const
                }
              },
              {
                normalizedValue: {
                  contains: query.search,
                  mode: "insensitive" as const
                }
              },
              {
                notes: {
                  contains: query.search,
                  mode: "insensitive" as const
                }
              }
            ]
          }
        : {})
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.blacklistEntry.findMany({
        where,
        include: {
          fraudType: true,
          region: true,
          sourceComplaint: {
            select: {
              id: true,
              complaintNumber: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        skip,
        take: limit
      }),
      this.prisma.blacklistEntry.count({ where })
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

  async createBlacklistEntry(user: AuthenticatedUser, dto: CreateBlacklistEntryDto) {
    const normalizedValue = normalizeSuspiciousValue(dto.type, dto.value);

    const existing = await this.prisma.blacklistEntry.findFirst({
      where: {
        entryType: dto.type,
        normalizedValue,
        deletedAt: null
      }
    });

    if (existing) {
      throw new BadRequestException("Blacklist entry already exists for this value.");
    }

    const entry = await this.prisma.blacklistEntry.create({
      data: {
        entryType: dto.type,
        rawValue: dto.value,
        normalizedValue,
        fraudTypeId: dto.fraudTypeId ?? null,
        regionId: dto.regionId ?? null,
        sourceComplaintId: dto.sourceComplaintId ?? null,
        sourceType: dto.sourceType ?? BlacklistSource.MANUAL,
        notes: dto.notes ?? null,
        riskScore: dto.riskScore ?? 80,
        isActive: dto.isActive ?? true,
        lastSeenAt: dto.lastSeenAt ? new Date(dto.lastSeenAt) : null
      }
    });

    await this.writeAdminAuditLog(user, AuditAction.BLACKLIST_ENTRY_CREATED, entry.id, null, {
      rawValue: entry.rawValue,
      normalizedValue: entry.normalizedValue,
      entryType: entry.entryType,
      isActive: entry.isActive
    });

    return entry;
  }

  async updateBlacklistEntry(
    user: AuthenticatedUser,
    entryId: string,
    dto: UpdateBlacklistEntryDto
  ) {
    const existing = await this.prisma.blacklistEntry.findUnique({
      where: {
        id: entryId
      }
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundException("Blacklist entry not found.");
    }

    const nextType = dto.type ?? existing.entryType;
    const nextRawValue = dto.value ?? existing.rawValue;
    const normalizedValue = normalizeSuspiciousValue(nextType, nextRawValue);

    const updated = await this.prisma.blacklistEntry.update({
      where: {
        id: entryId
      },
      data: {
        entryType: nextType,
        rawValue: nextRawValue,
        normalizedValue,
        fraudTypeId: dto.fraudTypeId ?? existing.fraudTypeId,
        regionId: dto.regionId ?? existing.regionId,
        sourceType: dto.sourceType ?? existing.sourceType,
        sourceComplaintId:
          dto.sourceComplaintId !== undefined
            ? dto.sourceComplaintId
            : existing.sourceComplaintId,
        notes: dto.notes !== undefined ? dto.notes : existing.notes,
        riskScore: dto.riskScore ?? existing.riskScore,
        isActive: dto.isActive ?? existing.isActive,
        lastSeenAt:
          dto.lastSeenAt !== undefined
            ? new Date(dto.lastSeenAt)
            : existing.lastSeenAt
      }
    });

    await this.writeAdminAuditLog(
      user,
      AuditAction.BLACKLIST_ENTRY_UPDATED,
      updated.id,
      {
        rawValue: existing.rawValue,
        normalizedValue: existing.normalizedValue,
        entryType: existing.entryType,
        riskScore: existing.riskScore
      },
      {
        rawValue: updated.rawValue,
        normalizedValue: updated.normalizedValue,
        entryType: updated.entryType,
        riskScore: updated.riskScore
      }
    );

    return updated;
  }

  async deleteBlacklistEntry(user: AuthenticatedUser, entryId: string) {
    const existing = await this.prisma.blacklistEntry.findUnique({
      where: {
        id: entryId
      }
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundException("Blacklist entry not found.");
    }

    const deleted = await this.prisma.blacklistEntry.update({
      where: {
        id: entryId
      },
      data: {
        isActive: false,
        deletedAt: new Date()
      }
    });

    await this.writeAdminAuditLog(
      user,
      AuditAction.BLACKLIST_ENTRY_DELETED,
      deleted.id,
      {
        rawValue: existing.rawValue,
        normalizedValue: existing.normalizedValue,
        entryType: existing.entryType,
        isActive: existing.isActive
      },
      {
        rawValue: deleted.rawValue,
        normalizedValue: deleted.normalizedValue,
        entryType: deleted.entryType,
        isActive: deleted.isActive
      }
    );

    return {
      success: true
    };
  }

  private async writeAdminAuditLog(
    user: AuthenticatedUser,
    actionType: AuditAction,
    entityId: string,
    oldValues: Record<string, unknown> | null,
    newValues: Record<string, unknown> | null
  ) {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.userId,
        actionType,
        entityType: "blacklist_entry",
        entityId,
        oldValues: oldValues ? (oldValues as Prisma.InputJsonValue) : undefined,
        newValues: newValues ? (newValues as Prisma.InputJsonValue) : undefined,
        metadata: {
          scope: "admin-blacklist"
        }
      }
    });
  }
}
