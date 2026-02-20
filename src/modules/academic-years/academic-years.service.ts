import { prisma } from "../../config/prisma";

export const createAcademicYearRecord = (data: any) =>
  prisma.academicYear.create({ data });

export const findAcademicYears = (schoolId: string, skip = 0, take = 20) =>
  prisma.academicYear.findMany({
    where: { schoolId },
    skip,
    take,
    orderBy: { year: "desc" },
  });

export const countAcademicYears = (schoolId: string) =>
  prisma.academicYear.count({ where: { schoolId } });

export const findAcademicYearById = (id: string, schoolId: string) =>
  prisma.academicYear.findFirst({ where: { id, schoolId } });

export const updateAcademicYearById = (id: string, data: any) =>
  prisma.academicYear.update({ where: { id }, data });

export const activateAcademicYearById = async (
  id: string,
  schoolId: string,
) => {
  return prisma.$transaction(async (tx) => {
    await tx.academicYear.updateMany({
      where: { schoolId, active: true },
      data: { active: false },
    });
    const updated = await tx.academicYear.update({
      where: { id },
      data: { active: true },
    });
    return updated;
  });
};
