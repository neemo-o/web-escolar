import { prisma } from "../../config/prisma";

export const createClassroomSubject = (data: any) => prisma.classroomSubject.create({ data });

export const findActiveSubjectsByClassroom = (classroomId: string, schoolId: string) =>
  prisma.classroomSubject.findMany({
    where: { classroomId, schoolId, dateTo: null },
    include: { subject: { select: { id: true, name: true, code: true } } },
  });

export const findClassroomSubjectById = (id: string, classroomId: string) =>
  prisma.classroomSubject.findFirst({ where: { id, classroomId } });

export const updateClassroomSubjectById = (id: string, data: any) => prisma.classroomSubject.update({ where: { id }, data });
