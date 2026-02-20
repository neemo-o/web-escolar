import { prisma } from "../../config/prisma";

export function findGrades(
  schoolId: string,
  filters: any,
  skip = 0,
  take = 20,
) {
  const where: any = { schoolId };
  if (filters.assessmentId) where.assessmentId = filters.assessmentId;
  if (filters.enrollmentId) where.enrollmentId = filters.enrollmentId;
  return prisma.studentGrade.findMany({
    where,
    skip,
    take,
    orderBy: { recordedAt: "desc" },
  });
}

export function countGrades(schoolId: string, filters: any) {
  const where: any = { schoolId };
  if (filters.assessmentId) where.assessmentId = filters.assessmentId;
  if (filters.enrollmentId) where.enrollmentId = filters.enrollmentId;
  return prisma.studentGrade.count({ where });
}

export function findGradeById(id: string, schoolId: string) {
  return prisma.studentGrade.findFirst({ where: { id, schoolId } });
}

export async function createOrUpdateGrade(data: any, changedById: string) {
  const { assessmentId, enrollmentId, score } = data;

  const existing = await prisma.studentGrade.findFirst({
    where: { assessmentId, enrollmentId, schoolId: data.schoolId },
  });
  if (!existing) {
    return prisma.studentGrade.create({
      data: { ...data, recordedById: changedById, score },
    });
  }

  // create audit
  await prisma.gradeAudit.create({
    data: {
      schoolId: data.schoolId,
      studentGradeId: existing.id,
      oldValue: existing.score || 0,
      newValue: score || 0,
      changedById,
    },
  });

  return prisma.studentGrade.update({
    where: { id: existing.id },
    data: { score, recordedById: changedById },
  });
}
