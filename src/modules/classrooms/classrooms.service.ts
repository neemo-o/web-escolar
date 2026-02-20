import { prisma } from "../../config/prisma";

export const createClassroomRecord = (data: any) => prisma.classroom.create({ data });

export const findClassrooms = (schoolId: string, filters: any, skip = 0, take = 20) =>
  prisma.classroom.findMany({ where: { schoolId, deletedAt: null, ...(filters || {}) }, skip, take, orderBy: { name: "asc" } });

export const countClassrooms = (schoolId: string, filters: any) => prisma.classroom.count({ where: { schoolId, deletedAt: null, ...(filters || {}) } });

export const findClassroomById = (id: string, schoolId: string) => prisma.classroom.findFirst({ where: { id, schoolId, deletedAt: null } });

export const updateClassroomById = (id: string, data: any) => prisma.classroom.update({ where: { id }, data });

export const softDeleteClassroomById = (id: string) => prisma.classroom.update({ where: { id }, data: { deletedAt: new Date() } });
