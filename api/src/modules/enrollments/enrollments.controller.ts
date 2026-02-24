import { Request, Response } from "express";
import { getSchoolId } from "../../middlewares/tenant";
import { prisma } from "../../config/prisma";
import getParam from "../../utils/getParam";
import * as service from "./enrollments.service";
import { nextEnrollmentNumber } from "../../utils/enrollmentCounter";

export async function createEnrollment(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const { studentId, classroomId, academicYearId } = req.body;

  if (!studentId || !classroomId || !academicYearId) {
    return res.status(400).json({ error: "studentId, classroomId e academicYearId são obrigatórios" });
  }

  const [student, classroom, year] = await Promise.all([
    prisma.student.findFirst({ where: { id: studentId, schoolId, deletedAt: null } }),
    prisma.classroom.findFirst({ where: { id: classroomId, schoolId, deletedAt: null } }),
    prisma.academicYear.findFirst({ where: { id: academicYearId, schoolId } }),
  ]);

  if (!student) return res.status(404).json({ error: "Aluno não encontrado na escola" });
  if (!classroom) return res.status(404).json({ error: "Turma não encontrada na escola" });
  if (!year) return res.status(404).json({ error: "Ano letivo não encontrado na escola" });

  // FIX #7: block enrollment on closed/archived years
  if (year.status === "ENCERRADO" || year.status === "ARQUIVADO") {
    return res.status(400).json({ error: "Não é possível matricular em ano letivo encerrado ou arquivado" });
  }

  // FIX #8: validate classroom capacity
  const activeCount = await prisma.enrollment.count({
    where: { classroomId, schoolId, status: "ATIVA", deletedAt: null },
  });
  if (activeCount >= classroom.capacity) {
    return res.status(400).json({
      error: `Turma sem vagas disponíveis (capacidade: ${classroom.capacity}, matriculados: ${activeCount})`,
    });
  }

  // FIX #10: handle existing active enrollment for same year — auto-transfer between classrooms
  const existingActive = await prisma.enrollment.findFirst({
    where: { studentId, academicYearId, schoolId, deletedAt: null, status: "ATIVA" },
  });

  if (existingActive) {
    if (existingActive.classroomId === classroomId) {
      return res.status(400).json({ error: "Aluno já está matriculado nesta turma neste ano letivo" });
    }
    // Transfer: close current enrollment, open new one
    await prisma.enrollment.update({
      where: { id: existingActive.id },
      data: { status: "TRANSFERIDA" },
    });
  }

  try {
    const enrollmentNumber = await nextEnrollmentNumber(schoolId, year.year);
    const created = await prisma.enrollment.create({
      data: { schoolId, studentId, classroomId, academicYearId, enrollmentNumber, enrolledAt: new Date() },
      include: {
        student: { select: { id: true, name: true, cpf: true } },
        classroom: { select: { id: true, name: true } },
        academicYear: { select: { id: true, year: true } },
      },
    });
    return res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === "P2002") return res.status(400).json({ error: "Matrícula duplicada" });
    return res.status(500).json({ error: "Erro ao criar matrícula" });
  }
}

export async function listEnrollments(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const page = parseInt(String(req.query.page || "1"), 10) || 1;
  const limit = Math.min(parseInt(String(req.query.limit || "20"), 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filters: any = {};
  if (req.query.classroomId) filters.classroomId = String(req.query.classroomId);
  if (req.query.academicYearId) filters.academicYearId = String(req.query.academicYearId);
  if (req.query.status) filters.status = String(req.query.status);

  const requester = req.user!;

  if (requester.role === "STUDENT") {
    const student = await prisma.student.findFirst({
      where: { userId: requester.id, schoolId: requester.schoolId ?? undefined },
      select: { id: true },
    });
    if (!student) return res.status(403).json({ error: "Perfil de aluno não encontrado" });
    filters.studentId = student.id;
  } else if (requester.role === "GUARDIAN") {
    const links = await prisma.studentGuardian.findMany({
      where: { guardianId: requester.id, schoolId: requester.schoolId ?? undefined },
      select: { studentId: true },
    });
    if (!links || links.length === 0)
      return res.status(403).json({ error: "Nenhum aluno vinculado a este responsável" });
    filters.studentId = links.map((l) => l.studentId).filter(Boolean);
  } else if (requester.role === "TEACHER") {
    const teacherClassrooms = await prisma.classroomTeacher.findMany({
      where: { teacherId: requester.id, schoolId: requester.schoolId ?? undefined, dateTo: null },
      select: { classroomId: true },
    });
    if (!teacherClassrooms || teacherClassrooms.length === 0)
      return res.status(403).json({ error: "Nenhuma turma vinculada a este professor" });
    filters.classroomId = teacherClassrooms.map((c) => c.classroomId).filter(Boolean);
  }

  const [items, total] = await Promise.all([
    service.findEnrollments(schoolId, filters, skip, limit),
    service.countEnrollments(schoolId, filters),
  ]);

  return res.json({ data: items, meta: { total, page, limit } });
}

export async function getEnrollment(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = getParam(req, "id");
  const requester = req.user!;

  const item = await service.findEnrollmentById(id, schoolId);
  if (!item) return res.status(404).json({ error: "Matrícula não encontrada" });

  if (requester.role === "STUDENT") {
    const student = await prisma.student.findFirst({
      where: { userId: requester.id, schoolId: requester.schoolId ?? undefined },
    });
    if (!student || item.studentId !== student.id)
      return res.status(403).json({ error: "Acesso negado" });
  } else if (requester.role === "GUARDIAN") {
    const link = await prisma.studentGuardian.findFirst({
      where: { guardianId: requester.id, studentId: item.studentId, schoolId: requester.schoolId ?? undefined },
    });
    if (!link) return res.status(403).json({ error: "Acesso negado" });
  } else if (requester.role === "TEACHER") {
    const teacherClassrooms = await prisma.classroomTeacher.findMany({
      where: { teacherId: requester.id, schoolId: requester.schoolId ?? undefined, dateTo: null },
      select: { classroomId: true },
    });
    const classroomIds = teacherClassrooms.map((c) => c.classroomId);
    if (!item.classroomId || !classroomIds.includes(item.classroomId))
      return res.status(403).json({ error: "Sem permissão para acessar esta matrícula" });
  }

  return res.json(item);
}

export async function updateEnrollmentStatus(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = getParam(req, "id");
  const { status } = req.body;

  const allowed = ["ATIVA", "CONCLUIDA", "CANCELADA", "TRANSFERIDA", "SUSPENSA", "TRANCADA"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Status inválido" });

  const existing = await service.findEnrollmentById(id, schoolId);
  if (!existing) return res.status(404).json({ error: "Matrícula não encontrada" });

  const updated = await service.updateEnrollmentStatusById(id, status);
  return res.json(updated);
}
