import { BadRequestException } from "@nestjs/common";
import { extname } from "node:path";
import type { Express } from "express";

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx"]);
const maxFileSizeBytes = 10 * 1024 * 1024;

export function validateComplaintUploadFile(
  file: Express.Multer.File | undefined
): asserts file is Express.Multer.File {
  if (!file) {
    throw new BadRequestException("File is required.");
  }

  const extension = extname(file.originalname).toLowerCase();

  if (!allowedExtensions.has(extension)) {
    throw new BadRequestException("Unsupported file type.");
  }

  if (file.size > maxFileSizeBytes) {
    throw new BadRequestException("File size limit is 10MB.");
  }
}

export const complaintUploadLimits = {
  fileSize: maxFileSizeBytes
};
