import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../config/prisma";
import { generateTempPassword } from "../../utils/password";
import * as service from "./users.service";
import getParam from "../../utils/getParam";

export async function createUser(req: Request, res: Response) {
  const requester = req.user!;
  const { email, name, phone, avatarUrl, role } = req.body;

  if (!email || !name || !role) {
    return res.status(400).json({ error: "email, name e role são obrigatórios" });
  }

  const isAdmin = requester.role === "ADMIN_GLOBAL";

  let schoolId: string | null = null;
  if (isAdmin) {
    schoolId = req.body.schoolId ?? null;
    if (role === "ADMIN_GLOBAL") {
      return res.status(403).json({ error: "Criação de ADMIN_GLOBAL via API não permitida" });
    }
    if ((role === "STUDENT" || role === "GUARDIAN") && !req.body.schoolId) {
      return res.status(400).json({ error: "schoolId é obrigatório para STUDENT e GUARDIAN" });
    }
  } else {
    schoolId = requester.schoolId!;
    const allowed = ["TEACHER", "STUDENT", "GUARDIAN"];
    if (!allowed.includes(role)) {
      return res.status(403).json({ error: "Secretaria só pode criar PROFESSOR, ALUNO ou RESPONSÁVEL" });
    }
  }

  try {
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const data: any = { email, name, phone: phone ?? null, avatarUrl: avatarUrl ?? null, role, passwordHash, schoolId };
    const user = await service.createUserRecord(data);
    return res.status(201).json({ user, temporaryPassword: tempPassword });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(400).json({ error: "Email já cadastrado para esta escola" });
    }
    return res.status(500).json({ error: "Erro ao criar usuário" });
  }
}

export async function listUsers(req: Request, res: Response) {
  const requester = req.user!;
  const page = parseInt(String(req.query.page || "1"), 10) || 1;
  const limit = Math.min(parseInt(String(req.query.limit || "20"), 10) || 20, 100);
  const skip = (page - 1) * limit;

  const where: any = { deletedAt: null };

  // FIX #3: allow filtering by active status (default = active only)
  if (req.query.active === "false") {
    where.active = false;
  } else if (req.query.active === "all") {
    // no filter
  } else {
    where.active = true;
  }

  if (requester.role === "ADMIN_GLOBAL") {
    if (req.query.schoolId) where.schoolId = String(req.query.schoolId);
    if (req.query.role) where.role = String(req.query.role);
  } else {
    where.schoolId = requester.schoolId;
    if (req.query.role) where.role = String(req.query.role);
  }

  // FIX #1: name search now works
  if (req.query.name) {
    where.name = { contains: String(req.query.name), mode: "insensitive" };
  }

  const [items, total] = await Promise.all([
    service.findUsers(where, skip, limit),
    service.countUsers(where),
  ]);

  return res.json({ data: items, meta: { total, page, limit } });
}

export async function getUser(req: Request, res: Response) {
  const requester = req.user!;
  const id = getParam(req, "id");

  const extraWhere: any = { deletedAt: null };
  if (requester.role !== "ADMIN_GLOBAL") extraWhere.schoolId = requester.schoolId;

  const user = await service.findUserById(id, extraWhere);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  return res.json(user);
}

export async function updateUser(req: Request, res: Response) {
  const requester = req.user!;
  const id = getParam(req, "id");
  const { name, phone, avatarUrl } = req.body;

  const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return res.status(404).json({ error: "Usuário não encontrado" });

  if (requester.role !== "ADMIN_GLOBAL" && existing.schoolId !== requester.schoolId) {
    return res.status(403).json({ error: "Sem permissão para editar este usuário" });
  }

  if (requester.role === "SECRETARY" && (existing.role === "SECRETARY" || existing.role === "ADMIN_GLOBAL")) {
    return res.status(403).json({ error: "Sem permissão para editar este usuário" });
  }

  const updated = await service.updateUserById(id, {
    name: name ?? undefined,
    phone: phone ?? undefined,
    avatarUrl: avatarUrl ?? undefined,
  });

  // FIX #16: sync name/phone to Student profile
  if (existing.role === "STUDENT") {
    await prisma.student.updateMany({
      where: { userId: id },
      data: {
        ...(name ? { name } : {}),
        ...(phone !== undefined ? { phone: phone ?? null } : {}),
      },
    });
  }

  return res.json(updated);
}

export async function deactivateUser(req: Request, res: Response) {
  const requester = req.user!;
  const id = getParam(req, "id");

  // FIX #5: prevent self-deactivation
  if (id === requester.id) {
    return res.status(403).json({ error: "Não é possível desativar seu próprio usuário" });
  }

  const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return res.status(404).json({ error: "Usuário não encontrado" });

  if (requester.role !== "ADMIN_GLOBAL" && existing.schoolId !== requester.schoolId) {
    return res.status(403).json({ error: "Sem permissão para desativar este usuário" });
  }

  const result = await service.deactivateUserById(id);

  // FIX #20: deactivate Student profile when user is deactivated
  if (existing.role === "STUDENT") {
    await prisma.student.updateMany({
      where: { userId: id },
      data: { deletedAt: new Date() },
    });
  }

  return res.json(result);
}

// FIX #3: reactivate user
export async function activateUser(req: Request, res: Response) {
  const requester = req.user!;
  const id = getParam(req, "id");

  const existing = await prisma.user.findFirst({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Usuário não encontrado" });

  if (requester.role !== "ADMIN_GLOBAL" && existing.schoolId !== requester.schoolId) {
    return res.status(403).json({ error: "Sem permissão" });
  }

  const result = await prisma.user.update({
    where: { id },
    data: { active: true, deletedAt: null },
    select: { id: true, active: true, updatedAt: true },
  });

  // reactivate Student profile too
  if (existing.role === "STUDENT") {
    await prisma.student.updateMany({
      where: { userId: id },
      data: { deletedAt: null },
    });
  }

  return res.json(result);
}

// FIX #4: stats endpoint — avoids loading 200 users to count in Overview
export async function getUserStats(req: Request, res: Response) {
  const requester = req.user!;

  const schoolId = requester.role === "ADMIN_GLOBAL"
    ? (req.query.schoolId ? String(req.query.schoolId) : undefined)
    : requester.schoolId!;

  const base: any = { deletedAt: null, active: true };
  if (schoolId) base.schoolId = schoolId;

  const [students, teachers, guardians, secretaries] = await Promise.all([
    prisma.user.count({ where: { ...base, role: "STUDENT" } }),
    prisma.user.count({ where: { ...base, role: "TEACHER" } }),
    prisma.user.count({ where: { ...base, role: "GUARDIAN" } }),
    prisma.user.count({ where: { ...base, role: "SECRETARY" } }),
  ]);

  return res.json({ students, teachers, guardians, secretaries });
}
