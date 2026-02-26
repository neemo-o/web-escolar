import { prisma } from "../../config/prisma";

export class TimeBlockService {
  async findAll(schoolId: string) {
    return prisma.timeBlock.findMany({
      where: { schoolId, active: true },
      orderBy: { order: "asc" },
    });
  }

  async findAllIncludingInactive(schoolId: string) {
    return prisma.timeBlock.findMany({
      where: { schoolId },
      orderBy: { order: "asc" },
    });
  }

  // FIX #9: Validate schoolId in findById
  async findById(id: string, schoolId: string) {
    return prisma.timeBlock.findFirst({
      where: { id, schoolId },
    });
  }

  async create(data: {
    schoolId: string;
    name: string;
    startTime: string;
    endTime: string;
    order?: number;
  }) {
    // Get the next order if not provided
    let order = data.order;
    if (order === undefined) {
      const lastBlock = await prisma.timeBlock.findFirst({
        where: { schoolId: data.schoolId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      order = (lastBlock?.order ?? -1) + 1;
    }

    return prisma.timeBlock.create({
      data: {
        schoolId: data.schoolId,
        name: data.name,
        startTime: new Date(`1970-01-01T${data.startTime}`),
        endTime: new Date(`1970-01-01T${data.endTime}`),
        order,
      },
    });
  }

  // FIX #4: Validate schoolId in update
  async update(
    id: string,
    schoolId: string,
    data: {
      name?: string;
      startTime?: string;
      endTime?: string;
      order?: number;
      active?: boolean;
    },
  ) {
    // Check if time block belongs to the school
    const existing = await prisma.timeBlock.findFirst({
      where: { id, schoolId },
    });
    if (!existing) {
      throw new Error("ACCESS_DENIED");
    }

    const updateData: any = { ...data };
    if (data.startTime) {
      updateData.startTime = new Date(`1970-01-01T${data.startTime}`);
    }
    if (data.endTime) {
      updateData.endTime = new Date(`1970-01-01T${data.endTime}`);
    }

    return prisma.timeBlock.update({
      where: { id },
      data: updateData,
    });
  }

  // FIX #4: Validate schoolId in delete
  async delete(id: string, schoolId: string) {
    // Check if time block belongs to the school
    const existing = await prisma.timeBlock.findFirst({
      where: { id, schoolId },
    });
    if (!existing) {
      throw new Error("ACCESS_DENIED");
    }

    // Soft delete - just deactivate
    return prisma.timeBlock.update({
      where: { id },
      data: { active: false },
    });
  }

  // FIX #4: Validate schoolId in hasSchedules
  async hasSchedules(id: string, schoolId: string): Promise<boolean> {
    const count = await prisma.schedule.count({
      where: { timeBlockId: id, schoolId },
    });
    return count > 0;
  }

  // FIX #6: Validate schoolId in reorder
  async reorder(schoolId: string, orderedIds: string[]) {
    return prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.timeBlock.updateMany({
          where: { id, schoolId },
          data: { order: index },
        }),
      ),
    );
  }

  // Create default time blocks for a new school
  async createDefaultBlocks(schoolId: string) {
    const defaultBlocks = [
      { name: "1º horário", startTime: "07:00", endTime: "07:50", order: 0 },
      { name: "2º horário", startTime: "07:50", endTime: "08:40", order: 1 },
      { name: "3º horário", startTime: "08:40", endTime: "09:30", order: 2 },
      { name: "4º horário", startTime: "09:30", endTime: "10:20", order: 3 },
      { name: "5º horário", startTime: "10:20", endTime: "11:10", order: 4 },
      { name: "6º horário", startTime: "11:10", endTime: "12:00", order: 5 },
      { name: "7º horário", startTime: "13:00", endTime: "13:50", order: 6 },
      { name: "8º horário", startTime: "13:50", endTime: "14:40", order: 7 },
      { name: "9º horário", startTime: "14:40", endTime: "15:30", order: 8 },
      { name: "10º horário", startTime: "15:30", endTime: "16:20", order: 9 },
      { name: "11º horário", startTime: "16:20", endTime: "17:10", order: 10 },
    ];

    return prisma.timeBlock.createMany({
      data: defaultBlocks.map((block) => ({
        schoolId,
        name: block.name,
        startTime: new Date(`1970-01-01T${block.startTime}`),
        endTime: new Date(`1970-01-01T${block.endTime}`),
        order: block.order,
        active: true,
      })),
    });
  }
}

export const timeBlockService = new TimeBlockService();
