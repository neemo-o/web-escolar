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

  async findById(id: string) {
    return prisma.room.findUnique({
      where: { id },
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

  async update(
    id: string,
    data: {
      name?: string;
      capacity?: number;
      active?: boolean;
    },
  ) {
    return prisma.room.update({
      where: { id },
      data,
    });
  }

  // Soft delete - just deactivate
  async delete(id: string) {
    return prisma.room.update({
      where: { id },
      data: { active: false },
    });
  }

  // Check if room has schedules
  async hasSchedules(id: string): Promise<boolean> {
    const count = await prisma.schedule.count({
      where: { roomId: id },
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
