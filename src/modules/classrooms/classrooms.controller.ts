import { Request, Response } from "express";
import * as service from "./classrooms.service";
import { getSchoolId } from "../../middlewares/tenant";
import { prisma } from "../../config/prisma";

export async function createClassroom(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const { academicYearId, gradeLevelId, name, shift, capacity } = req.body;

  if (!academicYearId || !gradeLevelId || !name || !shift || capacity == null) {
    return res.status(400).json({ error: "academicYearId, gradeLevelId, name, shift e capacity são obrigatórios" });
  }

  // validate academicYear and gradeLevel belong to school
  const [year, grade] = await Promise.all([
    prisma.academicYear.findFirst({ where: { id: academicYearId, schoolId } }),
    prisma.gradeLevel.findFirst({ where: { id: gradeLevelId, schoolId } }),
  ]);

  if (!year) return res.status(404).json({ error: "Ano letivo não encontrado para a escola" });
  if (!grade) return res.status(404).json({ error: "Grade level não encontrado para a escola" });

  try {
    const created = await service.createClassroomRecord({ schoolId, academicYearId, gradeLevelId, name, shift, capacity });
    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(500).json({ error: "Erro ao criar classroom" });
  }
}

export async function listClassrooms(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const page = parseInt(String(req.query.page || "1"), 10) || 1;
  const limit = Math.min(parseInt(String(req.query.limit || "20"), 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filters: any = {};
  if (req.query.academicYearId) filters.academicYearId = String(req.query.academicYearId);
  if (req.query.gradeLevelId) filters.gradeLevelId = String(req.query.gradeLevelId);

  const [items, total] = await Promise.all([
    service.findClassrooms(schoolId, filters, skip, limit),
    service.countClassrooms(schoolId, filters),
  ]);

  return res.json({ data: items, meta: { total, page, limit } });
}

export async function getClassroom(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const item = await service.findClassroomById(id, schoolId);
  if (!item) return res.status(404).json({ error: "Classroom não encontrado" });
  return res.json(item);
}

export async function updateClassroom(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, capacity, shift } = req.body;

  const existing = await service.findClassroomById(id, schoolId);
  if (!existing) return res.status(404).json({ error: "Classroom não encontrado" });

  const updated = await service.updateClassroomById(id, { name: name ?? undefined, capacity: capacity ?? undefined, shift: shift ?? undefined });
  return res.json(updated);
}

export async function deleteClassroom(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const existing = await service.findClassroomById(id, schoolId);
  if (!existing) return res.status(404).json({ error: "Classroom não encontrado" });

  const result = await service.softDeleteClassroomById(id);
  return res.json(result);
}
