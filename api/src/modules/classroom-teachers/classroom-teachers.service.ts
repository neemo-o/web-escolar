import { prisma } from "../../config/prisma";

export const createClassroomTeacher = (data: any) =>
  prisma.classroomTeacher.create({ data });

export const findActiveTeachersByClassroom = (
  classroomId: string,
  schoolId: string,
) =>
  prisma.classroomTeacher.findMany({
    where: { classroomId, schoolId, dateTo: null },
  });

export const findClassroomTeacherById = (id: string, classroomId: string) =>
  prisma.classroomTeacher.findFirst({ where: { id, classroomId } });

export const updateClassroomTeacherById = (id: string, data: any) =>
  prisma.classroomTeacher.update({ where: { id }, data });
