import { prisma } from "../../config/prisma";

export function findAssessments(
  schoolId: string,
  filters: any,
  skip = 0,
  take = 20,
) {
  const where: any = { schoolId };
  if (filters.classroomId) where.classroomId = filters.classroomId;
  if (filters.periodId) where.periodId = filters.periodId;
  if (filters.subjectId) where.subjectId = filters.subjectId;
  if (filters.status) where.status = filters.status;

  return prisma.assessment.findMany({
    where,
    skip,
    take,
    orderBy: { date: "desc" },
  });
}

export function countAssessments(schoolId: string, filters: any) {
  const where: any = { schoolId };
  if (filters.classroomId) where.classroomId = filters.classroomId;
  if (filters.periodId) where.periodId = filters.periodId;
  if (filters.subjectId) where.subjectId = filters.subjectId;
  if (filters.status) where.status = filters.status;

  return prisma.assessment.count({ where });
}

export function findAssessmentById(id: string, schoolId: string) {
  return prisma.assessment.findFirst({ where: { id, schoolId } });
}

export function createAssessment(data: any) {
  return prisma.assessment.create({ data });
}

export function updateAssessment(id: string, data: any) {
  return prisma.assessment.update({ where: { id }, data });
}

export function softDeleteAssessment(id: string) {
  return prisma.assessment.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
