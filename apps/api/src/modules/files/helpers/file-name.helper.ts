import { randomUUID } from "node:crypto";
import { extname } from "node:path";

export function buildSafeStoredFileName(originalName: string) {
  const extension = extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, "");
  return `${Date.now()}-${randomUUID()}${extension}`;
}

export function getSafeDownloadName(originalName: string) {
  return originalName.replace(/["\r\n]/g, "_");
}
