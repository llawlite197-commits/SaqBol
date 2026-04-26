import type { PrismaService } from "../../../prisma/prisma.service";

export async function generateComplaintNumber(prisma: PrismaService) {
  const year = new Date().getFullYear();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const randomPart = Math.floor(100000000 + Math.random() * 900000000);
    const complaintNumber = `SB-${year}-${randomPart}`;

    const existing = await prisma.complaint.findUnique({
      where: {
        complaintNumber
      },
      select: {
        id: true
      }
    });

    if (!existing) {
      return complaintNumber;
    }
  }

  throw new Error("Failed to generate unique complaint number.");
}
