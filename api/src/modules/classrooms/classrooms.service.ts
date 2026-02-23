import { prisma } from "../../config/prisma";

const include = {
  academicYear: { select: { id: true, year: true, status: true } },
  gradeLevel: { select: { id: true, name: true, code: true } },
  _count: { select: { enrollments: true } },
};

export const createClassroomRecord = (data: any) =>
  prisma.classroom.create({ data, include });

export const findClassrooms = (
  schoolId: string,
  filters: any,
  skip = 0,
  take = 20,
) => {
  const baseWhere: any = { schoolId, deletedAt: null };
  if (filters) {
    const { ids, ...rest } = filters;
    Object.assign(baseWhere, rest || {});
    if (ids && Array.isArray(ids) && ids.length > 0) baseWhere.id = { in: ids };
  }
  return prisma.classroom.findMany({
    where: baseWhere,
    skip,
    take,
    orderBy: { name: "asc" },
    include,
  });
};

export const countClassrooms = (schoolId: string, filters: any) => {
  const baseWhere: any = { schoolId, deletedAt: null };
  if (filters) {
    const { ids, ...rest } = filters;
    Object.assign(baseWhere, rest || {});
    if (ids && Array.isArray(ids) && ids.length > 0) baseWhere.id = { in: ids };
  }
  return prisma.classroom.count({ where: baseWhere });
};

export const findClassroomById = (id: string, schoolId: string) =>
  prisma.classroom.findFirst({
    where: { id, schoolId, deletedAt: null },
    include,
  });

export const updateClassroomById = (id: string, data: any) =>
  prisma.classroom.update({ where: { id }, data, include });

export const softDeleteClassroomById = (id: string) =>
  prisma.classroom.update({ where: { id }, data: { deletedAt: new Date() } });
