import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { JwtPayload } from "../types/auth";
import { prisma } from "../config/prisma";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findFirst({
      where: { id: payload.sub, active: true, deletedAt: null },
      select: { id: true, schoolId: true, role: true },
    });

    if (!user)
      return res
        .status(401)
        .json({ error: "Usuário inativo ou não encontrado" });

    req.user = {
      id: user.id,
      schoolId: user.schoolId,
      role: user.role,
    };

    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}
