import { Injectable } from "@nestjs/common";
import type { AiResponseDto } from "../dto/ai-response.dto";
import type { AiProvider, AiProviderRequest } from "./ai-provider.interface";

@Injectable()
export class MockAiProvider implements AiProvider {
  readonly isMock = true;
  readonly name = "mock";

  async generate(
    request: AiProviderRequest
  ): Promise<Omit<AiResponseDto, "isMock" | "confidence" | "source" | "cannotAnswer">> {
    const suggestedFraudType = this.detectFraudType(request.prompt);
    const redFlags = this.detectRedFlags(request.prompt);

    return {
      riskLevel: request.riskHint,
      answer: this.buildAnswer(request.scenario, request.riskHint, suggestedFraudType),
      redFlags,
      recommendedActions: this.buildActions(request.riskHint),
      suggestedFraudType,
      safetyNotice: "AI не принимает решений вместо сотрудника и не дает юридически значимых заключений.",
      refusalReason: null
    };
  }

  private buildAnswer(scenario: string, risk: "LOW" | "MEDIUM" | "HIGH", fraudType: string | null) {
    if (scenario === "summarize-complaint") {
      return `Краткое summary: обращение содержит признаки категории "${fraudType ?? "требуется уточнение"}". Предварительный риск: ${risk}. Рекомендуется проверить контакты, сумму ущерба, дату инцидента и приложенные доказательства.`;
    }

    if (risk === "HIGH") {
      return "Обнаружены сильные признаки мошенничества. Не переходите по ссылкам, не сообщайте коды, пароли, CVV/CVC и не устанавливайте приложения удаленного доступа.";
    }

    if (risk === "MEDIUM") {
      return "Есть подозрительные признаки. Проверьте источник сообщения, не переводите деньги заранее и сохраните доказательства для обращения.";
    }

    return "Явных критических признаков не обнаружено, но сохраняйте осторожность: проверяйте источник, домен сайта и не передавайте персональные данные.";
  }

  private detectFraudType(text: string) {
    const lowered = text.toLowerCase();
    if (lowered.includes("sms") || lowered.includes("звон") || lowered.includes("код")) return "Телефонное мошенничество";
    if (lowered.includes("http") || lowered.includes("ссылка") || lowered.includes("пароль")) return "Фишинг";
    if (lowered.includes("карта") || lowered.includes("iban") || lowered.includes("банк")) return "Банковские схемы";
    if (lowered.includes("инвест") || lowered.includes("доход") || lowered.includes("крипто")) return "Финансовые пирамиды";
    if (lowered.includes("маркетплейс") || lowered.includes("доставка") || lowered.includes("предоплата")) return "Маркетплейсы";
    return null;
  }

  private detectRedFlags(text: string) {
    const lowered = text.toLowerCase();
    const flags = [
      ["срочно", "Давление срочностью"],
      ["код", "Запрос одноразового кода"],
      ["cvv", "Запрос CVV/CVC"],
      ["пароль", "Запрос пароля"],
      ["http", "Подозрительная ссылка"],
      ["предоплата", "Требование предоплаты"],
      ["удаленный доступ", "Запрос удаленного доступа"]
    ]
      .filter(([signal]) => lowered.includes(signal))
      .map(([, label]) => label);

    return flags.length ? flags : ["Недостаточно данных для уверенной оценки"];
  }

  private buildActions(risk: "LOW" | "MEDIUM" | "HIGH") {
    const base = [
      "Сохраните SMS, ссылку, номер телефона, чек и переписку.",
      "Проверьте данные через SaqBol.kz и официальные каналы организации.",
      "При наличии ущерба подайте жалобу и приложите доказательства."
    ];

    if (risk === "HIGH") {
      return [
        "Не переходите по ссылке и не вводите данные карты.",
        "Позвоните в банк по номеру с официального сайта или карты.",
        "Заблокируйте карту, если данные уже были переданы.",
        ...base
      ];
    }

    return base;
  }
}
