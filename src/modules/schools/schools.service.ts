import { prisma } from "../../config/prisma";

export const createSchoolWithConfig = async (data: {
  name: string;
  cnpj: string;
  slug: string;
}) => {
  return prisma.$transaction(async (tx) => {
    const school = await tx.school.create({ data });
    await tx.schoolConfig.create({ data: { schoolId: school.id } });
    return school;
  });
};

export const findSchools = (args: { skip: number; take: number }) =>
  prisma.school.findMany({
    where: { deletedAt: null },
    skip: args.skip,
    take: args.take,
    orderBy: { createdAt: "desc" },
    include: { config: true },
  });

export const countSchools = () =>
  prisma.school.count({ where: { deletedAt: null } });

export const findSchoolById = (id: string) =>
  prisma.school.findFirst({
    where: { id, deletedAt: null },
    include: { config: true },
  });

export const updateSchoolById = (id: string, data: any) =>
  prisma.school.update({ where: { id }, data });
