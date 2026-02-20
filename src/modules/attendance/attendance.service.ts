import { prisma } from "../../config/prisma";

export function findSessions(
  schoolId: string,
  filters: any,
  skip = 0,
  take = 20,
) {
  const where: any = { schoolId };
  if (filters.classroomId) where.classroomId = filters.classroomId;
  if (filters.subjectId) where.subjectId = filters.subjectId;
  if (filters.sessionDate)
    where.sessionDate = new Date(String(filters.sessionDate));
  return prisma.attendanceSession.findMany({
    where,
    skip,
    take,
    orderBy: { sessionDate: "desc" },
  });
}

export function countSessions(schoolId: string, filters: any) {
  const where: any = { schoolId };
  if (filters.classroomId) where.classroomId = filters.classroomId;
  if (filters.subjectId) where.subjectId = filters.subjectId;
  if (filters.sessionDate)
    where.sessionDate = new Date(String(filters.sessionDate));
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

export function softDeleteSession(id: string) {
  return prisma.attendanceSession.update({
    where: { id },
    data: { updatedAt: new Date() },
  });
}

export async function upsertRecord(
  schoolId: string,
  sessionId: string,
  enrollmentId: string,
  status: string,
  justification?: string,
) {
  const existing = await prisma.attendanceRecord.findFirst({
    where: { sessionId, enrollmentId },
  });
  if (!existing) {
    return prisma.attendanceRecord.create({
      data: { schoolId, sessionId, enrollmentId, status, justification },
    });
  }
  return prisma.attendanceRecord.update({
    where: { id: existing.id },
    data: { status, justification },
  });
}
