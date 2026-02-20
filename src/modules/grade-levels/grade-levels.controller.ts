import { Request, Response } from "express";
import * as service from "./grade-levels.service";
import { getSchoolId } from "../../middlewares/tenant";

export async function createGradeLevel(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const { name, code, description, sortOrder } = req.body;

  if (!name || !code) return res.status(400).json({ error: "name e code são obrigatórios" });

  try {
    const created = await service.createGradeLevelRecord({ schoolId, name, code, description: description ?? null, sortOrder: sortOrder ?? 0 });
    return res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === "P2002") return res.status(400).json({ error: "Grade level com esse code já existe na escola" });
    return res.status(500).json({ error: "Erro ao criar grade level" });
  }
}

export async function listGradeLevels(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const page = parseInt(String(req.query.page || "1"), 10) || 1;
  const limit = Math.min(parseInt(String(req.query.limit || "20"), 10) || 20, 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    service.findGradeLevels(schoolId, skip, limit),
    service.countGradeLevels(schoolId),
  ]);

  return res.json({ data: items, meta: { total, page, limit } });
}

export async function getGradeLevel(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const item = await service.findGradeLevelById(id, schoolId);
  if (!item) return res.status(404).json({ error: "Grade level não encontrado" });
  return res.json(item);
}

export async function updateGradeLevel(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, description, sortOrder } = req.body;

  const existing = await service.findGradeLevelById(id, schoolId);
  if (!existing) return res.status(404).json({ error: "Grade level não encontrado" });

  const updated = await service.updateGradeLevelById(id, { name: name ?? undefined, description: description ?? undefined, sortOrder: sortOrder ?? undefined });
  return res.json(updated);
}

export async function deleteGradeLevel(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const existing = await service.findGradeLevelById(id, schoolId);
  if (!existing) return res.status(404).json({ error: "Grade level não encontrado" });

  
  await service.deleteGradeLevelById(id);
  return res.json({ success: true });
}
