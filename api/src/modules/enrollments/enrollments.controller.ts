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
    return res.status(400).json({
      error: "studentId, classroomId e academicYearId são obrigatórios",
    });
  }

  // validate student and classroom belong to school
  const [student, classroom, year] = await Promise.all([
    prisma.student.findFirst({
      where: { id: studentId, schoolId, deletedAt: null },
    }),
    prisma.classroom.findFirst({
      where: { id: classroomId, schoolId, deletedAt: null },
    }),
    prisma.academicYear.findFirst({ where: { id: academicYearId, schoolId } }),
  ]);

  if (!student)
    return res.status(404).json({ error: "Aluno não encontrado na escola" });
  if (!classroom)
    return res
      .status(404)
      .json({ error: "Classroom não encontrado na escola" });
  if (!year)
    return res
      .status(404)
      .json({ error: "Ano letivo não encontrado na escola" });

  // check duplicate active enrollment for the same academic year
  const existing = await prisma.enrollment.findFirst({
    where: {
      studentId,
      academicYearId,
      schoolId,
      deletedAt: null,
      status: "ATIVA",
    },
  });
  if (existing)
    return res
      .status(400)
      .json({ error: "Aluno já possui matrícula ativa neste ano letivo" });

  try {
    const enrollmentNumber = await nextEnrollmentNumber(schoolId, year.year);

    const created = await prisma.enrollment.create({
      data: {
        schoolId,
        studentId,
        classroomId,
        academicYearId,
        enrollmentNumber,
        enrolledAt: new Date(),
      },
    });

    return res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === "P2002")
      return res.status(400).json({ error: "Matrícula duplicada" });
    return res.status(500).json({ error: "Erro ao criar matrícula" });
  }
}

export async function listEnrollments(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const page = parseInt(String(req.query.page || "1"), 10) || 1;
  const limit = Math.min(
    parseInt(String(req.query.limit || "20"), 10) || 20,
    100,
  );
  const skip = (page - 1) * limit;

  const filters: any = {};
  if (req.query.classroomId)
    filters.classroomId = String(req.query.classroomId);
  if (req.query.academicYearId)
    filters.academicYearId = String(req.query.academicYearId);
  if (req.query.status) filters.status = String(req.query.status);

  const requester = req.user!;
  if (requester.role === "STUDENT") {
    const student = await prisma.student.findFirst({
      where: {
        userId: requester.id,
        schoolId: requester.schoolId ?? undefined,
      },
      select: { id: true },
    });
    if (!student)
      return res.status(403).json({ error: "Perfil de aluno não encontrado" });
    filters.studentId = student.id;
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
    const studentIds = links
      .map((l) => l.studentId)
      .filter((id): id is string => !!id);
    if (studentIds.length === 0)
      return res
        .status(403)
        .json({ error: "Nenhum aluno vinculado a este responsável" });
    filters.studentId = studentIds;
  } else if (requester.role === "TEACHER") {
    const teacherClassrooms = await prisma.classroomTeacher.findMany({
      where: {
        teacherId: requester.id,
        schoolId: requester.schoolId ?? undefined,
        dateTo: null,
      },
      select: { classroomId: true },
    });
    if (!teacherClassrooms || teacherClassrooms.length === 0)
      return res
        .status(403)
        .json({ error: "Nenhuma turma vinculada a este professor" });
    const classroomIds = teacherClassrooms
      .map((c) => c.classroomId)
      .filter((id): id is string => !!id);
    if (classroomIds.length === 0)
      return res
        .status(403)
        .json({ error: "Nenhuma turma vinculada a este professor" });
    filters.classroomId = { in: classroomIds };
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

  const item = await service.findEnrollmentById(id, schoolId);
  if (!item) return res.status(404).json({ error: "Matrícula não encontrada" });

  const requester = req.user!;
  if (requester.role === "STUDENT") {
    const student = await prisma.student.findFirst({
      where: {
        userId: requester.id,
        schoolId: requester.schoolId ?? undefined,
      },
      select: { id: true },
    });
    if (!student)
      return res.status(403).json({ error: "Perfil de aluno não encontrado" });
    if (item.studentId !== student.id)
      return res
        .status(403)
        .json({ error: "Sem permissão para acessar esta matrícula" });
  } else if (requester.role === "GUARDIAN") {
    const links = await prisma.studentGuardian.findMany({
      where: {
        guardianId: requester.id,
        schoolId: requester.schoolId ?? undefined,
      },
      select: { studentId: true },
    });
    const studentIds = links.map((l) => l.studentId);
    if (!studentIds.includes(item.studentId))
      return res
        .status(403)
        .json({ error: "Sem permissão para acessar esta matrícula" });
  } else if (requester.role === "TEACHER") {
    const teacherClassrooms = await prisma.classroomTeacher.findMany({
      where: {
        teacherId: requester.id,
        schoolId: requester.schoolId ?? undefined,
        dateTo: null,
      },
      select: { classroomId: true },
    });
    const classroomIds = teacherClassrooms
      .map((c) => c.classroomId)
      .filter((id): id is string => !!id);
    if (!item.classroomId || !classroomIds.includes(item.classroomId))
      return res
        .status(403)
        .json({ error: "Sem permissão para acessar esta matrícula" });
  }

  return res.json(item);
}

export async function updateEnrollmentStatus(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = getParam(req, "id");
  const { status } = req.body;

  const allowed = [
    "ATIVA",
    "CONCLUIDA",
    "CANCELADA",
    "TRANSFERIDA",
    "SUSPENSA",
    "TRANCADA",
  ];
  if (!allowed.includes(status))
    return res.status(400).json({ error: "Status inválido" });

  const existing = await service.findEnrollmentById(id, schoolId);
  if (!existing)
    return res.status(404).json({ error: "Matrícula não encontrada" });

  const updated = await service.updateEnrollmentStatusById(id, status);
  return res.json(updated);
}
