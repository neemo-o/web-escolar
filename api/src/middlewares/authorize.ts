import { Request, Response, NextFunction } from "express";

type AllowedRole =
  | "ADMIN_GLOBAL"
  | "SECRETARY"
  | "TEACHER"
  | "STUDENT"
  | "GUARDIAN";

export function authorize(roles: AllowedRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user!;

    if (!roles.includes(user.role as AllowedRole)) {
      return res
        .status(403)
        .json({ error: "Acesso negado: permissão insuficiente" });
    }

    return next();
  };
}
