import { createHash, randomUUID } from "node:crypto";

export function generateRefreshToken() {
  return randomUUID();
}

export function generateTokenFamilyId() {
  return randomUUID();
}

export function generateRefreshTokenRecordId() {
  return randomUUID();
}

export function hashToken(rawValue: string) {
  return createHash("sha256").update(rawValue).digest("hex");
}

export function calculateRefreshExpiry(days = 30) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
