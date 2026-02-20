import { prisma } from "../config/prisma";

function padNumber(n: number, width = 4) {
  return String(n).padStart(width, "0");
}

export async function nextEnrollmentNumber(schoolId: string, year: number) {
  // Fallback implementation when a dedicated counter table is not available in Prisma client.
  // Find the last enrollment for the given year by matching enrollmentNumber prefix.
  const prefix = `${year}-`;
  const last = await prisma.enrollment.findFirst({
    where: { schoolId, enrollmentNumber: { startsWith: prefix } },
    orderBy: { createdAt: "desc" },
    select: { enrollmentNumber: true },
  });

  const lastNumber = last
    ? parseInt(String(last.enrollmentNumber).split("-")[1] || "0", 10)
    : 0;
  const next = lastNumber + 1;
  return `${year}-${padNumber(next)}`;
}
