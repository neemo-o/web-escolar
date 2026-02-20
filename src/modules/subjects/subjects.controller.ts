import { Request, Response } from "express";
import * as service from "./subjects.service";
import { getSchoolId } from "../../middlewares/tenant";

export async function createSubject(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const { name, code, description } = req.body;

  if (!name || !code) return res.status(400).json({ error: "name e code são obrigatórios" });

  try {
    const created = await service.createSubjectRecord({ schoolId, name, code, description: description ?? null });
    return res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === "P2002") return res.status(400).json({ error: "Disciplina com esse código já existe na escola" });
    return res.status(500).json({ error: "Erro ao criar disciplina" });
  }
}

export async function listSubjects(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const page = parseInt(String(req.query.page || "1"), 10) || 1;
  const limit = Math.min(parseInt(String(req.query.limit || "20"), 10) || 20, 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    service.findSubjects(schoolId, skip, limit),
    service.countSubjects(schoolId),
  ]);

  return res.json({ data: items, meta: { total, page, limit } });
}

export async function getSubject(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const item = await service.findSubjectById(id, schoolId);
  if (!item) return res.status(404).json({ error: "Disciplina não encontrada" });
  return res.json(item);
}

export async function updateSubject(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, description } = req.body;

  const existing = await service.findSubjectById(id, schoolId);
  if (!existing) return res.status(404).json({ error: "Disciplina não encontrada" });

  const updated = await service.updateSubjectById(id, { name: name ?? undefined, description: description ?? undefined });
  return res.json(updated);
}

export async function deleteSubject(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const existing = await service.findSubjectById(id, schoolId);
  if (!existing) return res.status(404).json({ error: "Disciplina não encontrada" });

  const result = await service.softDeleteSubjectById(id);
  return res.json(result);
}
