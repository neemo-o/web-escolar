import { Request, Response } from "express";
import { getSchoolId } from "../../middlewares/tenant";
import * as service from "./grades.service";
import getParam from "../../utils/getParam";
import { prisma } from "../../config/prisma";

export async function createOrUpdateGrade(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId)
    return res.status(403).json({ error: "Escola não associada" });
  const changedById = (req.user as any)?.id;
  const assessmentIdFromParams = (req.params as any).assessmentId;
  const { enrollmentId, score } = req.body;
  const assessmentId = assessmentIdFromParams ?? req.body.assessmentId;
  if (!assessmentId || !enrollmentId)
    return res
      .status(400)
      .json({ error: "assessmentId and enrollmentId required" });

  try {
    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, schoolId },
    });
    if (!assessment)
      return res.status(404).json({ error: "Avaliação não encontrada" });

    if (
      typeof score !== "number" ||
      Number.isNaN(score) ||
      score < 0 ||
      score > assessment.maxScore
    ) {
      return res.status(400).json({
        error: "Pontuação inválida: deve estar entre 0 e a nota máxima",
      });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, schoolId },
      select: { classroomId: true },
    });
    if (!enrollment)
      return res.status(404).json({ error: "Matrícula não encontrada" });
    if (enrollment.classroomId !== assessment.classroomId) {
      return res.status(403).json({
        error:
          "Acesso negado: matrícula não pertence à turma desta avaliação",
      });
    }

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
  const enrollmentIdParam = (req.params as any).enrollmentId
    ? String((req.params as any).enrollmentId)
    : undefined;

  const requester = req.user!;
  // If enrollmentId is provided via URL param, validate ownership for STUDENT and GUARDIAN
  if (enrollmentIdParam) {
    if (requester.role === "STUDENT") {
      const student = await prisma.student.findFirst({
        where: {
          userId: requester.id,
          schoolId: requester.schoolId ?? undefined,
        },
      });
      if (!student)
        return res
          .status(403)
          .json({ error: "Perfil de aluno não encontrado" });
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          id: enrollmentIdParam,
          studentId: student.id,
          schoolId: requester.schoolId ?? undefined,
        },
      });
      if (!enrollment) return res.status(403).json({ error: "Acesso negado" });
      filters.enrollmentId = enrollmentIdParam;
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
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          id: enrollmentIdParam,
          studentId: { in: studentIds },
          schoolId: requester.schoolId ?? undefined,
        },
      });
      if (!enrollment) return res.status(403).json({ error: "Acesso negado" });
      filters.enrollmentId = enrollmentIdParam;
    } else {
      // other roles: allow param to be applied directly
      filters.enrollmentId = enrollmentIdParam;
    }
  }

  if (requester.role === "STUDENT") {
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
      select: { id: true },
    });
    const enrollmentIds = enrollments.map((e) => e.id);
    if (enrollmentIds.length === 0)
      return res.json({ data: [], meta: { total: 0, page, limit } });
    // only apply the list filter when no specific enrollmentId param was provided
    if (!enrollmentIdParam) filters.enrollmentId = enrollmentIds;
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
      select: { id: true },
    });
    const enrollmentIds = enrollments.map((e) => e.id);
    if (enrollmentIds.length === 0)
      return res.json({ data: [], meta: { total: 0, page, limit } });
    if (!enrollmentIdParam) filters.enrollmentId = enrollmentIds;
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
  const requester = req.user!;
  if (requester.role === "TEACHER") {
    const assessment = await prisma.assessment.findFirst({
      where: { id: (item as any).assessmentId, schoolId },
    });
    if (!assessment)
      return res.status(404).json({ error: "Assessment not found" });
    const link = await prisma.classroomTeacher.findFirst({
      where: {
        teacherId: requester.id,
        classroomId: assessment.classroomId,
        dateTo: null,
        ...(requester.schoolId ? { schoolId: requester.schoolId } : {}),
      },
    });
    if (!link)
      return res
        .status(403)
        .json({ error: "Acesso negado: professor não vinculado a esta turma" });
  }
  return res.json(item);
}
