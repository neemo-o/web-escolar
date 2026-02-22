import { Request, Response, NextFunction } from "express";

export function requireTenantMatch(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = req.user!;

  if (!user.schoolId && user.role !== "ADMIN_GLOBAL") {
    return res
      .status(403)
      .json({ error: "Acesso negado: escola não associada" });
  }

  return next();
}

export function getSchoolId(req: Request): string {
  if (!req.user?.schoolId) {
    throw new Error("schoolId não disponível no contexto do usuário");
  }
  return req.user.schoolId;
}
