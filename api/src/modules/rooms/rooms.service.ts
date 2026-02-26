import { prisma } from "../../config/prisma";

export class RoomService {
  async findAll(schoolId: string) {
    return prisma.room.findMany({
      where: { schoolId, active: true },
      orderBy: { name: "asc" },
    });
  }

  async findAllIncludingInactive(schoolId: string) {
    return prisma.room.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
    });
  }

  // FIX #9: Validate schoolId in findById
  async findById(id: string, schoolId: string) {
    return prisma.room.findFirst({
      where: { id, schoolId },
    });
  }

  async create(data: { schoolId: string; name: string; capacity?: number }) {
    return prisma.room.create({
      data: {
        schoolId: data.schoolId,
        name: data.name,
        capacity: data.capacity,
      },
    });
  }

  // FIX #5: Validate schoolId in update
  async update(
    id: string,
    schoolId: string,
    data: {
      name?: string;
      capacity?: number;
      active?: boolean;
    },
  ) {
    // Check if room belongs to the school
    const existing = await prisma.room.findFirst({
      where: { id, schoolId },
    });
    if (!existing) {
      throw new Error("ACCESS_DENIED");
    }

    return prisma.room.update({
      where: { id },
      data,
    });
  }

  // FIX #5: Validate schoolId in delete
  async delete(id: string, schoolId: string) {
    // Check if room belongs to the school
    const existing = await prisma.room.findFirst({
      where: { id, schoolId },
    });
    if (!existing) {
      throw new Error("ACCESS_DENIED");
    }

    // Soft delete - just deactivate
    return prisma.room.update({
      where: { id },
      data: { active: false },
    });
  }

  // FIX #5: Validate schoolId in hasSchedules
  async hasSchedules(id: string, schoolId: string): Promise<boolean> {
    const count = await prisma.schedule.count({
      where: { roomId: id, schoolId },
    });
    return count > 0;
  }

  // Create default rooms for a new school
  async createDefaultRooms(schoolId: string) {
    const defaultRooms = [
      { name: "Sala 101", capacity: 30 },
      { name: "Sala 102", capacity: 30 },
      { name: "Sala 103", capacity: 25 },
      { name: "Laboratório de Informática", capacity: 25 },
      { name: "Laboratório de Ciências", capacity: 20 },
      { name: "Sala de Arte", capacity: 25 },
      { name: "Sala de Música", capacity: 20 },
      { name: "Educação Física", capacity: 40 },
    ];

    return prisma.room.createMany({
      data: defaultRooms.map((room) => ({
        schoolId,
        name: room.name,
        capacity: room.capacity,
        active: true,
      })),
    });
  }
}

export const roomService = new RoomService();
