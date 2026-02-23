import { prisma } from "../../config/prisma";

const include = {
  student: { select: { id: true, name: true, cpf: true } },
  classroom: { select: { id: true, name: true } },
  academicYear: { select: { id: true, year: true } },
};

export const createEnrollmentRecord = (data: any) =>
  prisma.enrollment.create({ data, include });

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
    include,
  });

export const countEnrollments = (schoolId: string, filters: any) =>
  prisma.enrollment.count({
    where: { schoolId, deletedAt: null, ...(filters || {}) },
  });

export const findEnrollmentById = (id: string, schoolId: string) =>
  prisma.enrollment.findFirst({
    where: { id, schoolId, deletedAt: null },
    include,
  });

export const updateEnrollmentStatusById = (id: string, status: any) =>
  prisma.enrollment.update({ where: { id }, data: { status }, include });
