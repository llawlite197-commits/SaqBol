import { ComplaintContactType } from "@saqbol/db";

export function maskContact(type: ComplaintContactType, value: string | null | undefined) {
  const safeValue = (value ?? "").trim();
  if (!safeValue) return "";

  if (type === ComplaintContactType.PHONE) {
    const digits = safeValue.replace(/\D/g, "");
    if (digits.length < 4) return "***";
    const prefix = digits.startsWith("7") ? `+7 ${digits.slice(1, 4)}` : `+${digits.slice(0, 1)} ${digits.slice(1, 4)}`;
    return `${prefix} *** ** ${digits.slice(-2)}`;
  }

  if (type === ComplaintContactType.CARD) {
    const digits = safeValue.replace(/\D/g, "");
    if (digits.length < 8) return "**** **** ****";
    return `${digits.slice(0, 4)} **** **** ${digits.slice(-4)}`;
  }

  if (type === ComplaintContactType.EMAIL) {
    const [localPart, domain] = safeValue.split("@");
    if (!localPart || !domain) return "***@***";
    return `${localPart.slice(0, 1)}***@${domain}`;
  }

  if (type === ComplaintContactType.IBAN) {
    const normalized = safeValue.replace(/\s/g, "").toUpperCase();
    if (normalized.length < 8) return "KZ** ****";
    return `${normalized.slice(0, 2)}** **** **** ${normalized.slice(-4)}`;
  }

  if (type === ComplaintContactType.URL) {
    try {
      return new URL(safeValue).hostname.replace(/^www\./, "");
    } catch {
      return safeValue.replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "");
    }
  }

  return "***";
}
