import { prisma } from "../../config/prisma";

export const createStudentWithUser = async (data: {
  user: any;
  student: any;
}) =>
  prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: data.user });
    const student = await tx.student.create({
      data: { ...data.student, userId: user.id },
    });
    return { user, student };
  });

export const findStudents = (
  schoolId: string,
  name?: string,
  skip = 0,
  take = 20,
) =>
  prisma.student.findMany({
    where: {
      schoolId,
      deletedAt: null,
      ...(name ? { name: { contains: name, mode: "insensitive" } } : {}),
    },
    skip,
    take,
    orderBy: { createdAt: "desc" },
  });

export const countStudents = (schoolId: string, name?: string) =>
  prisma.student.count({
    where: {
      schoolId,
      deletedAt: null,
      ...(name ? { name: { contains: name, mode: "insensitive" } } : {}),
    },
  });

export const findStudentById = (id: string, schoolId: string) =>
  prisma.student.findFirst({
    where: { id, schoolId, deletedAt: null },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatarUrl: true,
          role: true,
          active: true,
        },
      },
    },
  });

export const updateStudentById = (id: string, data: any) =>
  prisma.student.update({ where: { id }, data });

export const softDeleteStudentById = (id: string) =>
  prisma.student.update({ where: { id }, data: { deletedAt: new Date() } });
