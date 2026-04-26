import type { MapStatsResponse, RiskLevel } from "../types";
import { kazakhstanMapMeta } from "./kazakhstan-map-meta";

const complaintCounts: Record<string, number> = {
  ASTANA: 18,
  ALMATY_CITY: 24,
  SHYMKENT: 16,
  AKMOLA: 7,
  AKTOBE: 8,
  ATYRAU: 6,
  EAST_KAZAKHSTAN: 9,
  KARAGANDA: 12,
  KOSTANAY: 7,
  MANGYSTAU: 5,
  PAVLODAR: 8,
  TURKISTAN: 11,
  ZHAMBYL: 9,
  WEST_KAZAKHSTAN: 6,
  KYZYLORDA: 7,
  NORTH_KAZAKHSTAN: 6,
  ALMATY_REGION: 14,
  ABAI: 6,
  ZHETISU: 8,
  ULYTAU: 4
};

function riskByCount(count: number): RiskLevel {
  if (count >= 10) return "HIGH";
  if (count >= 6) return "MEDIUM";
  return "LOW";
}

export const demoMapStats: MapStatsResponse = {
  regions: Object.values(kazakhstanMapMeta).map((region) => {
    const totalComplaints = complaintCounts[region.code] ?? 3;

    return {
      id: region.code,
      code: region.code,
      nameRu: region.nameRu,
      nameKz: region.nameKz,
      totalComplaints,
      totalDamageAmount: totalComplaints * 450000,
      fraudTypes: [
        {
          id: `${region.code}-phone`,
          nameRu: "Телефонное мошенничество",
          nameKz: "Телефон арқылы алаяқтық",
          count: Math.max(1, Math.round(totalComplaints * 0.45))
        },
        {
          id: `${region.code}-phishing`,
          nameRu: "Фишинговые ссылки",
          nameKz: "Фишинг сілтемелері",
          count: Math.max(1, Math.round(totalComplaints * 0.3))
        }
      ],
      scammerContacts: [
        {
          type: "PHONE",
          value: "+7 701 *** ** 67",
          riskLevel: riskByCount(totalComplaints),
          complaintsCount: Math.max(1, Math.round(totalComplaints / 3))
        },
        {
          type: "URL",
          value: "fake-bank-login.kz",
          riskLevel: totalComplaints >= 10 ? "HIGH" : "MEDIUM",
          complaintsCount: Math.max(1, Math.round(totalComplaints / 4))
        }
      ]
    };
  }),
  summary: {
    totalComplaints: Object.values(complaintCounts).reduce((sum, count) => sum + count, 0),
    totalRegions: 20,
    topRegion: {
      id: "ALMATY_CITY",
      code: "ALMATY_CITY",
      nameRu: kazakhstanMapMeta.ALMATY_CITY.nameRu,
      nameKz: kazakhstanMapMeta.ALMATY_CITY.nameKz,
      totalComplaints: complaintCounts.ALMATY_CITY
    },
    topFraudType: {
      id: "phone",
      nameRu: "Телефонное мошенничество",
      nameKz: "Телефон арқылы алаяқтық",
      count: 54
    }
  }
};
