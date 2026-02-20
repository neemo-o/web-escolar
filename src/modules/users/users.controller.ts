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
    return res
      .status(400)
      .json({ error: "email, name e role são obrigatórios" });
  }

  const isAdmin = requester.role === "ADMIN_GLOBAL";

  let schoolId: string | null = null;
  if (isAdmin) {
    // allow admin to set schoolId (or null for global)
    schoolId = req.body.schoolId ?? null;
    if ((role === "STUDENT" || role === "GUARDIAN") && !req.body.schoolId) {
      return res
        .status(400)
        .json({ error: "schoolId é obrigatório para STUDENT e GUARDIAN" });
    }
  } else {
    // secretary: always use their school
    schoolId = requester.schoolId!;
    const allowed = ["TEACHER", "STUDENT", "GUARDIAN"];
    if (!allowed.includes(role)) {
      return res.status(403).json({
        error: "Secretaria só pode criar PROFESSOR, ESTUDANTE ou RESPONSÁVEL",
      });
    }
  }

  try {
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const data: any = {
      email,
      name,
      phone: phone ?? null,
      avatarUrl: avatarUrl ?? null,
      role,
      passwordHash,
      schoolId,
    };

    const user = await service.createUserRecord(data);

    return res.status(201).json({ user, temporaryPassword: tempPassword });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res
        .status(400)
        .json({ error: "Email já cadastrado para esta escola" });
    }
    return res.status(500).json({ error: "Erro ao criar usuário" });
  }
}

export async function listUsers(req: Request, res: Response) {
  const requester = req.user!;
  const page = parseInt(String(req.query.page || "1"), 10) || 1;
  const limit = Math.min(
    parseInt(String(req.query.limit || "20"), 10) || 20,
    100,
  );
  const skip = (page - 1) * limit;

  const where: any = { deletedAt: null, active: true };

  if (requester.role === "ADMIN_GLOBAL") {
    if (req.query.schoolId) where.schoolId = String(req.query.schoolId);
    if (req.query.role) where.role = String(req.query.role);
  } else {
    where.schoolId = requester.schoolId;
    if (req.query.role) where.role = String(req.query.role);
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
  if (requester.role !== "ADMIN_GLOBAL")
    extraWhere.schoolId = requester.schoolId;

  const user = await service.findUserById(id, extraWhere);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  return res.json(user);
}

export async function updateUser(req: Request, res: Response) {
  const requester = req.user!;
  const id = getParam(req, "id");
  const { name, phone, avatarUrl } = req.body;

  const existing = await prisma.user.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing)
    return res.status(404).json({ error: "Usuário não encontrado" });

  if (
    requester.role !== "ADMIN_GLOBAL" &&
    existing.schoolId !== requester.schoolId
  ) {
    return res
      .status(403)
      .json({ error: "Sem permissão para editar este usuário" });
  }

  const updated = await service.updateUserById(id, {
    name: name ?? undefined,
    phone: phone ?? undefined,
    avatarUrl: avatarUrl ?? undefined,
  });
  return res.json(updated);
}

export async function deactivateUser(req: Request, res: Response) {
  const requester = req.user!;
  const id = getParam(req, "id");

  const existing = await prisma.user.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing)
    return res.status(404).json({ error: "Usuário não encontrado" });

  if (
    requester.role !== "ADMIN_GLOBAL" &&
    existing.schoolId !== requester.schoolId
  ) {
    return res
      .status(403)
      .json({ error: "Sem permissão para desativar este usuário" });
  }

  const result = await service.deactivateUserById(id);
  return res.json(result);
}
