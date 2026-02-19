import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { generateTempPassword } from "../../utils/password";

export async function login(req: Request, res: Response) {
  const { schoolId, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email e password são obrigatórios" });
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
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const requester = req.user!;

  if (id === requester.id) {
    return res
      .status(403)
      .json({
        error: "Use o endpoint de troca de senha para alterar a própria senha",
      });
  }

  const target = await prisma.user.findFirst({
    where: { id, schoolId: requester.schoolId, deletedAt: null },
    select: { id: true, role: true },
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

  const tempPassword = generateTempPassword();
  const hash = await bcrypt.hash(tempPassword, 12);

  await prisma.user.update({
    where: { id },
    data: { passwordHash: hash },
  });

  return res.json({ temporaryPassword: tempPassword });
}
