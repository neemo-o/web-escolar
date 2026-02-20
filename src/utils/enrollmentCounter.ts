import { prisma } from "../config/prisma";

function padNumber(n: number, width = 4) {
  return String(n).padStart(width, "0");
}

export async function nextEnrollmentNumber(schoolId: string, year: number) {
  return prisma.$transaction(async (tx) => {
    const t: any = tx as any;
    const existing = await t.enrollmentCounter.findFirst({
      where: { schoolId, year },
    });

    if (!existing) {
      const created = await t.enrollmentCounter.create({
        data: { schoolId, year, lastNumber: 1 },
      });
      return `${year}-${padNumber(created.lastNumber)}`;
    }

    const updated = await t.enrollmentCounter.update({
      where: { id: existing.id },
      data: { lastNumber: { increment: 1 } },
    });
    return `${year}-${padNumber(updated.lastNumber)}`;
  });
}
