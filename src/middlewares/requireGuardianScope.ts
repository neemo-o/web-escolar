import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";

export async function requireGuardianScope(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = req.user!;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const links = await prisma.studentGuardian.findMany({
    where: {
      guardianId: user.id,
      ...(user.schoolId ? { schoolId: user.schoolId } : {}),
    },
    select: { studentId: true },
  });

  if (!links || links.length === 0)
    return res
      .status(403)
      .json({ error: "Nenhum aluno vinculado a este responsável" });

  req.guardianStudentIds = links.map((l) => l.studentId);
  return next();
}
