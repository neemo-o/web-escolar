import { Request, Response } from "express";
import { getSchoolId } from "../../middlewares/tenant";
import * as service from "./assessments.service";
import { prisma } from "../../config/prisma";
import { AssessmentFilters } from "./assessments.types";
import getParam from "../../utils/getParam";

export async function createAssessment(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const { classroomId, subjectId, periodId, title, type, maxScore, date } =
    req.body;
  const createdById = (req.user as any)?.id;

  if (!classroomId || !subjectId || !periodId || !title || !maxScore || !date) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // validate related resources
  const [classroom, subject, period] = await Promise.all([
    prisma.classroom.findFirst({
      where: { id: classroomId, schoolId, deletedAt: null },
    }),
    prisma.subject.findFirst({
      where: { id: subjectId, schoolId, deletedAt: null },
    }),
    prisma.period.findFirst({ where: { id: periodId, schoolId } }),
  ]);
  if (!classroom) return res.status(404).json({ error: "Classroom not found" });
  if (!subject) return res.status(404).json({ error: "Subject not found" });
  if (!period) return res.status(404).json({ error: "Period not found" });

  try {
    const created = await service.createAssessment({
      schoolId,
      classroomId,
      subjectId,
      periodId,
      createdById,
      title,
      type,
      maxScore,
      date: new Date(date),
      description: req.body.description,
    });
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ error: "Error creating assessment" });
  }
}

export async function listAssessments(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const page = parseInt(String(req.query.page || "1"), 10) || 1;
  const limit = Math.min(
    parseInt(String(req.query.limit || "20"), 10) || 20,
    100,
  );
  const skip = (page - 1) * limit;

  const filters: AssessmentFilters = {};
  if (req.query.classroomId)
    filters.classroomId = String(req.query.classroomId);
  if (req.query.periodId) filters.periodId = String(req.query.periodId);
  if (req.query.subjectId) filters.subjectId = String(req.query.subjectId);
  if (req.query.status) filters.status = String(req.query.status);

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
    service.findAssessments(schoolId, filters, skip, limit),
    service.countAssessments(schoolId, filters),
  ]);

  return res.json({ data: items, meta: { total, page, limit } });
}

export async function getAssessment(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = getParam(req, "id");
  const item = await service.findAssessmentById(id, schoolId);
  if (!item) return res.status(404).json({ error: "Assessment not found" });
  return res.json(item);
}

export async function updateAssessment(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = getParam(req, "id");
  const existing = await service.findAssessmentById(id, schoolId);
  if (!existing) return res.status(404).json({ error: "Assessment not found" });

  const data: any = {};
  [
    "title",
    "type",
    "status",
    "maxScore",
    "weight",
    "date",
    "description",
  ].forEach((k) => {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  });
  if (data.date) data.date = new Date(data.date);

  const updated = await service.updateAssessment(id, data);
  return res.json(updated);
}

export async function removeAssessment(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = getParam(req, "id");
  const existing = await service.findAssessmentById(id, schoolId);
  if (!existing) return res.status(404).json({ error: "Assessment not found" });

  await service.softDeleteAssessment(id);
  return res.status(204).send();
}
