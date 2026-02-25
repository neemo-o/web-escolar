import { Request, Response } from "express";
import * as service from "./academic-years.service";
import { getSchoolId } from "../../middlewares/tenant";
import getParam from "../../utils/getParam";

export async function createAcademicYear(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId)
    return res.status(403).json({ error: "Escola não associada" });
  const { year, startDate, endDate } = req.body;

  if (!year || !startDate || !endDate) {
    return res
      .status(400)
      .json({ error: "year, startDate e endDate são obrigatórios" });
  }

  try {
    const created = await service.createAcademicYearRecord({
      schoolId,
      year: Number(year),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });
    return res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === "P2002")
      return res.status(400).json({ error: "Ano já cadastrado para a escola" });
    return res.status(500).json({ error: "Erro ao criar ano letivo" });
  }
}

export async function listAcademicYears(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const page = parseInt(String(req.query.page || "1"), 10) || 1;
  const limit = Math.min(
    parseInt(String(req.query.limit || "20"), 10) || 20,
    100,
  );
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    service.findAcademicYears(schoolId, skip, limit),
    service.countAcademicYears(schoolId),
  ]);

  return res.json({ data: items, meta: { total, page, limit } });
}

export async function getAcademicYear(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = getParam(req, "id");

  const year = await service.findAcademicYearById(id, schoolId);
  if (!year)
    return res.status(404).json({ error: "Ano letivo não encontrado" });

  return res.json(year);
}

export async function updateAcademicYear(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = getParam(req, "id");
  const { startDate, endDate } = req.body;

  const existing = await service.findAcademicYearById(id, schoolId);
  if (!existing)
    return res.status(404).json({ error: "Ano letivo não encontrado" });

  const updated = await service.updateAcademicYearById(id, {
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });
  return res.json(updated);
}

export async function activateAcademicYear(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = getParam(req, "id");

  const existing = await service.findAcademicYearById(id, schoolId);
  if (!existing)
    return res.status(404).json({ error: "Ano letivo não encontrado" });

  const updated = await service.activateAcademicYearById(id, schoolId);
  return res.json(updated);
}

export async function updateAcademicYearStatus(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = getParam(req, "id");
  const { status } = req.body;

  const allowed = ["PLANEJAMENTO", "EM_ANDAMENTO", "ENCERRADO", "ARQUIVADO"];
  if (!allowed.includes(status))
    return res.status(400).json({ error: "Status inválido" });

  const existing = await service.findAcademicYearById(id, schoolId);
  if (!existing)
    return res.status(404).json({ error: "Ano letivo não encontrado" });

  const updated = await service.updateAcademicYearById(id, { status });
  return res.json(updated);
}
