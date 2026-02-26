import { prisma } from "../../config/prisma";

export class SchedulesService {
  async findByClassroom(classroomId: string, schoolId: string) {
    return prisma.schedule.findMany({
      where: { classroomId, schoolId },
      include: {
        subject: true,
        classroom: { include: { gradeLevel: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  }

  async findByGradeLevel(gradeLevelId: string, schoolId: string) {
    const classrooms = await prisma.classroom.findMany({
      where: { gradeLevelId, schoolId, academicYear: { active: true } },
      select: { id: true },
    });
    const classroomIds = classrooms.map((c: { id: string }) => c.id);
    return prisma.schedule.findMany({
      where: { classroomId: { in: classroomIds }, schoolId },
      include: {
        subject: true,
        classroom: { include: { gradeLevel: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  }

  async findAll(schoolId: string) {
    return prisma.schedule.findMany({
      where: { schoolId },
      include: {
        subject: true,
        classroom: { include: { gradeLevel: true } },
      },
      orderBy: [
        { classroom: { name: "asc" } },
        { dayOfWeek: "asc" },
        { startTime: "asc" },
      ],
    });
  }

  async checkClassroomConflict(
    classroomId: string,
    dayOfWeek: number,
    startTime: string,
    excludeId?: string,
  ): Promise<boolean> {
    const startDate = new Date(`1970-01-01T${startTime}`);
    const existing = await prisma.schedule.findFirst({
      where: {
        classroomId,
        dayOfWeek,
        startTime: startDate,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return !!existing;
  }

  async checkTeacherConflict(
    teacherId: string,
    dayOfWeek: number,
    startTime: string,
    excludeId?: string,
  ): Promise<{ hasConflict: boolean; conflictingSchedule?: any }> {
    const startDate = new Date(`1970-01-01T${startTime}`);
    const schedules = await prisma.schedule.findMany({
      where: {
        dayOfWeek,
        startTime: startDate,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      include: {
        classroom: {
          include: {
            classroomTeachers: {
              where: {
                teacherId,
                OR: [{ dateTo: null }, { dateTo: { gte: new Date() } }],
              },
            },
          },
        },
      },
    });
    const conflicting = schedules.find(
      (s) => s.classroom.classroomTeachers.length > 0,
    );
    return { hasConflict: !!conflicting, conflictingSchedule: conflicting };
  }

  async create(data: {
    schoolId: string;
    classroomId: string;
    subjectId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string;
  }) {
    const hasClassroomConflict = await this.checkClassroomConflict(
      data.classroomId,
      data.dayOfWeek,
      data.startTime,
    );
    if (hasClassroomConflict) {
      throw new Error(
        "CONFLICT_CLASSROOM: Já existe uma aula nesta turma neste horário.",
      );
    }
    return prisma.schedule.create({
      data: {
        schoolId: data.schoolId,
        classroomId: data.classroomId,
        subjectId: data.subjectId,
        dayOfWeek: data.dayOfWeek,
        startTime: new Date(`1970-01-01T${data.startTime}`),
        endTime: new Date(`1970-01-01T${data.endTime}`),
        room: data.room,
      },
      include: { subject: true, classroom: true },
    });
  }

  async update(
    id: string,
    data: {
      subjectId?: string;
      dayOfWeek?: number;
      startTime?: string;
      endTime?: string;
      room?: string;
    },
  ) {
    if (data.dayOfWeek !== undefined || data.startTime !== undefined) {
      const schedule = await prisma.schedule.findUnique({ where: { id } });
      if (!schedule) throw new Error("Schedule not found");
      const dayOfWeek = data.dayOfWeek ?? schedule.dayOfWeek;
      const startTime =
        data.startTime ?? schedule.startTime.toISOString().slice(11, 16);
      const hasClassroomConflict = await this.checkClassroomConflict(
        schedule.classroomId,
        dayOfWeek,
        startTime,
        id,
      );
      if (hasClassroomConflict) {
        throw new Error(
          "CONFLICT_CLASSROOM: Já existe uma aula nesta turma neste horário.",
        );
      }
    }
    const updateData: any = { ...data };
    if (data.startTime)
      updateData.startTime = new Date(`1970-01-01T${data.startTime}`);
    if (data.endTime)
      updateData.endTime = new Date(`1970-01-01T${data.endTime}`);
    return prisma.schedule.update({
      where: { id },
      data: updateData,
      include: { subject: true, classroom: true },
    });
  }

  async delete(id: string) {
    return prisma.schedule.delete({ where: { id } });
  }
}

export const schedulesService = new SchedulesService();
