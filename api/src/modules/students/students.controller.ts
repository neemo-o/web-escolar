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
  const createdById = req.user!.id;
  const {
    name,
    socialName,
    cpf,
    rg,
    birthCertificate,
    birthDate,
    gender,
    nationality,
    naturalidade,
    email,
    phone,
    zipCode,
    street,
    addressNumber,
    neighborhood,
    city,
    state,
    avatarUrl,
  } = req.body;

  if (!name) return res.status(400).json({ error: "name é obrigatório" });

  try {
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const placeholderEmail = `student_${randomUUID()}@placeholder.internal`;

    const payload = {
      createdById,
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
        socialName: socialName ?? null,
        cpf: cpf ?? null,
        rg: rg ?? null,
        birthCertificate: birthCertificate ?? null,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender: gender ?? null,
        nationality: nationality ?? null,
        naturalidade: naturalidade ?? null,
        email: email ?? null,
        phone: phone ?? null,
        zipCode: zipCode ?? null,
        street: street ?? null,
        addressNumber: addressNumber ?? null,
        neighborhood: neighborhood ?? null,
        city: city ?? null,
        state: state ?? null,
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
  const limit = Math.min(
    parseInt(String(req.query.limit || "20"), 10) || 20,
    100,
  );
  const skip = (page - 1) * limit;
  const name = req.query.name ? String(req.query.name) : undefined;
  const status = req.query.status ? String(req.query.status) : undefined;

  const [items, total] = await Promise.all([
    service.findStudents(schoolId, name, status, skip, limit),
    service.countStudents(schoolId, name, status),
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
  const {
    name,
    socialName,
    cpf,
    rg,
    birthCertificate,
    birthDate,
    gender,
    nationality,
    naturalidade,
    email,
    phone,
    zipCode,
    street,
    addressNumber,
    neighborhood,
    city,
    state,
    avatarUrl,
    status,
    exitDate,
  } = req.body;

  const existing = await service.findStudentById(id, schoolId);
  if (!existing) return res.status(404).json({ error: "Aluno não encontrado" });

  const updated = await service.updateStudentById(id, {
    name: name ?? undefined,
    socialName: socialName !== undefined ? socialName || null : undefined,
    cpf: cpf !== undefined ? cpf || null : undefined,
    rg: rg !== undefined ? rg || null : undefined,
    birthCertificate:
      birthCertificate !== undefined ? birthCertificate || null : undefined,
    birthDate:
      birthDate !== undefined
        ? birthDate
          ? new Date(birthDate)
          : null
        : undefined,
    gender: gender !== undefined ? gender || null : undefined,
    nationality: nationality !== undefined ? nationality || null : undefined,
    naturalidade: naturalidade !== undefined ? naturalidade || null : undefined,
    email: email !== undefined ? email || null : undefined,
    phone: phone !== undefined ? phone || null : undefined,
    zipCode: zipCode !== undefined ? zipCode || null : undefined,
    street: street !== undefined ? street || null : undefined,
    addressNumber:
      addressNumber !== undefined ? addressNumber || null : undefined,
    neighborhood: neighborhood !== undefined ? neighborhood || null : undefined,
    city: city !== undefined ? city || null : undefined,
    state: state !== undefined ? state || null : undefined,
    avatarUrl: avatarUrl !== undefined ? avatarUrl || null : undefined,
    status: status ?? undefined,
    exitDate:
      exitDate !== undefined
        ? exitDate
          ? new Date(exitDate)
          : null
        : undefined,
  });

  if (existing.userId) {
    await prisma.user.update({
      where: { id: existing.userId },
      data: {
        ...(name ? { name } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
        ...(email !== undefined
          ? { email: email || existing.user?.email }
          : {}),
      },
    });
  }

  if (status && status !== existing.status) {
    await service.createMovement({
      schoolId,
      studentId: id,
      type:
        status === "TRANSFERIDO"
          ? "TRANSFERENCIA_TURMA"
          : status === "TRANCADO"
            ? "TRANCAMENTO"
            : status === "CONCLUIDO"
              ? "CONCLUSAO"
              : status === "CANCELADO"
                ? "CANCELAMENTO"
                : "OUTRO",
      description: `Situação alterada de ${existing.status} para ${status}`,
      fromValue: existing.status,
      toValue: status,
      createdById: req.user!.id,
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

  if (existing.userId) {
    await prisma.user.update({
      where: { id: existing.userId },
      data: { active: false, deletedAt: new Date() },
    });
  }

  return res.json({ ok: true });
}

// ── HEALTH ────────────────────────────────────────────────────────────────────

export async function getStudentHealth(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const studentId = getParam(req, "id");

  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId, deletedAt: null },
  });
  if (!student) return res.status(404).json({ error: "Aluno não encontrado" });

  const health = await service.findStudentHealth(studentId, schoolId);
  return res.json(health ?? {});
}

export async function upsertStudentHealth(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const studentId = getParam(req, "id");

  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId, deletedAt: null },
  });
  if (!student) return res.status(404).json({ error: "Aluno não encontrado" });

  const {
    allergies,
    dietaryRestrictions,
    specialNeeds,
    medication,
    bloodType,
    healthNotes,
  } = req.body;

  const health = await service.upsertStudentHealth(studentId, schoolId, {
    allergies: allergies ?? null,
    dietaryRestrictions: dietaryRestrictions ?? null,
    specialNeeds: specialNeeds ?? null,
    medication: medication ?? null,
    bloodType: bloodType ?? null,
    healthNotes: healthNotes ?? null,
  });

  return res.json(health);
}

// ── DOCUMENTS ─────────────────────────────────────────────────────────────────

export async function listStudentDocuments(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const studentId = getParam(req, "id");

  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId, deletedAt: null },
  });
  if (!student) return res.status(404).json({ error: "Aluno não encontrado" });

  const docs = await service.findStudentDocuments(studentId, schoolId);
  return res.json({ data: docs });
}

export async function createStudentDocument(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const studentId = getParam(req, "id");

  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId, deletedAt: null },
  });
  if (!student) return res.status(404).json({ error: "Aluno não encontrado" });

  const { type, name, fileUrl, delivered, notes } = req.body;
  if (!type || !name)
    return res.status(400).json({ error: "type e name são obrigatórios" });

  const doc = await service.createStudentDocument({
    schoolId,
    studentId,
    type,
    name,
    fileUrl: fileUrl ?? null,
    delivered: delivered ?? false,
    notes: notes ?? null,
  });

  return res.status(201).json(doc);
}

export async function updateStudentDocument(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const studentId = getParam(req, "id");
  const docId = getParam(req, "docId");

  const doc = await prisma.studentDocument.findFirst({
    where: { id: docId, studentId, schoolId },
  });
  if (!doc) return res.status(404).json({ error: "Documento não encontrado" });

  const { name, fileUrl, delivered, notes } = req.body;
  const updated = await service.updateStudentDocument(docId, {
    name: name ?? undefined,
    fileUrl: fileUrl !== undefined ? fileUrl || null : undefined,
    delivered: delivered !== undefined ? delivered : undefined,
    notes: notes !== undefined ? notes || null : undefined,
  });

  return res.json(updated);
}

export async function deleteStudentDocument(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const studentId = getParam(req, "id");
  const docId = getParam(req, "docId");

  const doc = await prisma.studentDocument.findFirst({
    where: { id: docId, studentId, schoolId },
  });
  if (!doc) return res.status(404).json({ error: "Documento não encontrado" });

  await service.deleteStudentDocument(docId);
  return res.status(204).send();
}

// ── HISTORY ───────────────────────────────────────────────────────────────────

export async function getStudentHistory(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const studentId = getParam(req, "id");

  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId, deletedAt: null },
  });
  if (!student) return res.status(404).json({ error: "Aluno não encontrado" });

  const history = await service.findStudentHistory(studentId, schoolId);
  return res.json({ data: history });
}

// ── GUARDIANS ─────────────────────────────────────────────────────────────────

export async function listStudentGuardians(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const studentId = getParam(req, "id");

  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId, deletedAt: null },
  });
  if (!student) return res.status(404).json({ error: "Aluno não encontrado" });

  const guardians = await prisma.studentGuardian.findMany({
    where: { studentId, schoolId },
    include: {
      guardian: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          active: true,
          guardianProfile: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return res.json({ data: guardians });
}

export async function linkGuardian(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const studentId = getParam(req, "id");
  const { guardianId, relationType, isFinancialResponsible, canPickUp, notes } =
    req.body;

  if (!guardianId)
    return res.status(400).json({ error: "guardianId é obrigatório" });

  const [student, guardian] = await Promise.all([
    prisma.student.findFirst({
      where: { id: studentId, schoolId, deletedAt: null },
    }),
    prisma.user.findFirst({
      where: { id: guardianId, schoolId, role: "GUARDIAN", deletedAt: null },
    }),
  ]);

  if (!student) return res.status(404).json({ error: "Aluno não encontrado" });
  if (!guardian)
    return res
      .status(404)
      .json({ error: "Responsável não encontrado na escola" });

  try {
    const link = await prisma.studentGuardian.create({
      data: {
        schoolId,
        studentId,
        guardianId,
        relationType: relationType ?? "OUTRO",
        isFinancialResponsible: isFinancialResponsible ?? false,
        canPickUp: canPickUp ?? true,
        notes: notes ?? null,
      },
    });
    return res.status(201).json(link);
  } catch (err: any) {
    if (err?.code === "P2002")
      return res.status(400).json({ error: "Vínculo já existe" });
    return res.status(500).json({ error: "Erro ao vincular responsável" });
  }
}

export async function updateGuardianLink(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const studentId = getParam(req, "id");
  const guardianId = getParam(req, "guardianId");

  const link = await prisma.studentGuardian.findFirst({
    where: { studentId, guardianId, schoolId },
  });
  if (!link) return res.status(404).json({ error: "Vínculo não encontrado" });

  const { relationType, isFinancialResponsible, canPickUp, notes } = req.body;
  const updated = await prisma.studentGuardian.update({
    where: { id: link.id },
    data: {
      relationType: relationType ?? undefined,
      isFinancialResponsible:
        isFinancialResponsible !== undefined
          ? isFinancialResponsible
          : undefined,
      canPickUp: canPickUp !== undefined ? canPickUp : undefined,
      notes: notes !== undefined ? notes || null : undefined,
    },
  });

  return res.json(updated);
}

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
