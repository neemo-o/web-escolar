import { prisma } from "../../config/prisma";

const include = {
  student: { select: { id: true, name: true } },
  classroom: { select: { id: true, name: true } },
  academicYear: { select: { id: true, year: true } },
  financialResponsibleGuardian: {
    select: { id: true, name: true, email: true, phone: true },
  },
};

export const createEnrollmentRecord = (data: any) =>
  prisma.enrollment.create({ data, include: include as any });

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
    include: include as any,
  });

export const countEnrollments = (schoolId: string, filters: any) =>
  prisma.enrollment.count({
    where: { schoolId, deletedAt: null, ...(filters || {}) },
  });

export const findEnrollmentById = (id: string, schoolId: string) =>
  prisma.enrollment.findFirst({
    where: { id, schoolId, deletedAt: null },
    include: include as any,
  });

export const updateEnrollmentStatusById = (id: string, status: any) =>
  prisma.enrollment.update({
    where: { id },
    data: { status },
    include: include as any,
  });
