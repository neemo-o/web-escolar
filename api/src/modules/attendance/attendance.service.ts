import { prisma } from "../../config/prisma";
import { SessionFilters } from "./attendance.types";

export function findSessions(
  schoolId: string,
  filters: SessionFilters,
  skip = 0,
  take = 20,
) {
  const where: any = { schoolId };
  if (filters.classroomId) {
    where.classroomId = Array.isArray(filters.classroomId)
      ? { in: filters.classroomId }
      : filters.classroomId;
  }
  if (filters.subjectId) where.subjectId = filters.subjectId;
  if (filters.date)
    where.date = new Date(String(filters.date));
  return prisma.attendanceSession.findMany({
    where,
    skip,
    take,
    orderBy: { date: "desc" },
  });
}

export function countSessions(schoolId: string, filters: SessionFilters) {
  const where: any = { schoolId };
  if (filters?.classroomId) {
    where.classroomId = Array.isArray(filters.classroomId)
      ? { in: filters.classroomId }
      : filters.classroomId;
  }
  if (filters?.subjectId) where.subjectId = filters.subjectId;
  if (filters?.date)
    where.date = new Date(String(filters.date));
  return prisma.attendanceSession.count({ where });
}

export function findSessionById(id: string, schoolId: string) {
  return prisma.attendanceSession.findFirst({ where: { id, schoolId } });
}

export function createSession(data: any) {
  return prisma.attendanceSession.create({ data });
}

export function updateSession(id: string, data: any) {
  return prisma.attendanceSession.update({ where: { id }, data });
}

export async function upsertRecord(
  schoolId: string,
  sessionId: string,
  enrollmentId: string,
  present: boolean,
  justified?: boolean,
  notes?: string,
) {
  const existing = await prisma.attendanceRecord.findFirst({
    where: { sessionId, enrollmentId },
  });
  if (!existing) {
    return prisma.attendanceRecord.create({
      data: { schoolId, sessionId, enrollmentId, present, justified: justified ?? false, notes },
    });
  }
  return prisma.attendanceRecord.update({
    where: { id: existing.id },
    data: { present, justified: justified ?? false, notes },
  });
}
