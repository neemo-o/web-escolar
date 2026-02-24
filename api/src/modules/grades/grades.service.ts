import { prisma } from "../../config/prisma";
import { CreateGradeData } from "./grades.types";

export function findGrades(
  schoolId: string,
  filters: any,
  skip = 0,
  take = 20,
) {
  const where: any = { schoolId };
  if (filters.assessmentId) {
    if (Array.isArray(filters.assessmentId))
      where.assessmentId = { in: filters.assessmentId };
    else where.assessmentId = filters.assessmentId;
  }
  if (filters.enrollmentId) {
    if (Array.isArray(filters.enrollmentId))
      where.enrollmentId = { in: filters.enrollmentId };
    else where.enrollmentId = filters.enrollmentId;
  }
  return prisma.studentGrade.findMany({
    where,
    skip,
    take,
    orderBy: { launchedAt: "desc" },
  });
}

export function countGrades(schoolId: string, filters: any) {
  const where: any = { schoolId };
  if (filters.assessmentId) {
    if (Array.isArray(filters.assessmentId))
      where.assessmentId = { in: filters.assessmentId };
    else where.assessmentId = filters.assessmentId;
  }
  if (filters.enrollmentId) {
    if (Array.isArray(filters.enrollmentId))
      where.enrollmentId = { in: filters.enrollmentId };
    else where.enrollmentId = filters.enrollmentId;
  }
  return prisma.studentGrade.count({ where });
}

export function findGradeById(id: string, schoolId: string) {
  return prisma.studentGrade.findFirst({ where: { id, schoolId } });
}

export async function createOrUpdateGrade(
  data: CreateGradeData,
  changedById: string,
) {
  const { assessmentId, enrollmentId, score } = data;
  const existing = await prisma.studentGrade.findFirst({
    where: { assessmentId, enrollmentId, schoolId: data.schoolId },
  });
  if (!existing) {
    return prisma.studentGrade.create({
      data: { ...data, launchedById: changedById, launchedAt: new Date(), score },
    });
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.gradeAudit.create({
      data: {
        schoolId: data.schoolId,
        gradeId: existing.id,
        oldScore: existing.score ?? 0,
        newScore: score ?? 0,
        changedById,
      },
    });

    return tx.studentGrade.update({
      where: { id: existing.id },
      data: { score, launchedById: changedById, launchedAt: new Date() },
    });
  });

  return result;
}
