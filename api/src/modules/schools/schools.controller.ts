import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import getParam from "../../utils/getParam";

export async function createSchool(req: Request, res: Response) {
  const { name, cnpj, slug } = req.body;

  if (!name || !cnpj || !slug) {
    return res
      .status(400)
      .json({ error: "name, cnpj e slug são obrigatórios" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: { name, cnpj, slug },
      });

      await tx.schoolConfig.create({ data: { schoolId: school.id } });

      return school;
    });

    return res.status(201).json(result);
  } catch (err: any) {
    if (err?.code === "P2028" || err?.meta?.target) {
      return res.status(400).json({ error: "Dados inválidos ou duplicados" });
    }
    return res.status(500).json({ error: "Erro ao criar escola" });
  }
}

export async function listSchools(req: Request, res: Response) {
  const page = parseInt(String(req.query.page || "1"), 10) || 1;
  const limit = Math.min(
    parseInt(String(req.query.limit || "20"), 10) || 20,
    100,
  );
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.school.findMany({
      where: { deletedAt: null },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { config: true },
    }),
    prisma.school.count({ where: { deletedAt: null } }),
  ]);

  return res.json({ data: items, meta: { total, page, limit } });
}

export async function listPublicSchools(req: Request, res: Response) {
  const items = await prisma.school.findMany({
    where: { deletedAt: null, active: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  // Return a simple array for public consumption
  return res.json(items);
}

export async function getSchool(req: Request, res: Response) {
  const id = getParam(req, "id");

  const school = await prisma.school.findFirst({
    where: { id, deletedAt: null },
    include: { config: true },
  });

  if (!school) return res.status(404).json({ error: "Escola não encontrada" });

  return res.json(school);
}

export async function updateSchool(req: Request, res: Response) {
  const id = getParam(req, "id");
  const { name, cnpj, slug } = req.body;

  try {
    const school = await prisma.school.findFirst({
      where: { id, deletedAt: null },
    });
    if (!school)
      return res.status(404).json({ error: "Escola não encontrada" });

    const updated = await prisma.school.update({
      where: { id },
      data: {
        name: name ?? undefined,
        cnpj: cnpj ?? undefined,
        slug: slug ?? undefined,
      },
    });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao atualizar escola" });
  }
}

export async function activateSchool(req: Request, res: Response) {
  const id = getParam(req, "id");

  const school = await prisma.school.findFirst({
    where: { id, deletedAt: null },
  });
  if (!school) return res.status(404).json({ error: "Escola não encontrada" });

  const updated = await prisma.school.update({
    where: { id },
    data: { active: true },
  });
  return res.json(updated);
}

export async function deactivateSchool(req: Request, res: Response) {
  const id = getParam(req, "id");

  const school = await prisma.school.findFirst({
    where: { id, deletedAt: null },
  });
  if (!school) return res.status(404).json({ error: "Escola não encontrada" });

  const updated = await prisma.school.update({
    where: { id },
    data: { active: false },
  });
  return res.json(updated);
}
