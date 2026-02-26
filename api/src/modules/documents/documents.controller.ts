import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { getSchoolId } from "../../middlewares/tenant";
import getParam from "../../utils/getParam";
import PDFDocument from "pdfkit";
import { loadSchoolConfig } from "./renderers/shared.renderer";
import { renderBoletim } from "./renderers/boletim.renderer";
import { renderComprovante } from "./renderers/comprovante.renderer";
import { renderHistorico } from "./renderers/historico.renderer";
import { renderFrequencia } from "./renderers/frequencia.renderer";
import { renderFichaAluno } from "./renderers/ficha-aluno.renderer";

const p: any = prisma as any;

// ─── TEMPLATES ────────────────────────────────────────────────────────────────

export async function listTemplates(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });

  const { category, active, templateType } = req.query;
  const where: any = { schoolId, deletedAt: null };
  if (category) where.category = category;
  if (templateType) where.templateType = templateType;
  if (active !== undefined) where.active = active === "true";

  const items = await p.documentTemplate.findMany({
    where,
    orderBy: [{ templateType: "asc" }, { name: "asc" }],
    include: { createdBy: { select: { id: true, name: true } } },
  });

  return res.json({ data: items });
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
  } = req.body;
  if (!name) return res.status(400).json({ error: "name é obrigatório" });

  const created = await p.documentTemplate.create({
    data: {
      schoolId,
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
      createdById,
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
  } = req.body;

  const updated = await p.documentTemplate.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(description !== undefined && { description: description || null }),
      ...(headerHtml !== undefined && { headerHtml: headerHtml || null }),
      ...(footerHtml !== undefined && { footerHtml: footerHtml || null }),
      ...(bodyTemplate !== undefined && { bodyTemplate }),
      ...(requiresSignature !== undefined && { requiresSignature }),
      ...(showLogo !== undefined && { showLogo }),
      ...(active !== undefined && { active }),
      ...(structuredConfig !== undefined && { structuredConfig }),
    },
  });

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
    data: { deletedAt: new Date() },
  });
  return res.status(204).send();
}

// ─── ISSUED DOCUMENTS ─────────────────────────────────────────────────────────

export async function listIssuedDocuments(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });

  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
  const limit = Math.min(50, parseInt(String(req.query.limit || "20"), 10));
  const skip = (page - 1) * limit;

  const where: any = { schoolId, deletedAt: null };
  if (req.query.studentId) where.studentId = String(req.query.studentId);
  if (req.query.enrollmentId)
    where.enrollmentId = String(req.query.enrollmentId);
  if (req.query.status) where.status = String(req.query.status);
  if (req.query.category) where.category = String(req.query.category);

  const [items, total] = await Promise.all([
    p.issuedDocument.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        student: { select: { id: true, name: true } },
        template: {
          select: { id: true, name: true, category: true, templateType: true },
        },
        createdBy: { select: { id: true, name: true } },
        deliveredBy: { select: { id: true, name: true } },
      },
    }),
    p.issuedDocument.count({ where }),
  ]);

  return res.json({ data: items, meta: { total, page, limit } });
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
  } = req.body;

  if (!title) return res.status(400).json({ error: "title é obrigatório" });

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

  const created = await p.issuedDocument.create({
    data: {
      schoolId,
      templateId: templateId ?? null,
      studentId: studentId ?? null,
      enrollmentId: enrollmentId ?? null,
      title,
      bodySnapshot: bodySnapshot ?? "",
      headerSnapshot: headerSnapshot ?? null,
      footerSnapshot: footerSnapshot ?? null,
      category: category ?? "OUTRO",
      notes: notes ?? null,
      status: "RASCUNHO",
      createdById,
      structuredPayload: resolvedStructuredConfig,
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
  } = req.body;

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (bodySnapshot !== undefined) updateData.bodySnapshot = bodySnapshot;
  if (headerSnapshot !== undefined)
    updateData.headerSnapshot = headerSnapshot || null;
  if (footerSnapshot !== undefined)
    updateData.footerSnapshot = footerSnapshot || null;
  if (category !== undefined) updateData.category = category;
  if (notes !== undefined) updateData.notes = notes || null;
  if (status !== undefined) {
    updateData.status = status;
    if (status === "ENTREGUE" && !item.deliveredAt) {
      updateData.deliveredAt = new Date();
      updateData.deliveredById = (req.user as any)?.id;
    }
  }

  const updated = await p.issuedDocument.update({
    where: { id },
    data: updateData,
  });
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

// ─── PDF GENERATION — dispatcher ──────────────────────────────────────────────

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

  const templateType: string = item.template?.templateType ?? "FREE";
  const structuredPayload =
    item.structuredPayload ?? item.template?.structuredConfig ?? {};

  try {
    switch (templateType) {
      case "BOLETIM":
        await renderBoletim(
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
        break;

      case "COMPROVANTE_MATRICULA":
        await renderComprovante(
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
        break;

      case "HISTORICO_ESCOLAR":
        await renderHistorico(
          res,
          schoolId,
          item.studentId,
          {
            showSignatureLines: structuredPayload.showSignatureLines ?? true,
            showObservations: structuredPayload.showObservations ?? false,
          },
          id,
        );
        break;

      case "DECLARACAO_FREQUENCIA":
        await renderFrequencia(
          res,
          schoolId,
          item.enrollmentId,
          {
            showBySubject: structuredPayload.showBySubject ?? true,
            showSignatureLines: structuredPayload.showSignatureLines ?? true,
          },
          id,
        );
        break;

      case "FICHA_ALUNO":
        await renderFichaAluno(
          res,
          schoolId,
          item.studentId,
          {
            showHealth: structuredPayload.showHealth ?? true,
            showGuardians: structuredPayload.showGuardians ?? true,
            showDocuments: structuredPayload.showDocuments ?? true,
            showEnrollments: structuredPayload.showEnrollments ?? true,
            showSignatureLines: structuredPayload.showSignatureLines ?? false,
          },
          id,
        );
        break;

      default:
        await renderFreeDocument(res, item, schoolId, id);
        break;
    }

    // Mark as emitido if was rascunho
    if (item.status === "RASCUNHO") {
      await p.issuedDocument.update({
        where: { id },
        data: { status: "EMITIDO" },
      });
    }
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Erro ao gerar PDF" });
    }
  }
}

// ─── Structured PDF direct generation (without saving issued doc first) ────────

export async function generateStructuredPdf(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });

  const { templateType, enrollmentId, studentId, config: cfg } = req.body;

  if (!templateType)
    return res.status(400).json({ error: "templateType é obrigatório" });

  if (enrollmentId) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, schoolId },
    });
    if (!enrollment)
      return res.status(404).json({ error: "Matrícula não encontrada" });
  }

  if (studentId) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
    });
    if (!student)
      return res.status(404).json({ error: "Aluno não encontrado" });
  }

  const fakeDocId = `preview-${Date.now()}`;

  try {
    switch (templateType) {
      case "BOLETIM":
        if (!enrollmentId)
          return res
            .status(400)
            .json({ error: "enrollmentId é obrigatório para boletim" });
        await renderBoletim(res, schoolId, enrollmentId, cfg ?? {}, fakeDocId);
        break;

      case "COMPROVANTE_MATRICULA":
        if (!enrollmentId)
          return res.status(400).json({ error: "enrollmentId é obrigatório" });
        await renderComprovante(
          res,
          schoolId,
          enrollmentId,
          cfg ?? {},
          fakeDocId,
        );
        break;

      case "HISTORICO_ESCOLAR":
        if (!studentId)
          return res.status(400).json({ error: "studentId é obrigatório" });
        await renderHistorico(res, schoolId, studentId, cfg ?? {}, fakeDocId);
        break;

      case "DECLARACAO_FREQUENCIA":
        if (!enrollmentId)
          return res.status(400).json({ error: "enrollmentId é obrigatório" });
        await renderFrequencia(
          res,
          schoolId,
          enrollmentId,
          cfg ?? {},
          fakeDocId,
        );
        break;

      case "FICHA_ALUNO":
        if (!studentId)
          return res.status(400).json({ error: "studentId é obrigatório" });
        await renderFichaAluno(res, schoolId, studentId, cfg ?? {}, fakeDocId);
        break;

      default:
        return res.status(400).json({ error: "templateType inválido" });
    }
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Erro ao gerar PDF" });
    }
  }
}

// ─── FREE document renderer ───────────────────────────────────────────────────

async function renderFreeDocument(
  res: any,
  item: any,
  schoolId: string,
  docId: string,
) {
  const plainBody = stripHtml(item.bodySnapshot ?? "").trim();
  if (!plainBody) {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${sanitizeFilename(item.title)}.pdf"`,
    );
    doc.pipe(res);
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#6b7280")
      .text("Este documento não possui conteúdo.", 50, 280, {
        align: "center",
        width: 495,
      });
    doc.end();
    return;
  }

  const schoolCfg = await loadSchoolConfig(schoolId);
  const showLogo = item.template?.showLogo ?? true;

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${sanitizeFilename(item.title)}.pdf"`,
  );
  doc.pipe(res);

  await loadSchoolConfig(schoolId).then(async (cfg) => {
    cfg.showLogo = showLogo;
    if (item.headerSnapshot) {
      const headerText = stripHtml(item.headerSnapshot);
      if (headerText.trim()) {
        doc
          .fontSize(10)
          .fillColor("#374151")
          .text(headerText, { align: "center" });
        doc.moveDown(0.5);
        doc
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .strokeColor("#e5e7eb")
          .stroke();
        doc.moveDown(0.8);
      }
    } else {
      // Auto header from school config
      if (cfg.showLogo && cfg.logoUrl) {
        const { fetchLogoBuffer } = await import("./renderers/shared.renderer");
        const buf = await fetchLogoBuffer(cfg.logoUrl);
        if (buf) {
          try {
            doc.image(buf, 50, 40, { height: 40 });
          } catch {}
        }
      }
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#111827")
        .text(cfg.schoolName, { align: "center" });
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#d1d5db").stroke();
      doc.moveDown(0.6);
    }
  });

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#111827")
    .text(item.title, { align: "center" });
  doc.moveDown(1);

  const lines = stripHtml(item.bodySnapshot).split("\n").filter(Boolean);
  doc.font("Helvetica").fontSize(11).fillColor("#111827");
  for (const line of lines) {
    doc.text(line, { align: "justify" });
    doc.moveDown(0.3);
  }

  doc.moveDown(2);

  if (item.footerSnapshot) {
    const footerText = stripHtml(item.footerSnapshot);
    if (footerText.trim()) {
      const footerY = doc.page.height - 100;
      doc
        .moveTo(50, footerY)
        .lineTo(545, footerY)
        .strokeColor("#e5e7eb")
        .stroke();
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#6b7280")
        .text(footerText, 50, footerY + 8, { align: "center", width: 495 });
    }
  }

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#9ca3af")
    .text(
      `ID: ${docId.slice(0, 8).toUpperCase()} · ${new Date().toLocaleDateString("pt-BR")}`,
      { align: "right" },
    );

  doc.end();
}

// ─── Variable resolution ──────────────────────────────────────────────────────

export async function resolveVariables(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });

  const { body, studentId, enrollmentId } = req.body;
  if (!body) return res.json({ resolved: "" });

  let vars: Record<string, string> = {
    "{{aluno.nome}}": "{{aluno.nome}}",
    "{{aluno.cpf}}": "{{aluno.cpf}}",
    "{{matricula.numero}}": "{{matricula.numero}}",
    "{{turma.nome}}": "{{turma.nome}}",
    "{{ano.letivo}}": "{{ano.letivo}}",
    "{{responsavel.nome}}": "{{responsavel.nome}}",
    "{{data}}": new Date().toLocaleDateString("pt-BR"),
    "{{data.hoje}}": new Date().toLocaleDateString("pt-BR"),
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
      vars["{{aluno.nome}}"] = (student as any).name;
      vars["{{aluno.cpf}}"] = (student as any).cpf ?? "—";
      const g = (student as any).guardians?.[0];
      if (g) vars["{{responsavel.nome}}"] = (g as any).guardian?.name ?? "—";
    }
  }

  if (enrollmentId) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, schoolId },
      include: {
        classroom: { select: { name: true } },
        academicYear: { select: { year: true } },
      },
    });
    if (enrollment) {
      vars["{{matricula.numero}}"] = (enrollment as any).enrollmentNumber;
      vars["{{turma.nome}}"] = (enrollment as any).classroom?.name ?? "—";
      vars["{{ano.letivo}}"] = String(
        (enrollment as any).academicYear?.year ?? "—",
      );
    }
  }

  let resolved = body;
  Object.entries(vars).forEach(([k, v]) => {
    resolved = resolved.replaceAll(k, v);
  });

  return res.json({ resolved });
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-\u00C0-\u024F]/g, "_").slice(0, 80);
}
