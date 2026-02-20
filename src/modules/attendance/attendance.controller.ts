import { Request, Response } from "express";
import { getSchoolId } from "../../middlewares/tenant";
import * as service from "./attendance.service";
import { prisma } from "../../config/prisma";
import { SessionFilters } from "./attendance.types";
import getParam from "../../utils/getParam";

export async function createSession(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const createdById = (req.user as any)?.id;
  const { classroomId, subjectId, sessionDate, startTime, endTime, notes } =
    req.body;

  if (!classroomId || !subjectId || !sessionDate || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const [classroom, subject] = await Promise.all([
    prisma.classroom.findFirst({
      where: { id: classroomId, schoolId, deletedAt: null },
    }),
    prisma.subject.findFirst({
      where: { id: subjectId, schoolId, deletedAt: null },
    }),
  ]);
  if (!classroom) return res.status(404).json({ error: "Classroom not found" });
  if (!subject) return res.status(404).json({ error: "Subject not found" });

  try {
    const created = await service.createSession({
      schoolId,
      classroomId,
      subjectId,
      createdById,
      sessionDate: new Date(sessionDate),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      notes,
    });
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ error: "Error creating session" });
  }
}

export async function listSessions(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const page = parseInt(String(req.query.page || "1"), 10) || 1;
  const limit = Math.min(
    parseInt(String(req.query.limit || "20"), 10) || 20,
    100,
  );
  const skip = (page - 1) * limit;

  const filters: SessionFilters = {};
  if (req.query.classroomId)
    filters.classroomId = String(req.query.classroomId);
  if (req.query.subjectId) filters.subjectId = String(req.query.subjectId);
  if (req.query.sessionDate)
    filters.sessionDate = String(req.query.sessionDate);

  const requester = req.user!;
  if (requester.role === "TEACHER") {
    const links = await prisma.classroomTeacher.findMany({
      where: {
        teacherId: requester.id,
        schoolId: requester.schoolId ?? undefined,
        dateTo: null,
      },
      select: { classroomId: true },
    });
    const classroomIds = links.map((l) => l.classroomId);
    if (classroomIds.length === 0)
      return res.json({ data: [], meta: { total: 0, page, limit } });
    filters.classroomId = classroomIds;
  } else if (requester.role === "STUDENT") {
    const student = await prisma.student.findFirst({
      where: {
        userId: requester.id,
        schoolId: requester.schoolId ?? undefined,
      },
    });
    if (!student)
      return res.status(403).json({ error: "Perfil de aluno não encontrado" });
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: student.id,
        schoolId: requester.schoolId ?? undefined,
        status: "ATIVA",
      },
      select: { classroomId: true },
    });
    const classroomIds = enrollments.map((e) => e.classroomId);
    if (classroomIds.length === 0)
      return res.json({ data: [], meta: { total: 0, page, limit } });
    filters.classroomId = classroomIds;
  } else if (requester.role === "GUARDIAN") {
    const links = await prisma.studentGuardian.findMany({
      where: {
        guardianId: requester.id,
        schoolId: requester.schoolId ?? undefined,
      },
      select: { studentId: true },
    });
    if (!links || links.length === 0)
      return res
        .status(403)
        .json({ error: "Nenhum aluno vinculado a este responsável" });
    const studentIds = links.map((l) => l.studentId);
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: { in: studentIds },
        schoolId: requester.schoolId ?? undefined,
        status: "ATIVA",
      },
      select: { classroomId: true },
    });
    const classroomIds = enrollments.map((e) => e.classroomId);
    if (classroomIds.length === 0)
      return res.json({ data: [], meta: { total: 0, page, limit } });
    filters.classroomId = classroomIds;
  }

  const [items, total] = await Promise.all([
    service.findSessions(schoolId, filters, skip, limit),
    service.countSessions(schoolId, filters),
  ]);
  return res.json({ data: items, meta: { total, page, limit } });
}

export async function getSession(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = getParam(req, "id");
  const item = await service.findSessionById(id, schoolId);
  if (!item) return res.status(404).json({ error: "Session not found" });
  return res.json(item);
}

export async function updateSession(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = getParam(req, "id");
  const existing = await service.findSessionById(id, schoolId);
  if (!existing) return res.status(404).json({ error: "Session not found" });

  const data: any = {};
  ["sessionDate", "startTime", "endTime", "notes"].forEach((k) => {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  });
  if (data.sessionDate) data.sessionDate = new Date(data.sessionDate);
  if (data.startTime) data.startTime = new Date(data.startTime);
  if (data.endTime) data.endTime = new Date(data.endTime);

  const updated = await service.updateSession(id, data);
  return res.json(updated);
}

export async function removeSession(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = getParam(req, "id");
  const existing = await service.findSessionById(id, schoolId);
  if (!existing) return res.status(404).json({ error: "Session not found" });
  await service.softDeleteSession(id);
  return res.status(204).send();
}

export async function markRecords(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const sessionId = getParam(req, "id");
  const items: Array<{
    enrollmentId: string;
    status: string;
    justification?: string;
  }> = req.body.records || [];

  const session = await service.findSessionById(sessionId, schoolId);
  if (!session) return res.status(404).json({ error: "Session not found" });

  try {
    const results = [] as any[];
    for (const it of items) {
      const enrollment = await prisma.enrollment.findFirst({
        where: { id: it.enrollmentId, schoolId, deletedAt: null },
      });
      if (!enrollment) continue;
      const r = await service.upsertRecord(
        schoolId,
        sessionId,
        it.enrollmentId,
        it.status,
        it.justification,
      );
      results.push(r);
    }
    return res.json({ data: results });
  } catch (err) {
    return res.status(500).json({ error: "Error saving records" });
  }
}
