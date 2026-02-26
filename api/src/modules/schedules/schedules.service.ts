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

    // FIX #7: Validate that all related entities belong to the same school
    const [classroom, subject, timeBlock] = await Promise.all([
      prisma.classroom.findFirst({
        where: { id: data.classroomId, schoolId: data.schoolId },
      }),
      prisma.subject.findFirst({
        where: { id: data.subjectId, schoolId: data.schoolId },
      }),
      prisma.timeBlock.findFirst({
        where: { id: data.timeBlockId, schoolId: data.schoolId },
      }),
    ]);

    if (!classroom) {
      throw new Error("A turma não pertence a esta escola");
    }
    if (!subject) {
      throw new Error("A disciplina não pertence a esta escola");
    }
    if (!timeBlock) {
      throw new Error("O bloco de horário não pertence a esta escola");
    }

    // Validate teacher belongs to school if provided
    if (data.teacherId) {
      const teacher = await prisma.user.findFirst({
        where: { id: data.teacherId, schoolId: data.schoolId, role: "TEACHER" },
      });
      if (!teacher) {
        throw new Error("O professor não pertence a esta escola");
      }
    }

    // Validate room belongs to school if provided
    if (data.roomId) {
      const room = await prisma.room.findFirst({
        where: { id: data.roomId, schoolId: data.schoolId },
      });
      if (!room) {
        throw new Error("A sala não pertence a esta escola");
      }
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
    schoolId: string,
    data: {
      subjectId?: string;
      teacherId?: string;
      roomId?: string;
      timeBlockId?: string;
      dayOfWeek?: number;
    },
  ) {
    // FIX #3: Validate schoolId before updating
    const schedule = await prisma.schedule.findFirst({
      where: { id, schoolId },
    });
    if (!schedule) {
      throw new Error("ACCESS_DENIED");
    }

    // FIX #7: Validate that subject belongs to the school if being changed
    if (data.subjectId) {
      const subject = await prisma.subject.findFirst({
        where: { id: data.subjectId, schoolId },
      });
      if (!subject) {
        throw new Error("A disciplina não pertence a esta escola");
      }
    }

    // FIX #7: Validate that teacher belongs to the school if being changed
    if (data.teacherId) {
      const teacher = await prisma.user.findFirst({
        where: { id: data.teacherId, schoolId, role: "TEACHER" },
      });
      if (!teacher) {
        throw new Error("O professor não pertence a esta escola");
      }
    }

    // FIX #7: Validate that room belongs to the school if being changed
    if (data.roomId) {
      const room = await prisma.room.findFirst({
        where: { id: data.roomId, schoolId },
      });
      if (!room) {
        throw new Error("A sala não pertence a esta escola");
      }
    }

    // FIX #7: Validate that timeBlock belongs to the school if being changed
    if (data.timeBlockId) {
      const timeBlock = await prisma.timeBlock.findFirst({
        where: { id: data.timeBlockId, schoolId },
      });
      if (!timeBlock) {
        throw new Error("O bloco de horário não pertence a esta escola");
      }
    }

    const dayOfWeek = data.dayOfWeek ?? schedule.dayOfWeek;
    const timeBlockId = data.timeBlockId ?? schedule.timeBlockId;

    // FIX #8: Check for conflicts even when only teacherId or roomId changes
    // Check room conflict if room is being changed or is already set
    const roomId = data.roomId ?? schedule.roomId;
    if (roomId) {
      const hasRoomConflict = await this.checkRoomConflict(
        roomId,
        dayOfWeek,
        timeBlockId!,
        id,
      );
      if (hasRoomConflict) {
        throw new Error(
          "CONFLICT_ROOM: Esta sala já está reservada neste horário.",
        );
      }
    }

    // Check teacher conflict if teacher is being changed or is already set
    const teacherId = data.teacherId ?? schedule.teacherId;
    if (teacherId) {
      const teacherConflict = await this.checkTeacherConflict(
        teacherId,
        dayOfWeek,
        timeBlockId!,
        id,
      );
      if (teacherConflict.hasConflict) {
        const cs = teacherConflict.conflictingSchedule;
        throw new Error(
          `CONFLICT_TEACHER: O professor já está ministrando aula em ${cs.classroom.name} (${cs.subject.name}) neste horário.`,
        );
      }
    }

    // Check classroom conflict
    const hasClassroomConflict = await this.checkClassroomConflict(
      schedule.classroomId!,
      dayOfWeek,
      timeBlockId!,
      id,
    );
    if (hasClassroomConflict) {
      throw new Error(
        "CONFLICT_CLASSROOM: Já existe uma aula nesta turma neste horário.",
      );
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

  async delete(id: string, schoolId: string) {
    // FIX #2: Validate schoolId before deleting
    const schedule = await prisma.schedule.findFirst({
      where: { id, schoolId },
    });
    if (!schedule) {
      throw new Error("ACCESS_DENIED");
    }

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
