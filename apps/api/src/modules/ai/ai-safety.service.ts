import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";

export type SafetyResult = {
  allowed: boolean;
  sanitizedInput: string;
  inputHash: string;
  flags: string[];
  refusalReason?: string;
};

@Injectable()
export class AiSafetyService {
  private readonly forbiddenPatterns = [
    {
      flag: "legal_advice",
      pattern: /(подай\s+иск|как\s+выиграть\s+суд|юридическ(ая|ую)\s+консультац|составь\s+исков)/i,
      reason: "AI-ассистент не предоставляет юридические консультации."
    },
    {
      flag: "money_back_promise",
      pattern: /(гарантируй|обещай).*(вернуть|возврат).*(деньги|средств)/i,
      reason: "AI-ассистент не может обещать возврат денег."
    },
    {
      flag: "rbac_bypass",
      pattern: /(обойти\s+доступ|обойти\s+rbac|дай\s+чужие\s+данные|покажи\s+персональные\s+данные)/i,
      reason: "AI-ассистент не помогает обходить права доступа и раскрывать персональные данные."
    },
    {
      flag: "accuse_person",
      pattern: /(признай|объяви|докажи).*(мошенник|виновен|преступник)/i,
      reason: "AI-ассистент не обвиняет конкретных лиц и не принимает юридически значимые решения."
    }
  ];

  inspect(rawInput: string, maxLength = 4000): SafetyResult {
    const clipped = rawInput.slice(0, maxLength);
    const sanitizedInput = this.redactSensitiveData(clipped);
    const matched = this.forbiddenPatterns.find((rule) => rule.pattern.test(clipped));
    const flags = this.forbiddenPatterns
      .filter((rule) => rule.pattern.test(clipped))
      .map((rule) => rule.flag);

    return {
      allowed: !matched,
      sanitizedInput,
      inputHash: this.hash(sanitizedInput),
      flags,
      refusalReason: matched?.reason
    };
  }

  buildRefusal(reason: string) {
    return {
      riskLevel: "LOW" as const,
      answer:
        "Я не могу выполнить этот запрос в рамках правил безопасности SaqBol.kz. Могу помочь описать ситуацию, подготовить факты для жалобы или объяснить общие признаки мошенничества.",
      redFlags: [],
      recommendedActions: [
        "Не передавайте персональные данные, коды и пароли.",
        "Если есть ущерб, обратитесь в банк и подайте обращение через SaqBol.kz.",
        "За юридической консультацией обратитесь к квалифицированному специалисту."
      ],
      suggestedFraudType: null,
      safetyNotice: "AI не принимает решений вместо сотрудника и не дает юридически значимых заключений.",
      isMock: true,
      refusalReason: reason,
      confidence: "LOW" as const,
      source: "RULE_BASED" as const,
      cannotAnswer: true
    };
  }

  redactSensitiveData(value: string): string {
    return value
      .replace(/\b\d{12}\b/g, "[IIN_REDACTED]")
      .replace(/\b(?:\d[ -]*?){13,19}\b/g, "[CARD_REDACTED]")
      .replace(/\bKZ\d{2}[A-Z0-9]{13}\b/gi, "[IBAN_REDACTED]")
      .replace(/\+?7[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g, "[PHONE_REDACTED]")
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL_REDACTED]");
  }

  detectRisk(text: string): "LOW" | "MEDIUM" | "HIGH" {
    const lowered = text.toLowerCase();
    const highSignals = [
      "код из sms",
      "код sms",
      "пароль",
      "cvv",
      "cvc",
      "удаленный доступ",
      "anydesk",
      "teamviewer",
      "заблокирована карта",
      "срочно",
      "перейдите по ссылке",
      "оплатите комиссию"
    ];
    const mediumSignals = ["выигрыш", "розыгрыш", "инвестиции", "крипто", "маркетплейс", "предоплата", "доставка"];
    if (highSignals.some((signal) => lowered.includes(signal))) return "HIGH";
    if (mediumSignals.some((signal) => lowered.includes(signal))) return "MEDIUM";
    return "LOW";
  }

  private hash(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }
}
