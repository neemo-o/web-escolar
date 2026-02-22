import { Request } from "express";

export default function getParam(req: Request, key: string): string {
  const val = (req.params as any)[key];
  return Array.isArray(val) ? val[0] : val;
}
