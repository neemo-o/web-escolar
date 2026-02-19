import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import { generateTempPassword } from "../../utils/password";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";

export async function login(req: Request, res: Response) {
  const { schoolId, email, password } = req.body;

  if (!schoolId || !email || !password) {
    return res
      .status(400)
      .json({ error: "schoolId, email e password são obrigatórios" });
  }

  const school = await prisma.school.findFirst({
    where: { id: schoolId, active: true, deletedAt: null },
    select: { id: true },
  });

  if (!school) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const user = await prisma.user.findFirst({
    where: { schoolId, email, active: true, deletedAt: null },
    select: { id: true, passwordHash: true, role: true, schoolId: true },
  });

  if (!user) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const token = jwt.sign(
    { sub: user.id, schoolId: user.schoolId, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions,
  );

  return res.json({ token, expiresIn: JWT_EXPIRES_IN });
}

export async function resetPassword(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const requester = req.user!;

  const target = await prisma.user.findFirst({
    where: { id, schoolId: requester.schoolId, deletedAt: null },
    select: { id: true },
  });

  if (!target) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }

  const tempPassword = generateTempPassword();
  const hash = await bcrypt.hash(tempPassword, 12);

  await prisma.user.update({
    where: { id },
    data: { passwordHash: hash },
  });

  return res.json({ temporaryPassword: tempPassword });
}
