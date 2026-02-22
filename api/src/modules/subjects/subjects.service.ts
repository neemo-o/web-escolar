import { prisma } from "../../config/prisma";

export const createSubjectRecord = (data: any) =>
  prisma.subject.create({ data });

export const findSubjects = (schoolId: string, skip = 0, take = 20) =>
  prisma.subject.findMany({ where: { schoolId, deletedAt: null }, skip, take, orderBy: { name: "asc" } });

export const countSubjects = (schoolId: string) => prisma.subject.count({ where: { schoolId, deletedAt: null } });

export const findSubjectById = (id: string, schoolId: string) =>
  prisma.subject.findFirst({ where: { id, schoolId, deletedAt: null } });

export const updateSubjectById = (id: string, data: any) => prisma.subject.update({ where: { id }, data });

export const softDeleteSubjectById = (id: string) => prisma.subject.update({ where: { id }, data: { deletedAt: new Date() } });
