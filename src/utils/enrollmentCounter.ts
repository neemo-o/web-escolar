import { prisma } from "../config/prisma";

function padNumber(n: number, width = 4) {
  return String(n).padStart(width, "0");
}

export async function nextEnrollmentNumber(schoolId: string, year: number) {
  const updated = await prisma.enrollmentCounter.upsert({
    where: { schoolId_year: { schoolId, year } },
    create: { schoolId, year, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });

  return `${year}-${padNumber(updated.lastNumber)}`;
}
