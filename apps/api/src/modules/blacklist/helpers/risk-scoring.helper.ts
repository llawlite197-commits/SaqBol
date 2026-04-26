import { RiskLevel } from "@saqbol/db";

export function calculateRiskLevel(params: {
  hasActiveBlacklistEntry: boolean;
  complaintCount: number;
}): RiskLevel {
  if (params.hasActiveBlacklistEntry || params.complaintCount > 5) {
    return RiskLevel.HIGH;
  }

  if (params.complaintCount >= 2 && params.complaintCount <= 5) {
    return RiskLevel.MEDIUM;
  }

  return RiskLevel.LOW;
}

export function buildRiskExplanation(params: {
  riskLevel: RiskLevel;
  hasActiveBlacklistEntry: boolean;
  complaintCount: number;
  typeLabel: string;
}) {
  if (params.riskLevel === RiskLevel.HIGH) {
    if (params.hasActiveBlacklistEntry) {
      return `Обнаружены признаки высокого риска: значение этого типа уже присутствует в активном реестре подозрительных данных.`;
    }

    return `Обнаружены признаки высокого риска: значение этого типа встречается более чем в пяти обращениях.`;
  }

  if (params.riskLevel === RiskLevel.MEDIUM) {
    return `Обнаружены признаки среднего риска: значение этого типа встречается в нескольких жалобах.`;
  }

  return `На текущий момент не выявлено значимых признаков риска по проверяемому ${params.typeLabel.toLowerCase()}.`;
}
