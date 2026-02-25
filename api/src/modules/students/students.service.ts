import { prisma } from "../../config/prisma";
import { maskCpf } from "../../utils/cpf";

export const createStudentWithUser = async (data: { user: any; student: any; createdById?: string }) =>
  prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: data.user,
      select: {
        id: true, schoolId: true, email: true, name: true,
        phone: true, avatarUrl: true, role: true, active: true,
        createdAt: true, updatedAt: true,
      },
    });
    const student = await tx.student.create({
      data: { ...data.student, userId: user.id },
    });
    await tx.enrollmentHistory.create({
      data: {
        schoolId: data.student.schoolId,
        studentId: student.id,
        type: "MATRICULA",
        description: "Cadastro inicial do aluno",
        createdById: data.createdById ?? null,
      },
    });
    return { user, student };
  });

const studentSelect = {
  id: true,
  schoolId: true,
  name: true,
  socialName: true,
  cpf: true,
  rg: true,
  birthCertificate: true,
  birthDate: true,
  gender: true,
  nationality: true,
  naturalidade: true,
  email: true,
  phone: true,
  zipCode: true,
  street: true,
  addressNumber: true,
  neighborhood: true,
  city: true,
  state: true,
  avatarUrl: true,
  status: true,
  exitDate: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
};

export const findStudents = (
  schoolId: string,
  name?: string,
  status?: string,
  skip = 0,
  take = 20,
  studentIds?: string[],
) =>
  prisma.$transaction(async (tx) => {
    const rawStudents = await tx.student.findMany({
      where: {
        schoolId,
        deletedAt: null,
        ...(studentIds && studentIds.length
          ? { id: { in: studentIds } }
          : {}),
        ...(name ? { name: { contains: name, mode: "insensitive" } } : {}),
        ...(status ? { status: status as any } : {}),
      },
      select: {
        id: true,
        schoolId: true,
        name: true,
        socialName: true,
        cpf: true,
        birthDate: true,
        gender: true,
        nationality: true,
        naturalidade: true,
        email: true,
        phone: true,
        zipCode: true,
        street: true,
        addressNumber: true,
        neighborhood: true,
        city: true,
        state: true,
        avatarUrl: true,
        status: true,
        exitDate: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        guardians: {
          select: {
            id: true,
            relationType: true,
            isFinancialResponsible: true,
            canPickUp: true,
            guardian: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        enrollments: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            enrollmentNumber: true,
            status: true,
            enrolledAt: true,
            classroom: { select: { id: true, name: true, shift: true } },
            academicYear: { select: { id: true, year: true } },
          },
        },
      },
      skip,
      take,
      orderBy: { name: "asc" },
    });

    const students = rawStudents.map((s) => {
      const maskedCpf = maskCpf(s.cpf);
      const { cpf, ...rest } = s;
      return { ...rest, maskedCpf };
    });

    return students;
  });

export const countStudents = (
  schoolId: string,
  name?: string,
  status?: string,
  studentIds?: string[],
) =>
  prisma.student.count({
    where: {
      schoolId,
      deletedAt: null,
      ...(studentIds && studentIds.length ? { id: { in: studentIds } } : {}),
      ...(name ? { name: { contains: name, mode: "insensitive" } } : {}),
      ...(status ? { status: status as any } : {}),
    },
  });

export const findStudentById = (id: string, schoolId: string) =>
  prisma.student.findFirst({
    where: { id, schoolId, deletedAt: null },
    include: {
      user: {
        select: { id: true, email: true, name: true, phone: true, avatarUrl: true, role: true, active: true },
      },
      health: true,
      documents: { orderBy: { createdAt: "asc" } },
      guardians: {
        include: {
          guardian: {
            select: {
              id: true, name: true, email: true, phone: true, active: true,
              guardianProfile: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      enrollments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          classroom: { select: { id: true, name: true, shift: true } },
          academicYear: { select: { id: true, year: true } },
        },
      },
      movementHistory: {
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { id: true, name: true } } },
      },
    },
  });

export const updateStudentById = (id: string, data: any) =>
  prisma.student.update({ where: { id }, data });

export const softDeleteStudentById = (id: string) =>
  prisma.student.update({ where: { id }, data: { deletedAt: new Date() } });

export const upsertStudentHealth = (studentId: string, schoolId: string, data: any) =>
  prisma.studentHealth.upsert({
    where: { studentId },
    create: { studentId, schoolId, ...data },
    update: data,
  });

export const findStudentHealth = (studentId: string, schoolId: string) =>
  prisma.studentHealth.findFirst({ where: { studentId, schoolId } });

export const createStudentDocument = (data: any) =>
  prisma.studentDocument.create({ data });

export const updateStudentDocument = (id: string, data: any) =>
  prisma.studentDocument.update({ where: { id }, data });

export const deleteStudentDocument = (id: string) =>
  prisma.studentDocument.delete({ where: { id } });

export const findStudentDocuments = (studentId: string, schoolId: string) =>
  prisma.studentDocument.findMany({
    where: { studentId, schoolId },
    orderBy: { createdAt: "asc" },
  });

export const findStudentHistory = (studentId: string, schoolId: string) =>
  prisma.enrollmentHistory.findMany({
    where: { studentId, schoolId },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { id: true, name: true } } },
  });

export const createMovement = (data: any) =>
  prisma.enrollmentHistory.create({ data });