import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import getParam from "../../utils/getParam";
import { env } from "../../config/env";
import { generateTempPassword } from "../../utils/password";
import { sendPasswordResetEmail } from "../../utils/email";

export async function login(req: Request, res: Response) {
  const { schoolId, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios" });
  }

  const isAdminGlobal = !schoolId;

  const user = await prisma.user.findFirst({
    where: {
      email,
      active: true,
      deletedAt: null,
      ...(isAdminGlobal
        ? { role: "ADMIN_GLOBAL", schoolId: null }
        : { schoolId }),
    },
    select: {
      id: true,
      passwordHash: true,
      role: true,
      schoolId: true,
      school: isAdminGlobal ? undefined : { select: { active: true } },
    },
  });

  if (!schoolId && user && user.role !== "ADMIN_GLOBAL") {
    return res
      .status(400)
      .json({ error: "schoolId é obrigatório para este tipo de usuário" });
  }

  const DUMMY_HASH =
    "$2b$12$invalidhashfortimingprotectionxxxxxxxxxxxxxxxxxxxxxx";
  const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
  const passwordValid = await bcrypt.compare(password, hashToCompare);

  if (!user || !passwordValid) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  if (!isAdminGlobal && !(user as any).school?.active) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  // @ts-ignore
  const token = jwt.sign(
    { sub: user.id, schoolId: user.schoolId, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as string },
  );

  return res.json({ token, expiresIn: env.JWT_EXPIRES_IN });
}

export async function resetPassword(req: Request, res: Response) {
  const id = getParam(req, "id");
  const requester = req.user!;

  if (id === requester.id) {
    return res.status(403).json({
      error: "Use o endpoint de troca de senha para alterar a própria senha",
    });
  }

  const target = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, role: true, schoolId: true },
  });

  if (!target) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }

  const rolesAllowedToReset = ["STUDENT", "TEACHER", "GUARDIAN"];
  if (!rolesAllowedToReset.includes(target.role)) {
    return res
      .status(403)
      .json({ error: "Sem permissão para resetar senha deste usuário" });
  }

  if (requester.role !== "ADMIN_GLOBAL") {
    if (target.schoolId !== requester.schoolId) {
      return res
        .status(403)
        .json({ error: "Sem permissão para resetar senha deste usuário" });
    }
  }

  const tempPassword = generateTempPassword();
  const hash = await bcrypt.hash(tempPassword, 12);

  await prisma.user.update({
    where: { id },
    data: { passwordHash: hash },
  });

  return res.json({ temporaryPassword: tempPassword });
}

export async function me(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      schoolId: true,
      avatarUrl: true,
      phone: true,
    },
  });

  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  return res.json(user);
}

export async function changePassword(req: Request, res: Response) {
  const requester = req.user!;
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword)
    return res
      .status(400)
      .json({ error: "currentPassword e newPassword são obrigatórios" });

  if (typeof newPassword !== "string" || newPassword.length < 8)
    return res
      .status(400)
      .json({ error: "newPassword deve ter no mínimo 8 caracteres" });

  const user = await prisma.user.findFirst({
    where: { id: requester.id, deletedAt: null },
    select: { id: true, passwordHash: true },
  });

  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  const ok = await bcrypt.compare(currentPassword, user.passwordHash ?? "");
  if (!ok) return res.status(401).json({ error: "Senha atual incorreta" });

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hash },
  });

  return res.json({ message: "Senha alterada com sucesso" });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "E-mail é obrigatório" });

  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true, email: true, name: true },
  });

  // Always return success to avoid leaking which emails are registered
  if (!user) {
    return res.json({
      message: "Se o e-mail existir, instruções foram enviadas.",
    });
  }

  const tempPassword = generateTempPassword();
  const hash = await bcrypt.hash(tempPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hash },
  });

  try {
    await sendPasswordResetEmail(user.email, user.name ?? null, tempPassword);
  } catch (err) {
    // ignore email errors; still return generic success
  }

  return res.json({
    message: "Se o e-mail existir, instruções foram enviadas.",
  });
}
