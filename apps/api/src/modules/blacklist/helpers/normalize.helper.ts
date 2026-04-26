import { ComplaintContactType } from "@saqbol/db";

export function normalizeSuspiciousValue(type: ComplaintContactType, value: string) {
  const trimmed = value.trim();

  switch (type) {
    case ComplaintContactType.PHONE:
      return trimmed.replace(/[^\d+]/g, "");
    case ComplaintContactType.EMAIL:
      return trimmed.toLowerCase();
    case ComplaintContactType.URL: {
      const raw = trimmed.toLowerCase();

      try {
        const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
        return `${parsed.hostname}${parsed.pathname}${parsed.search}`;
      } catch {
        return raw;
      }
    }
    case ComplaintContactType.CARD:
    case ComplaintContactType.IBAN:
      return trimmed.replace(/\s+/g, "").toUpperCase();
    default:
      return trimmed;
  }
}
