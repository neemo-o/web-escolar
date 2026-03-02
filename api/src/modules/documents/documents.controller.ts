import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { getSchoolId } from "../../middlewares/tenant";
import getParam from "../../utils/getParam";
import PDFDocument from "pdfkit";
import {
  loadSchoolConfig,
  drawHeader,
  drawFooter,
  drawSignatureLines,
  fetchLogoBuffer,
} from "./renderers/shared.renderer";
import { renderBoletim } from "./renderers/boletim.renderer";
import { renderComprovante } from "./renderers/comprovante.renderer";
import { renderHistorico } from "./renderers/historico.renderer";
import { renderFrequencia } from "./renderers/frequencia.renderer";
import { renderFichaAluno } from "./renderers/ficha-aluno.renderer";

const p: any = prisma as any;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-\u00C0-\u024F]/g, "_").slice(0, 80);
}

// ─── Variable resolution (internal) ──────────────────────────────────────────

async function resolveBodyVars(
  body: string,
  studentId: string | null,
  enrollmentId: string | null,
  schoolId: string,
): Promise<string> {
  const schoolCfgForVars = await (prisma as any).schoolConfig.findFirst({
    where: { schoolId },
    select: {
      displayName: true,
      address: true,
      phone: true,
      contactEmail: true,
      website: true,
      directorName: true,
    },
  });
  const school = await prisma.school.findFirst({
    where: { id: schoolId },
    select: { name: true },
  });



  const vars: Record<string, string> = {
    "{{aluno.nome}}": "—",
    "{{aluno.cpf}}": "—",
    "{{aluno.nascimento}}": "—",
    "{{aluno.mae}}": "—",
    "{{aluno.pai}}": "—",
    "{{matricula.numero}}": "—",
    "{{turma.nome}}": "—",
    "{{turma.serie}}": "—",
    "{{turma.turno}}": "—",
    "{{ano.letivo}}": "—",
    "{{responsavel.nome}}": "—",
    "{{escola.nome}}": schoolCfgForVars?.displayName || school?.name || "—",
    "{{escola.endereco}}": schoolCfgForVars?.address ?? "—",
    "{{escola.telefone}}": schoolCfgForVars?.phone ?? "—",
    "{{diretor.nome}}": schoolCfgForVars?.directorName ?? "—",
    "{{data}}": new Date().toLocaleDateString("pt-BR"),
    "{{data.hoje}}": new Date().toLocaleDateString("pt-BR"),
    "{{data.extenso}}": new Date().toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };

  if (studentId) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: {
        guardians: {
          take: 1,
          include: { guardian: { select: { name: true } } },
        } as any,
      },
    });
    if (student) {
      const s = student as any;
      vars["{{aluno.nome}}"] = s.name ?? "—";
      vars["{{aluno.cpf}}"] = s.cpf ?? "—";
      vars["{{aluno.nascimento}}"] = s.birthDate
        ? new Date(s.birthDate).toLocaleDateString("pt-BR")
        : "—";
      vars["{{aluno.mae}}"] = s.motherName ?? "—";
      vars["{{aluno.pai}}"] = s.fatherName ?? "—";
      const g = s.guardians?.[0];
      if (g) vars["{{responsavel.nome}}"] = g.guardian?.name ?? "—";
    }
  }

  if (enrollmentId) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, schoolId },
      include: {
        classroom: {
          include: { gradeLevel: { select: { name: true } } },
        },
        academicYear: { select: { year: true } },
      },
    });
    if (enrollment) {
      const e = enrollment as any;
      const TURNOS: Record<string, string> = {
        MANHA: "Manhã",
        TARDE: "Tarde",
        NOTURNO: "Noturno",
        INTEGRAL: "Integral",
      };
      vars["{{matricula.numero}}"] = e.enrollmentNumber ?? "—";
      vars["{{turma.nome}}"] = e.classroom?.name ?? "—";
      vars["{{turma.serie}}"] = e.classroom?.gradeLevel?.name ?? "—";
      vars["{{turma.turno}}"] = TURNOS[e.classroom?.shift] ?? "—";
      vars["{{ano.letivo}}"] = String(e.academicYear?.year ?? "—");
    }
  }

  let resolved = body;
  for (const [key, val] of Object.entries(vars)) {
    resolved = resolved.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), val);
  }
  return resolved;
}

// ─── TEMPLATES ────────────────────────────────────────────────────────────────

export async function listTemplates(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });

  const {
    category,
    active,
    templateType,
    page = "1",
    limit = "50",
  } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = { schoolId, deletedAt: null };
  if (category) where.category = category;
  if (templateType) where.templateType = templateType;
  if (active !== undefined) where.active = active === "true";

  const [items, total] = await Promise.all([
    p.documentTemplate.findMany({
      where,
      orderBy: [{ templateType: "asc" }, { name: "asc" }],
      include: { createdBy: { select: { id: true, name: true } } },
      skip,
      take: Number(limit),
    }),
    p.documentTemplate.count({ where }),
  ]);

  return res.json({
    data: items,
    meta: { total, page: Number(page), limit: Number(limit) },
  });
}

export async function getTemplate(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });
  const id = getParam(req, "id");

  const item = await p.documentTemplate.findFirst({
    where: { id, schoolId, deletedAt: null },
  });
  if (!item) return res.status(404).json({ error: "Template não encontrado" });
  return res.json(item);
}

export async function createTemplate(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });
  const createdById = (req.user as any)?.id;

  const {
    name,
    category,
    description,
    headerHtml,
    footerHtml,
    bodyTemplate,
    requiresSignature,
    showLogo,
    templateType,
    structuredConfig,
    signatureLines,
  } = req.body;

  if (!name) return res.status(400).json({ error: "name é obrigatório" });

  const created = await p.documentTemplate.create({
    data: {
      schoolId,
      createdById,
      name,
      category: category ?? "OUTRO",
      description: description ?? null,
      headerHtml: headerHtml ?? null,
      footerHtml: footerHtml ?? null,
      bodyTemplate: bodyTemplate ?? "",
      requiresSignature: requiresSignature ?? false,
      showLogo: showLogo ?? true,
      templateType: templateType ?? "FREE",
      structuredConfig: structuredConfig ?? null,
      signatureLines: signatureLines ?? null,
    },
  });
  return res.status(201).json(created);
}

export async function updateTemplate(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });
  const id = getParam(req, "id");

  const item = await p.documentTemplate.findFirst({
    where: { id, schoolId, deletedAt: null },
  });
  if (!item) return res.status(404).json({ error: "Template não encontrado" });

  const {
    name,
    category,
    description,
    headerHtml,
    footerHtml,
    bodyTemplate,
    requiresSignature,
    showLogo,
    active,
    structuredConfig,
    signatureLines,
  } = req.body;

  const data: any = {};
  if (name !== undefined) data.name = name;
  if (category !== undefined) data.category = category;
  if (description !== undefined) data.description = description || null;
  if (headerHtml !== undefined) data.headerHtml = headerHtml || null;
  if (footerHtml !== undefined) data.footerHtml = footerHtml || null;
  if (bodyTemplate !== undefined) data.bodyTemplate = bodyTemplate;
  if (requiresSignature !== undefined)
    data.requiresSignature = requiresSignature;
  if (showLogo !== undefined) data.showLogo = showLogo;
  if (active !== undefined) data.active = active;
  if (structuredConfig !== undefined) data.structuredConfig = structuredConfig;
  if (signatureLines !== undefined) data.signatureLines = signatureLines;

  const updated = await p.documentTemplate.update({ where: { id }, data });
  return res.json(updated);
}

export async function deleteTemplate(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });
  const id = getParam(req, "id");

  const item = await p.documentTemplate.findFirst({
    where: { id, schoolId, deletedAt: null },
  });
  if (!item) return res.status(404).json({ error: "Template não encontrado" });

  await p.documentTemplate.update({
    where: { id },
    data: { deletedAt: new Date(), active: false },
  });
  return res.status(204).send();
}

export async function duplicateTemplate(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });
  const id = getParam(req, "id");
  const createdById = (req.user as any)?.id;

  const original = await p.documentTemplate.findFirst({
    where: { id, schoolId, deletedAt: null },
  });
  if (!original)
    return res.status(404).json({ error: "Template não encontrado" });

  const { id: _id, createdAt, updatedAt, deletedAt, ...rest } = original;

  const copy = await p.documentTemplate.create({
    data: {
      ...rest,
      name: `Cópia de ${original.name}`,
      createdById,
      active: true,
    },
  });
  return res.status(201).json(copy);
}

// ─── SIGNATURE PRESETS ────────────────────────────────────────────────────────

export async function listSignaturePresets(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });

  const items = await p.documentSignaturePreset.findMany({
    where: { schoolId },
    orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }, { label: "asc" }],
  });
  return res.json({ data: items });
}

export async function createSignaturePreset(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });

  const { label, isDefault, sortOrder } = req.body;
  if (!label) return res.status(400).json({ error: "label é obrigatório" });

  const created = await p.documentSignaturePreset.create({
    data: {
      schoolId,
      label,
      isDefault: isDefault ?? false,
      sortOrder: sortOrder ?? 0,
    },
  });
  return res.status(201).json(created);
}

export async function deleteSignaturePreset(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });
  const id = getParam(req, "id");

  const item = await p.documentSignaturePreset.findFirst({
    where: { id, schoolId },
  });
  if (!item) return res.status(404).json({ error: "Preset não encontrado" });

  await p.documentSignaturePreset.delete({ where: { id } });
  return res.status(204).send();
}

// ─── ISSUED DOCUMENTS ─────────────────────────────────────────────────────────

export async function listIssuedDocuments(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });

  const {
    status,
    category,
    studentId,
    studentName,
    page = "1",
    limit = "20",
    dateFrom,
    dateTo,
  } = req.query;

  const where: any = { schoolId, deletedAt: null };
  if (status) where.status = status;
  if (category) where.category = category;
  if (studentId) where.studentId = studentId;
  if (studentName) {
    where.student = {
      name: { contains: String(studentName), mode: "insensitive" },
    };
  }
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(String(dateFrom));
    if (dateTo) where.createdAt.lte = new Date(String(dateTo) + "T23:59:59");
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    p.issuedDocument.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
      include: {
        student: { select: { id: true, name: true } },
        template: { select: { id: true, name: true, templateType: true } },
        createdBy: { select: { id: true, name: true } },
      },
    }),
    p.issuedDocument.count({ where }),
  ]);

  return res.json({
    data: items,
    meta: { total, page: Number(page), limit: Number(limit) },
  });
}

export async function getIssuedDocument(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });
  const id = getParam(req, "id");

  const item = await p.issuedDocument.findFirst({
    where: { id, schoolId, deletedAt: null },
    include: {
      student: { select: { id: true, name: true, cpf: true } },
      enrollment: { select: { id: true, enrollmentNumber: true } },
      template: {
        select: {
          id: true,
          name: true,
          templateType: true,
          structuredConfig: true,
        },
      },
      createdBy: { select: { id: true, name: true } },
      deliveredBy: { select: { id: true, name: true } },
    },
  });

  if (!item) return res.status(404).json({ error: "Documento não encontrado" });
  return res.json(item);
}

export async function createIssuedDocument(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });
  const createdById = (req.user as any)?.id;

  const {
    templateId,
    studentId,
    enrollmentId,
    title,
    bodySnapshot,
    headerSnapshot,
    footerSnapshot,
    category,
    notes,
    structuredPayload,
    signatureLines,
    emitNow = false,
  } = req.body;

  if (!title) return res.status(400).json({ error: "title é obrigatório" });

  // Validate tenant isolation
  if (studentId) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
    });
    if (!student)
      return res.status(404).json({ error: "Aluno não encontrado" });
  }
  if (enrollmentId) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, schoolId },
    });
    if (!enrollment)
      return res.status(404).json({ error: "Matrícula não encontrada" });
  }

  let templateType = "FREE";
  let resolvedStructuredConfig: any = null;

  if (templateId) {
    const template = await p.documentTemplate.findFirst({
      where: { id: templateId, schoolId, deletedAt: null },
    });
    if (!template)
      return res.status(404).json({ error: "Template não encontrado" });
    templateType = template.templateType;
    resolvedStructuredConfig =
      structuredPayload ?? template.structuredConfig ?? null;
  }

  const isEmitting = Boolean(emitNow);
  let resolvedBody: string | null = null;
  let resolvedHeader: string | null = null;
  let resolvedFooter: string | null = null;

  if (isEmitting && templateType === "FREE") {
    resolvedBody = await resolveBodyVars(
      bodySnapshot ?? "",
      studentId ?? null,
      enrollmentId ?? null,
      schoolId,
    );
    if (headerSnapshot)
      resolvedHeader = await resolveBodyVars(
        headerSnapshot,
        studentId ?? null,
        enrollmentId ?? null,
        schoolId,
      );
    if (footerSnapshot)
      resolvedFooter = await resolveBodyVars(
        footerSnapshot,
        studentId ?? null,
        enrollmentId ?? null,
        schoolId,
      );
  }

  const created = await p.issuedDocument.create({
    data: {
      schoolId,
      createdById,
      templateId: templateId ?? null,
      studentId: studentId ?? null,
      enrollmentId: enrollmentId ?? null,
      title,
      bodySnapshot: bodySnapshot ?? "",
      headerSnapshot: headerSnapshot ?? null,
      footerSnapshot: footerSnapshot ?? null,
      category: category ?? "OUTRO",
      notes: notes ?? null,
      status: isEmitting ? "EMITIDO" : "RASCUNHO",
      templateTypeSaved: templateType,
      structuredPayload: resolvedStructuredConfig,
      signatureLines: signatureLines ?? null,
      resolvedBody,
      resolvedHeader,
      resolvedFooter,
      emittedAt: isEmitting ? new Date() : null,
    },
  });
  return res.status(201).json(created);
}

export async function updateIssuedDocument(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });
  const id = getParam(req, "id");

  const item = await p.issuedDocument.findFirst({
    where: { id, schoolId, deletedAt: null },
  });
  if (!item) return res.status(404).json({ error: "Documento não encontrado" });
  if (item.status === "CANCELADO")
    return res
      .status(400)
      .json({ error: "Documento cancelado não pode ser editado" });

  const {
    title,
    bodySnapshot,
    headerSnapshot,
    footerSnapshot,
    category,
    notes,
    status,
    signatureLines,
    structuredPayload,
    emitNow,
  } = req.body;

  const data: any = {};
  if (title !== undefined) data.title = title;
  if (bodySnapshot !== undefined) data.bodySnapshot = bodySnapshot;
  if (headerSnapshot !== undefined)
    data.headerSnapshot = headerSnapshot || null;
  if (footerSnapshot !== undefined)
    data.footerSnapshot = footerSnapshot || null;
  if (category !== undefined) data.category = category;
  if (notes !== undefined) data.notes = notes || null;
  if (signatureLines !== undefined) data.signatureLines = signatureLines;
  if (structuredPayload !== undefined)
    data.structuredPayload = structuredPayload;

  const isEmitting = emitNow || status === "EMITIDO";
  if (isEmitting && item.status === "RASCUNHO") {
    const isFree = (item.templateTypeSaved ?? "FREE") === "FREE";
    if (isFree) {
      data.resolvedBody = await resolveBodyVars(
        bodySnapshot ?? item.bodySnapshot,
        item.studentId,
        item.enrollmentId,
        schoolId,
      );
      const h = headerSnapshot ?? item.headerSnapshot;
      const f = footerSnapshot ?? item.footerSnapshot;
      if (h)
        data.resolvedHeader = await resolveBodyVars(
          h,
          item.studentId,
          item.enrollmentId,
          schoolId,
        );
      if (f)
        data.resolvedFooter = await resolveBodyVars(
          f,
          item.studentId,
          item.enrollmentId,
          schoolId,
        );
    }
    data.status = "EMITIDO";
    data.emittedAt = new Date();
  } else if (status !== undefined) {
    data.status = status;
    if (status === "ENTREGUE" && !item.deliveredAt) {
      data.deliveredAt = new Date();
      data.deliveredById = (req.user as any)?.id;
    }
  }

  const updated = await p.issuedDocument.update({ where: { id }, data });
  return res.json(updated);
}

export async function deleteIssuedDocument(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });
  const id = getParam(req, "id");

  const item = await p.issuedDocument.findFirst({
    where: { id, schoolId, deletedAt: null },
  });
  if (!item) return res.status(404).json({ error: "Documento não encontrado" });

  await p.issuedDocument.update({
    where: { id },
    data: { deletedAt: new Date(), status: "CANCELADO" },
  });
  return res.status(204).send();
}

// ─── PDF GENERATION ───────────────────────────────────────────────────────────

export async function generateDocumentPdf(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });
  const id = getParam(req, "id");

  const item = await p.issuedDocument.findFirst({
    where: { id, schoolId, deletedAt: null },
    include: {
      template: {
        select: {
          id: true,
          templateType: true,
          structuredConfig: true,
          showLogo: true,
        },
      },
    },
  });
  if (!item) return res.status(404).json({ error: "Documento não encontrado" });

  // Mark as downloaded (bump count optionally) — future
  const templateType: string =
    item.templateTypeSaved ?? item.template?.templateType ?? "FREE";
  const structuredPayload =
    item.structuredPayload ?? item.template?.structuredConfig ?? {};

  try {
    switch (templateType) {
      case "BOLETIM":
        return await renderBoletim(
          res,
          schoolId,
          item.enrollmentId,
          {
            showFrequency: structuredPayload.showFrequency ?? true,
            showFinalGrade: structuredPayload.showFinalGrade ?? true,
            showSituation: structuredPayload.showSituation ?? true,
            showSignatureLines: structuredPayload.showSignatureLines ?? false,
            periodId: structuredPayload.periodId ?? undefined,
          },
          id,
        );

      case "COMPROVANTE_MATRICULA":
        if (!item.enrollmentId)
          return res.status(400).json({ error: "enrollmentId ausente" });
        return await renderComprovante(
          res,
          schoolId,
          item.enrollmentId,
          {
            showGuardian: structuredPayload.showGuardian ?? true,
            showSchedule: structuredPayload.showSchedule ?? false,
            showSubjects: structuredPayload.showSubjects ?? true,
            showSignatureLines: structuredPayload.showSignatureLines ?? true,
          },
          id,
        );

      case "HISTORICO_ESCOLAR":
        if (!item.studentId)
          return res.status(400).json({ error: "studentId ausente" });
        return await renderHistorico(
          res,
          schoolId,
          item.studentId,
          {
            showSignatureLines: structuredPayload.showSignatureLines ?? true,
            showObservations: structuredPayload.showObservations ?? false,
          },
          id,
        );

      case "DECLARACAO_FREQUENCIA":
        if (!item.enrollmentId)
          return res.status(400).json({ error: "enrollmentId ausente" });
        return await renderFrequencia(
          res,
          schoolId,
          item.enrollmentId,
          {
            showBySubject: structuredPayload.showBySubject ?? true,
            showSignatureLines: structuredPayload.showSignatureLines ?? true,
          },
          id,
        );

      case "FICHA_ALUNO":
        if (!item.studentId)
          return res.status(400).json({ error: "studentId ausente" });
        return await renderFichaAluno(
          res,
          schoolId,
          item.studentId,
          {
            showHealth: structuredPayload.showHealth ?? true,
            showGuardians: structuredPayload.showGuardians ?? true,
            showDocuments: structuredPayload.showDocuments ?? true,
            showEnrollments: structuredPayload.showEnrollments ?? true,
            showSignatureLines: structuredPayload.showSignatureLines ?? true,
          },
          id,
        );

      default:
        return await renderFreeDocumentPdf(res, item, schoolId, id);
    }
  } catch (err: any) {
    if (!res.headersSent)
      res.status(500).json({ error: err.message || "Erro ao gerar PDF" });
  }
}

export async function generateStructuredPdf(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });

  const { templateType, studentId, enrollmentId, cfg } = req.body;

  // Validate tenant isolation
  if (studentId) {
    const s = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
    });
    if (!s) return res.status(404).json({ error: "Aluno não encontrado" });
  }
  if (enrollmentId) {
    const e = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, schoolId },
    });
    if (!e) return res.status(404).json({ error: "Matrícula não encontrada" });
  }

  const fakeDocId = "preview";
  try {
    switch (templateType) {
      case "BOLETIM":
        return await renderBoletim(
          res,
          schoolId,
          enrollmentId,
          cfg ?? {},
          fakeDocId,
        );
      case "COMPROVANTE_MATRICULA":
        if (!enrollmentId)
          return res.status(400).json({ error: "enrollmentId é obrigatório" });
        return await renderComprovante(
          res,
          schoolId,
          enrollmentId,
          cfg ?? {},
          fakeDocId,
        );
      case "HISTORICO_ESCOLAR":
        if (!studentId)
          return res.status(400).json({ error: "studentId é obrigatório" });
        return await renderHistorico(
          res,
          schoolId,
          studentId,
          cfg ?? {},
          fakeDocId,
        );
      case "DECLARACAO_FREQUENCIA":
        if (!enrollmentId)
          return res.status(400).json({ error: "enrollmentId é obrigatório" });
        return await renderFrequencia(
          res,
          schoolId,
          enrollmentId,
          cfg ?? {},
          fakeDocId,
        );
      case "FICHA_ALUNO":
        if (!studentId)
          return res.status(400).json({ error: "studentId é obrigatório" });
        return await renderFichaAluno(
          res,
          schoolId,
          studentId,
          cfg ?? {},
          fakeDocId,
        );
      default:
        return res.status(400).json({ error: "templateType inválido" });
    }
  } catch (err: any) {
    if (!res.headersSent)
      res.status(500).json({ error: err.message || "Erro ao gerar PDF" });
  }
}

export async function resolveVariables(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });

  const { body, studentId, enrollmentId } = req.body;
  if (!body) return res.json({ resolved: "" });

  // Validate tenant isolation before resolving
  if (studentId) {
    const s = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
    });
    if (!s) return res.json({ resolved: body });
  }
  if (enrollmentId) {
    const e = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, schoolId },
    });
    if (!e) return res.json({ resolved: body });
  }

  const resolved = await resolveBodyVars(
    body,
    studentId ?? null,
    enrollmentId ?? null,
    schoolId,
  );
  return res.json({ resolved });
}

// ─── School Config ─────────────────────────────────────────────────────────────

export async function getSchoolConfig(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });

  const config = await p.schoolConfig.findUnique({ where: { schoolId } });
  return res.json(config ?? {});
}

export async function updateSchoolDocumentConfig(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });

  const {
    footerDefault,
    address,
    phone,
    contactEmail,
    website,
    directorName,
    directorTitle,
    displayName,
    logoUrl,
    headerHtml,
    footerHtml,
  } = req.body;

  const data: any = {};
  if (footerDefault !== undefined) data.footerDefault = footerDefault || null;
  if (address !== undefined) data.address = address || null;
  if (phone !== undefined) data.phone = phone || null;
  if (contactEmail !== undefined) data.contactEmail = contactEmail || null;
  if (website !== undefined) data.website = website || null;
  if (directorName !== undefined) data.directorName = directorName || null;
  if (directorTitle !== undefined) data.directorTitle = directorTitle || null;
  if (displayName !== undefined) data.displayName = displayName || null;
  if (logoUrl !== undefined) data.logoUrl = logoUrl || null;
  if (headerHtml !== undefined) data.headerHtml = headerHtml || null;
  if (footerHtml !== undefined) data.footerHtml = footerHtml || null;

  const updated = await p.schoolConfig.upsert({
    where: { schoolId },
    update: data,
    create: { schoolId, ...data },
  });
  return res.json(updated);
}
// ─── FREE PDF Renderer ─────────────────────────────────────────────────────────

async function renderFreeDocumentPdf(
  res: any,
  item: any,
  schoolId: string,
  docId: string,
) {
  const schoolCfg = await loadSchoolConfig(schoolId);
  
  const showLogo = item.template?.showLogo ?? true;

  const bodyHtml = item.resolvedBody ?? item.bodySnapshot ?? "";
 const headerHtml =
   item.resolvedHeader ??
   item.headerSnapshot ??
   (schoolCfg as any).headerHtml ??
   "";
 const footerHtml =
   item.resolvedFooter ??
   item.footerSnapshot ??
   (schoolCfg as any).footerHtml ??
   "";
  const signatures: string[] = Array.isArray(item.signatureLines)
    ? item.signatureLines.map((s: any) =>
        typeof s === "string" ? s : (s.label ?? ""),
      )
    : [];

  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
    autoFirstPage: true,
    bufferPages: true
  });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${sanitizeFilename(item.title)}.pdf"`,
  );
  doc.pipe(res);

  const marginL = 50;
  const marginR = 50;
  const pageW = 595;
  const contentW = pageW - marginL - marginR;

  // ─── Header
  if (headerHtml.trim()) {
    const headerText = stripHtml(headerHtml);
    if (headerText.trim()) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#374151")
        .text(headerText, marginL, 50, { width: contentW, align: "center" });
      doc.moveDown(0.5);
      doc
        .moveTo(marginL, doc.y)
        .lineTo(pageW - marginR, doc.y)
        .strokeColor("#e5e7eb")
        .lineWidth(0.5)
        .stroke();
      doc.moveDown(0.8);
    }
  } else {
    const startY = 45;
    if (showLogo && schoolCfg.logoUrl) {
      try {
        const buf = await fetchLogoBuffer(schoolCfg.logoUrl);
        if (buf) doc.image(buf, marginL, startY, { height: 38 });
      } catch {}
    }
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#111827")
      .text(schoolCfg.schoolName, marginL, startY + 2, {
        width: contentW,
        align: showLogo && schoolCfg.logoUrl ? "right" : "center",
      });
    if ((schoolCfg as any).address) {
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#6b7280")
        .text((schoolCfg as any).address, marginL, startY + 16, {
          width: contentW,
          align: showLogo && schoolCfg.logoUrl ? "right" : "center",
        });
    }
    doc.y = startY + 52;
    doc
      .moveTo(marginL, doc.y)
      .lineTo(pageW - marginR, doc.y)
      .strokeColor("#d1d5db")
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(0.8);
  }

  // ─── Title
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#111827")
    .text(item.title, marginL, doc.y, { width: contentW, align: "center" });
  doc.moveDown(1.2);

  // ─── Body — render with basic HTML formatting
  renderHtmlToPdf(doc, bodyHtml, marginL, contentW);

  // ─── Signature lines
  if (signatures.length > 0) {
    doc.moveDown(3);
    drawSignatureLines(doc, signatures);
  }

  // ─── Footer
 if (signatures.length > 0) {
   const sigSpace = 80;
   const footerSafeY = doc.page.height - 120;
   if (doc.y + sigSpace > footerSafeY) {
     // sem espaço suficiente, não adiciona moveDown extra
   } else {
     doc.moveDown(3);
   }
   drawSignatureLines(doc, signatures);
 }

 // ─── Footer (posição absoluta na página atual)
 const footerText = footerHtml.trim()
   ? stripHtml(footerHtml)
   : ((schoolCfg as any).footerDefault ??
     ((schoolCfg as any).footerHtml
       ? stripHtml((schoolCfg as any).footerHtml)
       : null));

 const footerY = doc.page.height - 65;

 // Garantir que o cursor não ultrapasse a área do footer
 if (doc.y > footerY - 10) {
   // conteúdo já passou da área do footer — não faz nada, footer fica sobreposto
   // (alternativa: adicionar página, mas isso causaria a 2ª página desnecessária)
 }

 doc
   .moveTo(marginL, footerY)
   .lineTo(pageW - marginR, footerY)
   .strokeColor("#e5e7eb")
   .lineWidth(0.5)
   .stroke();

 doc
   .font("Helvetica")
   .fontSize(8)
   .fillColor("#9ca3af")
   .text(
     `ID: ${docId.slice(0, 8).toUpperCase()} · Emitido em ${new Date().toLocaleDateString("pt-BR")}`,
     marginL,
     footerY + 6,
     { width: contentW / 2, align: "left" },
   );
 if (footerText) {
   doc
     .font("Helvetica")
     .fontSize(8)
     .fillColor("#6b7280")
     .text(footerText, marginL + contentW / 2, footerY + 6, {
       width: contentW / 2,
       align: "right",
     });
 } else {
   doc
     .font("Helvetica")
     .fontSize(8)
     .fillColor("#9ca3af")
     .text(schoolCfg.schoolName, marginL + contentW / 2, footerY + 6, {
       width: contentW / 2,
       align: "right",
     });
 }

  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    const fY = doc.page.height - 65;
    doc
      .moveTo(marginL, fY)
      .lineTo(pageW - marginR, fY)
      .strokeColor("#e5e7eb")
      .lineWidth(0.5)
      .stroke();
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#9ca3af")
      .text(
        `ID: ${docId.slice(0, 8).toUpperCase()} · Emitido em ${new Date().toLocaleDateString("pt-BR")}`,
        marginL,
        fY + 6,
        { width: contentW / 2, align: "left" },
      );
    if (footerText) {
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#6b7280")
        .text(footerText, marginL + contentW / 2, fY + 6, {
          width: contentW / 2,
          align: "right",
        });
    } else {
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#9ca3af")
        .text(schoolCfg.schoolName, marginL + contentW / 2, fY + 6, {
          width: contentW / 2,
          align: "right",
        });
    }
  }

  doc.flushPages();
  doc.end();
}

// ─── HTML → pdfkit basic renderer ─────────────────────────────────────────────
// Handles: <b>, <strong>, <i>, <em>, <u>, <p>, <br>, <ul>, <ol>, <li>, text align

type HtmlSegment = {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: "left" | "center" | "right" | "justify";
  listItem: boolean;
  listIndex?: number;
};

function renderHtmlToPdf(
  doc: InstanceType<typeof PDFDocument>,
  html: string,
  marginL: number,
  contentW: number,
): void {
  if (!html.trim()) return;

  // Parse block-level elements
  const blocks: HtmlSegment[][] = [];

  // Split on block boundaries
  const blockRe = /<(p|div|ul|ol|li|br)[^>]*>([\s\S]*?)<\/\1>|<br\s*\/?>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const rawBlocks: Array<{ tag: string; content: string; align: string }> = [];

  const normalised = html
    .replace(/<\/?(html|body|span)[^>]*>/gi, "")
    .replace(/<br\s*\/?>/gi, "<br/>");

  // Extract top-level blocks by collapsing to paragraphs
  const paragraphs = normalised
    .split(/<\/p>|<br\/>|<\/div>|<\/li>/i)
    .map((s) => s.replace(/<(p|div|li)[^>]*>/gi, "").trim())
    .filter(Boolean);

  for (const para of paragraphs) {
    const alignMatch = /text-align:\s*(left|center|right|justify)/i.exec(para);
    const align = (alignMatch?.[1] ?? "justify") as HtmlSegment["align"];
    const cleaned = para.replace(/<[^>]+>/g, (tag) => {
      const lower = tag.toLowerCase();
      if (/<\/?b>|<\/?strong>/i.test(tag)) return tag;
      if (/<\/?i>|<\/?em>/i.test(tag)) return tag;
      if (/<\/?u>/i.test(tag)) return tag;
      return "";
    });

    // Tokenise inline formatting
    const segments = tokenizeInline(cleaned, align);
    if (segments.length) blocks.push(segments);
  }

  // Render each paragraph
  for (const segs of blocks) {
    if (!segs.length) continue;
    const align = segs[0].align;
    const isJustify = align === "justify";
    const x = marginL;

    // Build text with options — pdfkit doesn't support mixed inline styles in one call
    // so we render each segment separately on the same line via continued: true
    let firstOnLine = true;
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      const isLast = i === segs.length - 1;
      const font =
        seg.bold && seg.italic
          ? "Helvetica-BoldOblique"
          : seg.bold
            ? "Helvetica-Bold"
            : seg.italic
              ? "Helvetica-Oblique"
              : "Helvetica";

      doc
        .font(font)
        .fontSize(11)
        .fillColor("#111827")
        .text(seg.text, firstOnLine ? x : undefined, undefined, {
          width: contentW,
          align: isJustify ? "justify" : align,
          continued: !isLast,
          underline: seg.underline,
          lineBreak: isLast,
        });
      firstOnLine = false;
    }
    doc.moveDown(0.4);
  }
}

function tokenizeInline(
  html: string,
  align: HtmlSegment["align"],
): HtmlSegment[] {
  const segments: HtmlSegment[] = [];
  const tagRe = /<(\/?)(?:b|strong|i|em|u)>/gi;
  let bold = false,
    italic = false,
    underline = false;
  let lastIdx = 0;
  let m: RegExpExecArray | null;

  const plain = (s: string) =>
    s
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"');

  while ((m = tagRe.exec(html)) !== null) {
    if (m.index > lastIdx) {
      const t = plain(html.slice(lastIdx, m.index));
      if (t)
        segments.push({
          text: t,
          bold,
          italic,
          underline,
          align,
          listItem: false,
        });
    }
    const closing = m[1] === "/";
    const tag = m[0]
      .toLowerCase()
      .replace(/[<>/]/g, "")
      .replace("strong", "b")
      .replace("em", "i");
    if (tag === "b") bold = !closing;
    else if (tag === "i") italic = !closing;
    else if (tag === "u") underline = !closing;
    lastIdx = tagRe.lastIndex;
  }
  if (lastIdx < html.length) {
    const t = plain(html.slice(lastIdx));
    if (t)
      segments.push({
        text: t,
        bold,
        italic,
        underline,
        align,
        listItem: false,
      });
  }
  return segments;
}
