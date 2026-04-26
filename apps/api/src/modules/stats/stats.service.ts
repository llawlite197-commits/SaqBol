import { Injectable } from "@nestjs/common";
import { ComplaintContactType, ComplaintStatus, RiskLevel } from "@saqbol/db";
import { PrismaService } from "../../prisma/prisma.service";
import { maskContact } from "./helpers/mask-contact";

type CountById = {
  id: string;
  total: number;
};

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicStats() {
    const [
      totalComplaints,
      resolvedCount,
      complaintsByRegion,
      complaintsByFraudType,
      publicMapData
    ] = await Promise.all([
      this.prisma.complaint.count(),
      this.prisma.complaint.count({
        where: {
          currentStatus: ComplaintStatus.RESOLVED
        }
      }),
      this.getComplaintsByRegion(),
      this.getComplaintsByFraudType(),
      this.getPublicMapData()
    ]);

    return {
      totalComplaints,
      resolvedCount,
      complaintsByRegion,
      complaintsByFraudType,
      publicMapData
    };
  }

  async getMapStats() {
    const regions = await this.prisma.region.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" }
    });

    const [complaints, fraudTypeCounts, contactCounts, activeBlacklistEntries] = await Promise.all([
      this.prisma.complaint.findMany({
        select: {
          id: true,
          regionId: true,
          damageAmount: true
        }
      }),
      this.prisma.complaint.groupBy({
        by: ["regionId", "fraudTypeId"],
        _count: { _all: true }
      }),
      this.prisma.complaintContact.groupBy({
        by: ["contactType", "normalizedValue"],
        where: {
          normalizedValue: { not: null }
        },
        _count: { _all: true }
      }),
      this.prisma.blacklistEntry.findMany({
        where: {
          isActive: true,
          deletedAt: null
        },
        select: {
          entryType: true,
          normalizedValue: true
        }
      })
    ]);

    const fraudTypeIds = [...new Set(fraudTypeCounts.map((item) => item.fraudTypeId))];
    const fraudTypes = await this.prisma.fraudType.findMany({
      where: { id: { in: fraudTypeIds } }
    });
    const fraudTypeMap = new Map(fraudTypes.map((item) => [item.id, item]));

    const complaintsByRegion = new Map<string, typeof complaints>();
    for (const complaint of complaints) {
      const current = complaintsByRegion.get(complaint.regionId) ?? [];
      current.push(complaint);
      complaintsByRegion.set(complaint.regionId, current);
    }

    const fraudCountsByRegion = new Map<string, typeof fraudTypeCounts>();
    for (const item of fraudTypeCounts) {
      const current = fraudCountsByRegion.get(item.regionId) ?? [];
      current.push(item);
      fraudCountsByRegion.set(item.regionId, current);
    }

    const blacklistSet = new Set(
      activeBlacklistEntries.map((item) => `${item.entryType}:${item.normalizedValue}`)
    );

    const contactComplaintCounts = new Map<string, number>();
    for (const item of contactCounts) {
      if (!item.normalizedValue) continue;
      contactComplaintCounts.set(
        `${item.contactType}:${item.normalizedValue}`,
        item._count._all
      );
    }

    const contacts = await this.prisma.complaintContact.findMany({
      where: { normalizedValue: { not: null } },
      select: {
        contactType: true,
        rawValue: true,
        normalizedValue: true,
        complaint: {
          select: {
            regionId: true
          }
        }
      }
    });

    const contactsByRegionAndValue = new Map<string, {
      type: ComplaintContactType;
      value: string;
      complaintsCount: number;
      riskLevel: RiskLevel;
    }>();

    for (const contact of contacts) {
      if (!contact.normalizedValue) continue;
      const contactKey = `${contact.contactType}:${contact.normalizedValue}`;
      const regionContactKey = `${contact.complaint.regionId}:${contactKey}`;
      const complaintsCount = contactComplaintCounts.get(contactKey) ?? 1;
      const isBlacklisted = blacklistSet.has(contactKey);
      const riskLevel = this.calculateRiskLevel(complaintsCount, isBlacklisted);

      if (!contactsByRegionAndValue.has(regionContactKey)) {
        contactsByRegionAndValue.set(regionContactKey, {
          type: contact.contactType,
          value: maskContact(contact.contactType, contact.rawValue),
          complaintsCount,
          riskLevel
        });
      }
    }

    const contactItemsByRegion = new Map<string, Array<{
      type: ComplaintContactType;
      value: string;
      complaintsCount: number;
      riskLevel: RiskLevel;
    }>>();

    for (const [key, value] of contactsByRegionAndValue.entries()) {
      const regionId = key.split(":")[0];
      const current = contactItemsByRegion.get(regionId) ?? [];
      current.push(value);
      contactItemsByRegion.set(regionId, current);
    }

    const regionsPayload = regions.map((region) => {
      const regionComplaints = complaintsByRegion.get(region.id) ?? [];
      const totalDamageAmount = regionComplaints.reduce((sum, complaint) => {
        const amount = complaint.damageAmount ? Number(complaint.damageAmount) : 0;
        return sum + amount;
      }, 0);

      const fraudTypesPayload = (fraudCountsByRegion.get(region.id) ?? [])
        .map((item) => {
          const fraudType = fraudTypeMap.get(item.fraudTypeId);
          return {
            id: item.fraudTypeId,
            nameRu: fraudType?.nameRu ?? "Не указано",
            nameKz: fraudType?.nameKz ?? null,
            count: item._count._all
          };
        })
        .sort((left, right) => right.count - left.count);

      const scammerContacts = (contactItemsByRegion.get(region.id) ?? [])
        .sort((left, right) => right.complaintsCount - left.complaintsCount)
        .slice(0, 8);

      return {
        id: region.id,
        code: region.code,
        nameRu: region.nameRu,
        nameKz: region.nameKz,
        totalComplaints: regionComplaints.length,
        totalDamageAmount,
        fraudTypes: fraudTypesPayload,
        scammerContacts
      };
    });

    const topRegion = [...regionsPayload].sort((left, right) => right.totalComplaints - left.totalComplaints)[0] ?? null;
    const allFraudTypes = regionsPayload.flatMap((region) => region.fraudTypes);
    const fraudSummary = new Map<string, { id: string; nameRu: string; nameKz: string | null; count: number }>();
    for (const fraudType of allFraudTypes) {
      const current = fraudSummary.get(fraudType.id) ?? {
        id: fraudType.id,
        nameRu: fraudType.nameRu,
        nameKz: fraudType.nameKz,
        count: 0
      };
      current.count += fraudType.count;
      fraudSummary.set(fraudType.id, current);
    }
    const topFraudType = [...fraudSummary.values()].sort((left, right) => right.count - left.count)[0] ?? null;

    return {
      regions: regionsPayload,
      summary: {
        totalComplaints: complaints.length,
        totalRegions: regions.length,
        topRegion: topRegion
          ? {
              id: topRegion.id,
              code: topRegion.code,
              nameRu: topRegion.nameRu,
              nameKz: topRegion.nameKz,
              totalComplaints: topRegion.totalComplaints
            }
          : null,
        topFraudType
      }
    };
  }

  async getAdminDashboardStats() {
    const now = new Date();
    const overdueThreshold = new Date(now);
    overdueThreshold.setDate(overdueThreshold.getDate() - 3);

    const [
      newComplaints,
      inProgress,
      resolved,
      rejected,
      overdueSlaMock,
      complaintsByStatus,
      complaintsByRegion,
      complaintsTrend
    ] = await Promise.all([
      this.prisma.complaint.count({
        where: {
          currentStatus: ComplaintStatus.NEW
        }
      }),
      this.prisma.complaint.count({
        where: {
          currentStatus: {
            in: [
              ComplaintStatus.UNDER_REVIEW,
              ComplaintStatus.ASSIGNED,
              ComplaintStatus.IN_PROGRESS,
              ComplaintStatus.NEED_INFO
            ]
          }
        }
      }),
      this.prisma.complaint.count({
        where: {
          currentStatus: ComplaintStatus.RESOLVED
        }
      }),
      this.prisma.complaint.count({
        where: {
          currentStatus: ComplaintStatus.REJECTED
        }
      }),
      this.prisma.complaint.count({
        where: {
          createdAt: {
            lt: overdueThreshold
          },
          currentStatus: {
            in: [
              ComplaintStatus.NEW,
              ComplaintStatus.UNDER_REVIEW,
              ComplaintStatus.ASSIGNED,
              ComplaintStatus.IN_PROGRESS,
              ComplaintStatus.NEED_INFO
            ]
          }
        }
      }),
      this.getComplaintsByStatus(),
      this.getComplaintsByRegion(),
      this.getComplaintsTrend(14)
    ]);

    return {
      cards: {
        newComplaints,
        inProgress,
        resolved,
        rejected,
        overdueSlaMock
      },
      complaintsByStatus,
      complaintsByRegion,
      complaintsTrend
    };
  }

  private async getComplaintsByStatus() {
    const grouped = await this.prisma.complaint.groupBy({
      by: ["currentStatus"],
      _count: {
        _all: true
      },
      orderBy: {
        currentStatus: "asc"
      }
    });

    return grouped.map((item) => ({
      status: item.currentStatus,
      total: item._count._all
    }));
  }

  private async getComplaintsByRegion() {
    const grouped = await this.prisma.complaint.groupBy({
      by: ["regionId"],
      _count: {
        _all: true
      }
    });

    const counts = grouped
      .map((item) => ({
        id: item.regionId,
        total: item._count._all
      }))
      .sort((left, right) => right.total - left.total);

    const regions = await this.prisma.region.findMany({
      where: {
        id: {
          in: counts.map((item) => item.id)
        }
      }
    });

    return this.attachDictionaryLabels(counts, regions);
  }

  private async getComplaintsByFraudType() {
    const grouped = await this.prisma.complaint.groupBy({
      by: ["fraudTypeId"],
      _count: {
        _all: true
      }
    });

    const counts = grouped
      .map((item) => ({
        id: item.fraudTypeId,
        total: item._count._all
      }))
      .sort((left, right) => right.total - left.total);

    const fraudTypes = await this.prisma.fraudType.findMany({
      where: {
        id: {
          in: counts.map((item) => item.id)
        }
      }
    });

    return this.attachDictionaryLabels(counts, fraudTypes);
  }

  private async getPublicMapData() {
    const [regions, totalByRegion, resolvedByRegion] = await Promise.all([
      this.prisma.region.findMany({
        where: {
          isActive: true
        },
        orderBy: {
          sortOrder: "asc"
        }
      }),
      this.prisma.complaint.groupBy({
        by: ["regionId"],
        _count: {
          _all: true
        }
      }),
      this.prisma.complaint.groupBy({
        by: ["regionId"],
        where: {
          currentStatus: ComplaintStatus.RESOLVED
        },
        _count: {
          _all: true
        }
      })
    ]);

    const totalMap = new Map(totalByRegion.map((item) => [item.regionId, item._count._all]));
    const resolvedMap = new Map(
      resolvedByRegion.map((item) => [item.regionId, item._count._all])
    );

    return regions.map((region) => ({
      regionId: region.id,
      code: region.code,
      nameRu: region.nameRu,
      nameKz: region.nameKz,
      totalComplaints: totalMap.get(region.id) ?? 0,
      resolvedComplaints: resolvedMap.get(region.id) ?? 0
    }));
  }

  private async getComplaintsTrend(days: number) {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (days - 1));

    const complaints = await this.prisma.complaint.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      select: {
        createdAt: true
      }
    });

    const buckets = new Map<string, number>();
    for (let index = 0; index < days; index += 1) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      buckets.set(this.formatDateKey(date), 0);
    }

    for (const complaint of complaints) {
      const key = this.formatDateKey(complaint.createdAt);
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
    }

    return Array.from(buckets.entries()).map(([date, total]) => ({
      date,
      total
    }));
  }

  private attachDictionaryLabels<T extends { id: string; code: string; nameRu: string; nameKz: string | null }>(
    counts: CountById[],
    dictionaryItems: T[]
  ) {
    const dictionaryMap = new Map(dictionaryItems.map((item) => [item.id, item]));

    return counts.map((item) => {
      const dictionaryItem = dictionaryMap.get(item.id);

      return {
        id: item.id,
        code: dictionaryItem?.code ?? null,
        nameRu: dictionaryItem?.nameRu ?? "Не указано",
        nameKz: dictionaryItem?.nameKz ?? null,
        total: item.total
      };
    });
  }

  private formatDateKey(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private calculateRiskLevel(complaintsCount: number, isBlacklisted: boolean): RiskLevel {
    if (isBlacklisted || complaintsCount >= 5) return RiskLevel.HIGH;
    if (complaintsCount >= 2) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }
}
