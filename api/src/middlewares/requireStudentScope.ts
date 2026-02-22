import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";

export async function requireStudentScope(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = req.user!;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const student = await prisma.student.findFirst({
    where: {
      userId: user.id,
      ...(user.schoolId ? { schoolId: user.schoolId } : {}),
    },
    select: { id: true },
  });

  if (!student)
    return res.status(403).json({ error: "Perfil de aluno não encontrado" });

  req.studentId = student.id;
  return next();
}
