import { Request, Response } from "express";
import * as service from "./periods.service";
import { getSchoolId } from "../../middlewares/tenant";
import { prisma } from "../../config/prisma";
import getParam from "../../utils/getParam";

export async function createPeriod(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const yearId = getParam(req, "yearId");
  const { name, sequence, startDate, endDate } = req.body;

  if (!name || sequence == null || !startDate || !endDate) {
    return res
      .status(400)
      .json({ error: "name, sequence, startDate e endDate são obrigatórios" });
  }

  // validate academic year belongs to school
  const year = await prisma.academicYear.findFirst({
    where: { id: yearId, schoolId },
  });
  if (!year)
    return res
      .status(404)
      .json({ error: "Ano letivo não encontrado para a escola" });

  try {
    const created = await service.createPeriodRecord({
      schoolId,
      academicYearId: yearId,
      name,
      sequence: Number(sequence),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });
    return res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === "P2002")
      return res
        .status(400)
        .json({ error: "Sequence já existe para este ano" });
    return res.status(500).json({ error: "Erro ao criar período" });
  }
}

export async function listPeriods(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const yearId = getParam(req, "yearId");

  const year = await prisma.academicYear.findFirst({
    where: { id: yearId, schoolId },
  });
  if (!year)
    return res
      .status(404)
      .json({ error: "Ano letivo não encontrado para a escola" });

  const items = await service.findPeriodsByYear(yearId);
  return res.json({ data: items });
}

export async function getPeriod(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const yearId = getParam(req, "yearId");
  const id = getParam(req, "id");

  const year = await prisma.academicYear.findFirst({
    where: { id: yearId, schoolId },
  });
  if (!year)
    return res
      .status(404)
      .json({ error: "Ano letivo não encontrado para a escola" });

  const period = await service.findPeriodById(id, yearId);
  if (!period) return res.status(404).json({ error: "Período não encontrado" });

  return res.json(period);
}

export async function updatePeriod(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const yearId = getParam(req, "yearId");
  const id = getParam(req, "id");
  const { name, startDate, endDate } = req.body;

  const year = await prisma.academicYear.findFirst({
    where: { id: yearId, schoolId },
  });
  if (!year)
    return res
      .status(404)
      .json({ error: "Ano letivo não encontrado para a escola" });

  const existing = await service.findPeriodById(id, yearId);
  if (!existing)
    return res.status(404).json({ error: "Período não encontrado" });

  const updated = await service.updatePeriodById(id, {
    name: name ?? undefined,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });
  return res.json(updated);
}

export async function updatePeriodStatus(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const yearId = getParam(req, "yearId");
  const id = getParam(req, "id");
  const { status } = req.body;

  const allowed = ["OPEN", "CLOSED"];
  if (!allowed.includes(status))
    return res.status(400).json({ error: "Status inválido" });

  const year = await prisma.academicYear.findFirst({
    where: { id: yearId, schoolId },
  });
  if (!year)
    return res
      .status(404)
      .json({ error: "Ano letivo não encontrado para a escola" });

  const existing = await service.findPeriodById(id, yearId);
  if (!existing)
    return res.status(404).json({ error: "Período não encontrado" });

  const updated = await service.updatePeriodById(id, { status });
  return res.json(updated);
}
