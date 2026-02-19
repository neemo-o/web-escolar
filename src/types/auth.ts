export type JwtPayload = {
  sub: string;
  schoolId: string | null;
  role: string;
  iat?: number;
  exp?: number;
};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        schoolId: string | null;
        role: string;
      };
    }
  }
}
