import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { getSchoolId } from "../../middlewares/tenant";
import { generateTempPassword } from "../../utils/password";
import * as service from "./students.service";

export async function createStudent(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const { name, cpf, birthDate, email, phone, address, avatarUrl } = req.body;

  if (!name) return res.status(400).json({ error: "name é obrigatório" });

  try {
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const payload = {
      user: {
        schoolId,
        email: email ?? null,
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
  const limit = Math.min(
    parseInt(String(req.query.limit || "20"), 10) || 20,
    100,
  );
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
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const student = await service.findStudentById(id, schoolId);
  if (!student) return res.status(404).json({ error: "Aluno não encontrado" });
  return res.json(student);
}

export async function updateStudent(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, phone, address, avatarUrl } = req.body;

  const existing = await service.findStudentById(id, schoolId);
  if (!existing) return res.status(404).json({ error: "Aluno não encontrado" });

  const updated = await service.updateStudentById(id, {
    name: name ?? undefined,
    phone: phone ?? undefined,
    address: address ?? undefined,
    avatarUrl: avatarUrl ?? undefined,
  });
  return res.json(updated);
}

export async function deleteStudent(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const existing = await service.findStudentById(id, schoolId);
  if (!existing) return res.status(404).json({ error: "Aluno não encontrado" });

  const result = await service.softDeleteStudentById(id);
  return res.json(result);
}
