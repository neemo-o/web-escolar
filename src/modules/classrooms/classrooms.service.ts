import { prisma } from "../../config/prisma";

export const createClassroomRecord = (data: any) =>
  prisma.classroom.create({ data });

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
  prisma.classroom.findFirst({ where: { id, schoolId, deletedAt: null } });

export const updateClassroomById = (id: string, data: any) =>
  prisma.classroom.update({ where: { id }, data });

export const softDeleteClassroomById = (id: string) =>
  prisma.classroom.update({ where: { id }, data: { deletedAt: new Date() } });
