import { Request, Response } from "express";
import { getSchoolId } from "../../middlewares/tenant";
import * as service from "./grades.service";
import getParam from "../../utils/getParam";
import { prisma } from "../../config/prisma";

export async function createOrUpdateGrade(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const changedById = (req.user as any)?.id;
  const { assessmentId, enrollmentId, score } = req.body;
  if (!assessmentId || !enrollmentId)
    return res
      .status(400)
      .json({ error: "assessmentId and enrollmentId required" });

  try {
    const result = await service.createOrUpdateGrade(
      { schoolId, assessmentId, enrollmentId, score },
      changedById,
    );
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: "Error saving grade" });
  }
}

export async function listGrades(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const page = parseInt(String(req.query.page || "1"), 10) || 1;
  const limit = Math.min(
    parseInt(String(req.query.limit || "20"), 10) || 20,
    100,
  );
  const skip = (page - 1) * limit;

  const filters: any = {};
  if (req.query.assessmentId)
    filters.assessmentId = String(req.query.assessmentId) || undefined;
  if ((req.params as any).assessmentId)
    filters.assessmentId = String((req.params as any).assessmentId);
  if (req.query.enrollmentId)
    filters.enrollmentId = String(req.query.enrollmentId) || undefined;
  if ((req.params as any).enrollmentId)
    filters.enrollmentId = String((req.params as any).enrollmentId);

  const requester = req.user!;
  if (requester.role === "STUDENT") {
    const student = await prisma.student.findFirst({
      where: { userId: requester.id, schoolId: requester.schoolId },
    });
    if (!student)
      return res.status(403).json({ error: "Perfil de aluno não encontrado" });
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: student.id,
        schoolId: requester.schoolId,
        status: "ATIVA",
      },
      select: { id: true },
    });
    const enrollmentIds = enrollments.map((e) => e.id);
    if (enrollmentIds.length === 0)
      return res.json({ data: [], meta: { total: 0, page, limit } });
    filters.enrollmentId = enrollmentIds;
  } else if (requester.role === "GUARDIAN") {
    const links = await prisma.studentGuardian.findMany({
      where: { guardianId: requester.id, schoolId: requester.schoolId },
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
        schoolId: requester.schoolId,
        status: "ATIVA",
      },
      select: { id: true },
    });
    const enrollmentIds = enrollments.map((e) => e.id);
    if (enrollmentIds.length === 0)
      return res.json({ data: [], meta: { total: 0, page, limit } });
    filters.enrollmentId = enrollmentIds;
  }

  const [items, total] = await Promise.all([
    service.findGrades(schoolId, filters, skip, limit),
    service.countGrades(schoolId, filters),
  ]);
  return res.json({ data: items, meta: { total, page, limit } });
}

export async function getGrade(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = getParam(req, "id");
  const item = await service.findGradeById(id, schoolId);
  if (!item) return res.status(404).json({ error: "Grade not found" });
  return res.json(item);
}
