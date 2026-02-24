import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { getSchoolId } from "../../middlewares/tenant";
import { generateTempPassword } from "../../utils/password";
import * as service from "./students.service";
import getParam from "../../utils/getParam";
import { randomUUID } from "crypto";
import { prisma } from "../../config/prisma";

export async function createStudent(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const { name, cpf, birthDate, email, phone, address, avatarUrl } = req.body;

  if (!name) return res.status(400).json({ error: "name é obrigatório" });

  try {
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const placeholderEmail = `student_${randomUUID()}@placeholder.internal`;

    const payload = {
      user: {
        schoolId,
        email: email ?? placeholderEmail,
        passwordHash,
        name,
        phone: phone ?? null,
        avatarUrl: avatarUrl ?? null,
        role: "STUDENT",
      },
      student: {
        schoolId,
        name,
        cpf: cpf ?? null,
        birthDate: birthDate ? new Date(birthDate) : null,
        email: email ?? null,
        phone: phone ?? null,
        address: address ?? null,
        avatarUrl: avatarUrl ?? null,
      },
    };

    const { student } = await service.createStudentWithUser(payload as any);
    return res.status(201).json({ student, temporaryPassword: tempPassword });
  } catch (err: any) {
    if (err?.code === "P2002")
      return res.status(400).json({ error: "Dados duplicados (cpf ou email)" });
    return res.status(500).json({ error: "Erro ao criar aluno" });
  }
}

export async function listStudents(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const page = parseInt(String(req.query.page || "1"), 10) || 1;
  const limit = Math.min(parseInt(String(req.query.limit || "20"), 10) || 20, 100);
  const skip = (page - 1) * limit;
  const name = req.query.name ? String(req.query.name) : undefined;

  const [items, total] = await Promise.all([
    service.findStudents(schoolId, name, skip, limit),
    service.countStudents(schoolId, name),
  ]);

  return res.json({ data: items, meta: { total, page, limit } });
}

export async function getStudent(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = getParam(req, "id");

  const student = await service.findStudentById(id, schoolId);
  if (!student) return res.status(404).json({ error: "Aluno não encontrado" });
  return res.json(student);
}

export async function updateStudent(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = getParam(req, "id");
  const { name, phone, address, avatarUrl } = req.body;

  const existing = await service.findStudentById(id, schoolId);
  if (!existing) return res.status(404).json({ error: "Aluno não encontrado" });

  const updated = await service.updateStudentById(id, {
    name: name ?? undefined,
    phone: phone ?? undefined,
    address: address ?? undefined,
    avatarUrl: avatarUrl ?? undefined,
  });

  // FIX #16: keep User name/phone in sync with Student
  if (existing.userId) {
    await prisma.user.update({
      where: { id: existing.userId },
      data: {
        ...(name ? { name } : {}),
        ...(phone !== undefined ? { phone: phone ?? null } : {}),
      },
    });
  }

  return res.json(updated);
}

export async function deleteStudent(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = getParam(req, "id");

  const existing = await service.findStudentById(id, schoolId);
  if (!existing) return res.status(404).json({ error: "Aluno não encontrado" });

  await service.softDeleteStudentById(id);

  // FIX #20: also deactivate the linked User
  if (existing.userId) {
    await prisma.user.update({
      where: { id: existing.userId },
      data: { active: false, deletedAt: new Date() },
    });
  }

  return res.json({ ok: true });
}

// FIX #2: list guardians for a student
export async function listStudentGuardians(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const studentId = getParam(req, "id");

  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId, deletedAt: null } });
  if (!student) return res.status(404).json({ error: "Aluno não encontrado" });

  const guardians = await prisma.studentGuardian.findMany({
    where: { studentId, schoolId },
    include: {
      guardian: {
        select: { id: true, name: true, email: true, phone: true, active: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return res.json({ data: guardians });
}

// FIX #2: link guardian to student
export async function linkGuardian(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const studentId = getParam(req, "id");
  const { guardianId } = req.body;

  if (!guardianId) return res.status(400).json({ error: "guardianId é obrigatório" });

  const [student, guardian] = await Promise.all([
    prisma.student.findFirst({ where: { id: studentId, schoolId, deletedAt: null } }),
    prisma.user.findFirst({ where: { id: guardianId, schoolId, role: "GUARDIAN", deletedAt: null } }),
  ]);

  if (!student) return res.status(404).json({ error: "Aluno não encontrado" });
  if (!guardian) return res.status(404).json({ error: "Responsável não encontrado na escola" });

  try {
    const link = await prisma.studentGuardian.create({
      data: { schoolId, studentId, guardianId },
    });
    return res.status(201).json(link);
  } catch (err: any) {
    if (err?.code === "P2002") return res.status(400).json({ error: "Vínculo já existe" });
    return res.status(500).json({ error: "Erro ao vincular responsável" });
  }
}

// FIX #2: unlink guardian from student
export async function unlinkGuardian(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const studentId = getParam(req, "id");
  const guardianId = getParam(req, "guardianId");

  const link = await prisma.studentGuardian.findFirst({
    where: { studentId, guardianId, schoolId },
  });

  if (!link) return res.status(404).json({ error: "Vínculo não encontrado" });

  await prisma.studentGuardian.delete({ where: { id: link.id } });
  return res.status(204).send();
}
