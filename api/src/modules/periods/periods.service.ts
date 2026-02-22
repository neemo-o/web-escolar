import { prisma } from "../../config/prisma";

export const createPeriodRecord = (data: any) => prisma.period.create({ data });

export const findPeriodsByYear = (academicYearId: string) =>
  prisma.period.findMany({ where: { academicYearId }, orderBy: { sequence: "asc" } });

export const findPeriodById = (id: string, academicYearId: string) =>
  prisma.period.findFirst({ where: { id, academicYearId } });

export const updatePeriodById = (id: string, data: any) => prisma.period.update({ where: { id }, data });
