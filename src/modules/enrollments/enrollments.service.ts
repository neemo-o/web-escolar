import { prisma } from "../../config/prisma";

export const createEnrollmentRecord = (data: any) =>
  prisma.enrollment.create({ data });

export const findEnrollments = (
  schoolId: string,
  filters: any,
  skip = 0,
  take = 20,
) =>
  prisma.enrollment.findMany({
    where: { schoolId, deletedAt: null, ...(filters || {}) },
    skip,
    take,
    orderBy: { createdAt: "desc" },
  });

export const countEnrollments = (schoolId: string, filters: any) =>
  prisma.enrollment.count({
    where: { schoolId, deletedAt: null, ...(filters || {}) },
  });

export const findEnrollmentById = (id: string, schoolId: string) =>
  prisma.enrollment.findFirst({ where: { id, schoolId, deletedAt: null } });

export const updateEnrollmentStatusById = (id: string, status: any) =>
  prisma.enrollment.update({ where: { id }, data: { status } });
