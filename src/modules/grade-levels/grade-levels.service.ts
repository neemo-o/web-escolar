import { prisma } from "../../config/prisma";

export const createGradeLevelRecord = (data: any) => prisma.gradeLevel.create({ data });

export const findGradeLevels = (schoolId: string, skip = 0, take = 20) =>
  prisma.gradeLevel.findMany({ where: { schoolId }, skip, take, orderBy: { sortOrder: "asc" } });

export const countGradeLevels = (schoolId: string) => prisma.gradeLevel.count({ where: { schoolId } });

export const findGradeLevelById = (id: string, schoolId: string) =>
  prisma.gradeLevel.findFirst({ where: { id, schoolId } });

export const updateGradeLevelById = (id: string, data: any) => prisma.gradeLevel.update({ where: { id }, data });

export const deleteGradeLevelById = (id: string) => prisma.gradeLevel.delete({ where: { id } });
