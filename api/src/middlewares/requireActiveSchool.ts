import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";

export async function requireActiveSchool(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = req.user!;

  if (user.role === "ADMIN_GLOBAL") {
    return next();
  }

  if (!user.schoolId) {
    return res
      .status(403)
      .json({ error: "Acesso negado: escola não associada" });
  }

  const school = await prisma.school.findFirst({
    where: { id: user.schoolId },
    select: { active: true },
  });

  if (!school || !school.active) {
    return res.status(403).json({ error: "Escola inativa" });
  }

  return next();
}
