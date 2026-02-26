import { prisma } from "../../config/prisma";

export class SchedulesService {
  async findByClassroom(classroomId: string, schoolId: string) {
    return prisma.schedule.findMany({
      where: { classroomId, schoolId },
      include: {
        subject: true,
        classroom: { include: { gradeLevel: true } },
        teacher: true,
        room: true,
        timeBlock: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { timeBlock: { order: "asc" } }],
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
        teacher: true,
        room: true,
        timeBlock: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { timeBlock: { order: "asc" } }],
    });
  }

  async findAll(schoolId: string) {
    return prisma.schedule.findMany({
      where: { schoolId },
      include: {
        subject: true,
        classroom: { include: { gradeLevel: true } },
        teacher: true,
        room: true,
        timeBlock: true,
      },
      orderBy: [
        { classroom: { name: "asc" } },
        { dayOfWeek: "asc" },
        { timeBlock: { order: "asc" } },
      ],
    });
  }

  // Check for classroom conflict (same classroom, day, and time block)
  async checkClassroomConflict(
    classroomId: string,
    dayOfWeek: number,
    timeBlockId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const existing = await prisma.schedule.findFirst({
      where: {
        classroomId,
        dayOfWeek,
        timeBlockId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return !!existing;
  }

  // Check for room conflict (same room, day, and time block)
  async checkRoomConflict(
    roomId: string,
    dayOfWeek: number,
    timeBlockId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const existing = await prisma.schedule.findFirst({
      where: {
        roomId,
        dayOfWeek,
        timeBlockId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return !!existing;
  }

  // Check for teacher conflict (same teacher, day, and time block)
  async checkTeacherConflict(
    teacherId: string,
    dayOfWeek: number,
    timeBlockId: string,
    excludeId?: string,
  ): Promise<{ hasConflict: boolean; conflictingSchedule?: any }> {
    const conflicting = await prisma.schedule.findFirst({
      where: {
        teacherId,
        dayOfWeek,
        timeBlockId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      include: {
        classroom: { include: { gradeLevel: true } },
        subject: true,
      },
    });
    return { hasConflict: !!conflicting, conflictingSchedule: conflicting };
  }

  async create(data: {
    schoolId: string;
    classroomId: string;
    subjectId: string;
    teacherId?: string;
    roomId?: string;
    timeBlockId?: string;
    dayOfWeek: number;
  }) {
    // Validate required fields
    if (!data.timeBlockId) {
      throw new Error("Bloco de horário é obrigatório");
    }

    // Check classroom conflict
    const hasClassroomConflict = await this.checkClassroomConflict(
      data.classroomId,
      data.dayOfWeek,
      data.timeBlockId,
    );
    if (hasClassroomConflict) {
      throw new Error(
        "CONFLICT_CLASSROOM: Já existe uma aula nesta turma neste horário.",
      );
    }

    // Check room conflict if room is specified
    if (data.roomId) {
      const hasRoomConflict = await this.checkRoomConflict(
        data.roomId,
        data.dayOfWeek,
        data.timeBlockId,
      );
      if (hasRoomConflict) {
        throw new Error(
          "CONFLICT_ROOM: Esta sala já está reservada neste horário.",
        );
      }
    }

    // Check teacher conflict if teacher is specified
    if (data.teacherId) {
      const teacherConflict = await this.checkTeacherConflict(
        data.teacherId,
        data.dayOfWeek,
        data.timeBlockId,
      );
      if (teacherConflict.hasConflict) {
        const cs = teacherConflict.conflictingSchedule;
        throw new Error(
          `CONFLICT_TEACHER: O professor já está ministrando aula em ${cs.classroom.name} (${cs.subject.name}) neste horário.`,
        );
      }
    }

    return prisma.schedule.create({
      data: {
        schoolId: data.schoolId,
        classroomId: data.classroomId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        roomId: data.roomId,
        timeBlockId: data.timeBlockId,
        dayOfWeek: data.dayOfWeek,
      },
      include: {
        subject: true,
        classroom: true,
        teacher: true,
        room: true,
        timeBlock: true,
      },
    });
  }

  async update(
    id: string,
    data: {
      subjectId?: string;
      teacherId?: string;
      roomId?: string;
      timeBlockId?: string;
      dayOfWeek?: number;
    },
  ) {
    const schedule = await prisma.schedule.findUnique({ where: { id } });
    if (!schedule) throw new Error("Schedule not found");

    const dayOfWeek = data.dayOfWeek ?? schedule.dayOfWeek;
    const timeBlockId = data.timeBlockId ?? schedule.timeBlockId;

    // If changing day or time block, check conflicts
    if (data.dayOfWeek !== undefined || data.timeBlockId !== undefined) {
      // Check classroom conflict
      const hasClassroomConflict = await this.checkClassroomConflict(
        schedule.classroomId!,
        dayOfWeek,
        timeBlockId,
        id,
      );
      if (hasClassroomConflict) {
        throw new Error(
          "CONFLICT_CLASSROOM: Já existe uma aula nesta turma neste horário.",
        );
      }

      // Check room conflict if room is specified
      const roomId = data.roomId ?? schedule.roomId;
      if (roomId) {
        const hasRoomConflict = await this.checkRoomConflict(
          roomId,
          dayOfWeek,
          timeBlockId,
          id,
        );
        if (hasRoomConflict) {
          throw new Error(
            "CONFLICT_ROOM: Esta sala já está reservada neste horário.",
          );
        }
      }

      // Check teacher conflict if teacher is specified
      const teacherId = data.teacherId ?? schedule.teacherId;
      if (teacherId) {
        const teacherConflict = await this.checkTeacherConflict(
          teacherId,
          dayOfWeek,
          timeBlockId,
          id,
        );
        if (teacherConflict.hasConflict) {
          const cs = teacherConflict.conflictingSchedule;
          throw new Error(
            `CONFLICT_TEACHER: O professor já está ministrando aula em ${cs.classroom.name} (${cs.subject.name}) neste horário.`,
          );
        }
      }
    }

    return prisma.schedule.update({
      where: { id },
      data,
      include: {
        subject: true,
        classroom: true,
        teacher: true,
        room: true,
        timeBlock: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.schedule.delete({ where: { id } });
  }

  // Get schedules by day and time block for a school
  async findByDayAndBlock(
    schoolId: string,
    dayOfWeek: number,
    timeBlockId: string,
  ) {
    return prisma.schedule.findMany({
      where: {
        schoolId,
        dayOfWeek,
        timeBlockId,
      },
      include: {
        subject: true,
        classroom: { include: { gradeLevel: true } },
        teacher: true,
        room: true,
      },
    });
  }
}

export const schedulesService = new SchedulesService();
