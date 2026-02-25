import { Request, Response } from "express";
import { getSchoolId } from "../../middlewares/tenant";
import { prisma } from "../../config/prisma";
import getParam from "../../utils/getParam";
import * as service from "./enrollments.service";
import { nextEnrollmentNumber } from "../../utils/enrollmentCounter";
import PDFDocument from "pdfkit";
import { createNotificationsForUsers } from "../notifications/notifications.service";

export async function createEnrollment(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId)
    return res.status(403).json({ error: "Escola não associada" });
  const { studentId, classroomId, academicYearId } = req.body;
  let financialResponsibleGuardianId = req.body.financialResponsibleGuardianId;
  const enrolledAtRaw = req.body.enrolledAt;

  if (!studentId || !classroomId || !academicYearId) {
    return res
      .status(400)
      .json({ error: "studentId, classroomId e academicYearId são obrigatórios" });
  }
  // Backward-compatible: if not provided, try to infer from StudentGuardian
  if (!financialResponsibleGuardianId) {
    try {
      const links = await prisma.studentGuardian.findMany({
        where: { schoolId, studentId, isFinancialResponsible: true },
        select: { guardianId: true },
      });
      if (links.length === 1) {
        financialResponsibleGuardianId = links[0].guardianId;
      }
    } catch {}
  }
  if (!financialResponsibleGuardianId) {
    return res.status(400).json({
      error:
        "financialResponsibleGuardianId é obrigatório (ou marque um único responsável como financeiro no aluno para inferência automática)",
    });
  }

  const [student, classroom, year] = await Promise.all([
    prisma.student.findFirst({ where: { id: studentId, schoolId, deletedAt: null } }),
    prisma.classroom.findFirst({ where: { id: classroomId, schoolId, deletedAt: null } }),
    prisma.academicYear.findFirst({ where: { id: academicYearId, schoolId } }),
  ]);

  if (!student) return res.status(404).json({ error: "Aluno não encontrado na escola" });
  if (!classroom) return res.status(404).json({ error: "Turma não encontrada na escola" });
  if (!year) return res.status(404).json({ error: "Ano letivo não encontrado na escola" });

  const finLink = await prisma.studentGuardian.findFirst({
    where: {
      schoolId,
      studentId,
      guardianId: String(financialResponsibleGuardianId),
    },
  });
  if (!finLink) {
    return res.status(400).json({
      error:
        "Responsável financeiro inválido: selecione um responsável já vinculado ao aluno",
    });
  }
  if (!finLink.isFinancialResponsible) {
    return res.status(400).json({
      error:
        "Responsável financeiro deve estar marcado como financeiro no vínculo do aluno",
    });
  }

  // FIX #7: block enrollment on closed/archived years
  if (year.status === "ENCERRADO" || year.status === "ARQUIVADO") {
    return res.status(400).json({ error: "Não é possível matricular em ano letivo encerrado ou arquivado" });
  }

  // FIX #8: validate classroom capacity
  const activeCount = await prisma.enrollment.count({
    where: { classroomId, schoolId, status: "ATIVA", deletedAt: null },
  });
  if (activeCount >= classroom.capacity) {
    return res.status(400).json({
      error: `Turma sem vagas disponíveis (capacidade: ${classroom.capacity}, matriculados: ${activeCount})`,
    });
  }

  // FIX #10: handle existing active enrollment for same year — auto-transfer between classrooms
  const existingActive = await prisma.enrollment.findFirst({
    where: { studentId, academicYearId, schoolId, deletedAt: null, status: "ATIVA" },
  });

  if (existingActive) {
    if (existingActive.classroomId === classroomId) {
      return res.status(400).json({ error: "Aluno já está matriculado nesta turma neste ano letivo" });
    }
    // Transfer: close current enrollment, open new one
    await prisma.enrollment.update({
      where: { id: existingActive.id },
      data: { status: "TRANSFERIDA", exitDate: new Date() },
    });
    try {
      await prisma.enrollmentHistory.create({
        data: {
          schoolId,
          studentId,
          enrollmentId: existingActive.id,
          type: "TRANSFERENCIA_TURMA",
          description: "Transferência automática de turma",
          fromValue: existingActive.classroomId,
          toValue: classroomId,
          createdById: req.user?.id ?? null,
        },
      });
    } catch {}
  }

  try {
    const enrollmentNumber = await nextEnrollmentNumber(schoolId, year.year);
    const created = await prisma.enrollment.create({
      data: {
        schoolId,
        studentId,
        classroomId,
        academicYearId,
        enrollmentNumber,
        enrolledAt: enrolledAtRaw ? new Date(enrolledAtRaw) : new Date(),
        financialResponsibleGuardianId: String(financialResponsibleGuardianId),
      } as any,
      include: {
        student: { select: { id: true, name: true } },
        classroom: { select: { id: true, name: true } },
        academicYear: { select: { id: true, year: true } },
      },
    });
    try {
      await prisma.enrollmentHistory.create({
        data: {
          schoolId,
          studentId,
          enrollmentId: created.id,
          type: "MATRICULA",
          description: "Matrícula criada",
          createdById: req.user?.id ?? null,
        },
      });
    } catch {}
    try {
      const secretaries = await prisma.user.findMany({
        where: { schoolId, role: "SECRETARY", active: true, deletedAt: null },
        select: { id: true },
      });
      await createNotificationsForUsers(
        schoolId,
        secretaries.map((u) => u.id),
        {
          type: "ENROLLMENT_CREATED",
          title: "Matrícula criada",
          message: `Matrícula ${created.enrollmentNumber} criada para ${created.student?.name ?? "aluno"}.`,
        },
      );
    } catch {}
    return res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === "P2002") return res.status(400).json({ error: "Matrícula duplicada" });
    return res.status(500).json({ error: "Erro ao criar matrícula" });
  }
}

export async function listEnrollments(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId)
    return res.status(403).json({ error: "Escola não associada" });
  const page = parseInt(String(req.query.page || "1"), 10) || 1;
  const limit = Math.min(parseInt(String(req.query.limit || "20"), 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filters: any = {};
  if (req.query.classroomId) filters.classroomId = String(req.query.classroomId);
  if (req.query.academicYearId) filters.academicYearId = String(req.query.academicYearId);
  if (req.query.status) filters.status = String(req.query.status);

  const requester = req.user!;

  if (requester.role === "STUDENT") {
    const student = await prisma.student.findFirst({
      where: { userId: requester.id, schoolId: (requester.schoolId ?? undefined) as any },
      select: { id: true },
    });
    if (!student) return res.status(403).json({ error: "Perfil de aluno não encontrado" });
    filters.studentId = student.id;
  } else if (requester.role === "GUARDIAN") {
    const links = await prisma.studentGuardian.findMany({
      where: { guardianId: requester.id, schoolId: (requester.schoolId ?? undefined) as any },
      select: { studentId: true },
    });
    if (!links || links.length === 0)
      return res.status(403).json({ error: "Nenhum aluno vinculado a este responsável" });
    filters.studentId = links.map((l) => l.studentId).filter(Boolean);
  } else if (requester.role === "TEACHER") {
    const teacherClassrooms = await prisma.classroomTeacher.findMany({
      where: { teacherId: requester.id, schoolId: (requester.schoolId ?? undefined) as any, dateTo: null },
      select: { classroomId: true },
    });
    if (!teacherClassrooms || teacherClassrooms.length === 0)
      return res.status(403).json({ error: "Nenhuma turma vinculada a este professor" });
    filters.classroomId = teacherClassrooms.map((c) => c.classroomId).filter(Boolean);
  }

  const [items, total] = await Promise.all([
    service.findEnrollments(schoolId, filters, skip, limit),
    service.countEnrollments(schoolId, filters),
  ]);

  return res.json({ data: items, meta: { total, page, limit } });
}

export async function getEnrollment(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId)
    return res.status(403).json({ error: "Escola não associada" });
  const id = getParam(req, "id");
  const requester = req.user!;

  const item = await service.findEnrollmentById(id, schoolId);
  if (!item) return res.status(404).json({ error: "Matrícula não encontrada" });

  if (requester.role === "STUDENT") {
    const student = await prisma.student.findFirst({
      where: { userId: requester.id, schoolId: (requester.schoolId ?? undefined) as any },
    });
    if (!student || item.studentId !== student.id)
      return res.status(403).json({ error: "Acesso negado" });
  } else if (requester.role === "GUARDIAN") {
    const link = await prisma.studentGuardian.findFirst({
      where: { guardianId: requester.id, studentId: item.studentId, schoolId: (requester.schoolId ?? undefined) as any },
    });
    if (!link) return res.status(403).json({ error: "Acesso negado" });
  } else if (requester.role === "TEACHER") {
    const teacherClassrooms = await prisma.classroomTeacher.findMany({
      where: { teacherId: requester.id, schoolId: (requester.schoolId ?? undefined) as any, dateTo: null },
      select: { classroomId: true },
    });
    const classroomIds = teacherClassrooms.map((c) => c.classroomId);
    if (!item.classroomId || !classroomIds.includes(item.classroomId))
      return res.status(403).json({ error: "Sem permissão para acessar esta matrícula" });
  }

  return res.json(item);
}

export async function updateEnrollmentStatus(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId)
    return res.status(403).json({ error: "Escola não associada" });
  const id = getParam(req, "id");
  const { status } = req.body;

  const allowed = ["ATIVA", "CONCLUIDA", "CANCELADA", "TRANSFERIDA", "SUSPENSA", "TRANCADA"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Status inválido" });

  const existing = await service.findEnrollmentById(id, schoolId);
  if (!existing) return res.status(404).json({ error: "Matrícula não encontrada" });

  const updated = await service.updateEnrollmentStatusById(id, status);
  try {
    const type =
      status === "TRANCADA"
        ? "TRANCAMENTO"
        : status === "TRANSFERIDA"
          ? "TRANSFERENCIA_TURMA"
          : status === "CANCELADA"
            ? "CANCELAMENTO"
            : status === "CONCLUIDA"
              ? "CONCLUSAO"
              : status === "ATIVA"
                ? "REATIVACAO"
                : "OUTRO";
    await prisma.enrollmentHistory.create({
      data: {
        schoolId: schoolId!,
        studentId: existing.studentId,
        enrollmentId: existing.id,
        type: type as any,
        description: `Status da matrícula alterado para ${status}`,
        fromValue: existing.status,
        toValue: status,
        createdById: req.user?.id ?? null,
      },
    });
  } catch {}
  return res.json(updated);
}

export async function listEnrollmentHistory(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId)
    return res.status(403).json({ error: "Escola não associada" });
  const id = getParam(req, "id");

  const enrollment = await service.findEnrollmentById(id, schoolId);
  if (!enrollment)
    return res.status(404).json({ error: "Matrícula não encontrada" });

  const requester = req.user!;
  if (requester.role === "STUDENT") {
    const student = await prisma.student.findFirst({
      where: {
        userId: requester.id,
        schoolId: (requester.schoolId ?? undefined) as any,
      },
    });
    if (!student || enrollment.studentId !== student.id)
      return res.status(403).json({ error: "Acesso negado" });
  } else if (requester.role === "GUARDIAN") {
    const link = await prisma.studentGuardian.findFirst({
      where: {
        guardianId: requester.id,
        studentId: enrollment.studentId,
        schoolId: (requester.schoolId ?? undefined) as any,
      },
    });
    if (!link) return res.status(403).json({ error: "Acesso negado" });
  } else if (requester.role === "TEACHER") {
    const teacherClassrooms = await prisma.classroomTeacher.findMany({
      where: {
        teacherId: requester.id,
        schoolId: (requester.schoolId ?? undefined) as any,
        dateTo: null,
      },
      select: { classroomId: true },
    });
    const classroomIds = teacherClassrooms.map((c) => c.classroomId);
    if (!enrollment.classroomId || !classroomIds.includes(enrollment.classroomId))
      return res
        .status(403)
        .json({ error: "Sem permissão para acessar esta matrícula" });
  }

  const items = await prisma.enrollmentHistory.findMany({
    where: { schoolId, enrollmentId: id },
    orderBy: { createdAt: "asc" },
    include: { createdBy: { select: { id: true, name: true } } },
  });
  return res.json({ data: items });
}

export async function listEnrollmentDocuments(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId)
    return res.status(403).json({ error: "Escola não associada" });
  const id = getParam(req, "id");

  const enrollment = await service.findEnrollmentById(id, schoolId);
  if (!enrollment)
    return res.status(404).json({ error: "Matrícula não encontrada" });

  const p: any = prisma as any;
  const items = await p.enrollmentDocument.findMany({
    where: { schoolId, enrollmentId: id },
    orderBy: { createdAt: "asc" },
  });
  return res.json({ data: items });
}

export async function createEnrollmentDocument(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId)
    return res.status(403).json({ error: "Escola não associada" });
  const id = getParam(req, "id");

  const enrollment = await service.findEnrollmentById(id, schoolId);
  if (!enrollment)
    return res.status(404).json({ error: "Matrícula não encontrada" });

  const { type, name, fileUrl, delivered, notes } = req.body;
  if (!type || !name) {
    return res.status(400).json({ error: "type e name são obrigatórios" });
  }

  const p: any = prisma as any;
  const created = await p.enrollmentDocument.create({
    data: {
      schoolId,
      enrollmentId: id,
      type,
      name,
      fileUrl: fileUrl ?? null,
      delivered: delivered ?? false,
      notes: notes ?? null,
    },
  });
  return res.status(201).json(created);
}

export async function updateEnrollmentDocument(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId)
    return res.status(403).json({ error: "Escola não associada" });
  const id = getParam(req, "id");
  const docId = getParam(req, "docId");

  const p: any = prisma as any;
  const doc = await p.enrollmentDocument.findFirst({
    where: { id: docId, enrollmentId: id, schoolId },
  });
  if (!doc) return res.status(404).json({ error: "Documento não encontrado" });

  const { name, fileUrl, delivered, notes } = req.body;
  const updated = await p.enrollmentDocument.update({
    where: { id: docId },
    data: {
      name: name ?? undefined,
      fileUrl: fileUrl !== undefined ? fileUrl || null : undefined,
      delivered: delivered !== undefined ? delivered : undefined,
      notes: notes !== undefined ? notes || null : undefined,
    },
  });
  return res.json(updated);
}

export async function deleteEnrollmentDocument(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId)
    return res.status(403).json({ error: "Escola não associada" });
  const id = getParam(req, "id");
  const docId = getParam(req, "docId");

  const p: any = prisma as any;
  const doc = await p.enrollmentDocument.findFirst({
    where: { id: docId, enrollmentId: id, schoolId },
  });
  if (!doc) return res.status(404).json({ error: "Documento não encontrado" });

  await p.enrollmentDocument.delete({ where: { id: docId } });
  return res.status(204).send();
}

async function getEnrollmentForPdf(id: string, schoolId: string) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { id, schoolId, deletedAt: null },
    include: {
      student: { select: { id: true, name: true } },
      classroom: { select: { id: true, name: true } },
      academicYear: { select: { id: true, year: true } },
      financialResponsibleGuardian: {
        select: { id: true, name: true, email: true, phone: true },
      },
    } as any,
  });
  return enrollment as any;
}

function sendPdf(res: Response, filename: string, doc: any) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${filename.replace(/"/g, "")}"`,
  );
  doc.pipe(res);
  doc.end();
}

export async function pdfEnrollmentDeclaration(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId)
    return res.status(403).json({ error: "Escola não associada" });
  const id = getParam(req, "id");

  const enrollment = await getEnrollmentForPdf(id, schoolId);
  if (!enrollment)
    return res.status(404).json({ error: "Matrícula não encontrada" });

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.fontSize(16).text("Declaração de Matrícula", { align: "center" });
  doc.moveDown(1.2);
  doc.fontSize(12).text(`Aluno: ${enrollment.student?.name ?? "—"}`);
  doc.text(`Nº Matrícula: ${enrollment.enrollmentNumber}`);
  doc.text(`Ano letivo: ${enrollment.academicYear?.year ?? "—"}`);
  doc.text(`Turma: ${enrollment.classroom?.name ?? "—"}`);
  doc.text(
    `Data da matrícula: ${String(enrollment.enrolledAt).slice(0, 10)}`,
  );
  doc.moveDown(1.2);
  doc
    .fontSize(11)
    .fillColor("#111111")
    .text(
      "Declaramos, para os devidos fins, que o(a) aluno(a) acima encontra-se regularmente matriculado(a) nesta instituição.",
      { align: "justify" },
    );
  doc.moveDown(2);
  doc.fontSize(10).fillColor("#6b7280").text("Documento gerado pelo sistema.");
  sendPdf(res, `declaracao-matricula-${enrollment.enrollmentNumber}.pdf`, doc);
}

export async function pdfEnrollmentProof(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId)
    return res.status(403).json({ error: "Escola não associada" });
  const id = getParam(req, "id");

  const enrollment = await getEnrollmentForPdf(id, schoolId);
  if (!enrollment)
    return res.status(404).json({ error: "Matrícula não encontrada" });

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.fontSize(16).text("Comprovante de Vínculo", { align: "center" });
  doc.moveDown(1.2);
  doc.fontSize(12).text(`Aluno: ${enrollment.student?.name ?? "—"}`);
  doc.text(`Nº Matrícula: ${enrollment.enrollmentNumber}`);
  doc.text(`Ano letivo: ${enrollment.academicYear?.year ?? "—"}`);
  doc.text(`Turma: ${enrollment.classroom?.name ?? "—"}`);
  doc.text(`Status: ${enrollment.status}`);
  doc.moveDown(1.2);
  doc
    .fontSize(11)
    .text(
      "Este documento comprova o vínculo do aluno com a escola no período informado.",
      { align: "justify" },
    );
  doc.moveDown(2);
  doc.fontSize(10).fillColor("#6b7280").text("Documento gerado pelo sistema.");
  sendPdf(res, `comprovante-vinculo-${enrollment.enrollmentNumber}.pdf`, doc);
}

export async function pdfEnrollmentTransfer(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId)
    return res.status(403).json({ error: "Escola não associada" });
  const id = getParam(req, "id");

  const enrollment = await getEnrollmentForPdf(id, schoolId);
  if (!enrollment)
    return res.status(404).json({ error: "Matrícula não encontrada" });

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.fontSize(16).text("Documento de Transferência", { align: "center" });
  doc.moveDown(1.2);
  doc.fontSize(12).text(`Aluno: ${enrollment.student?.name ?? "—"}`);
  doc.text(`Nº Matrícula: ${enrollment.enrollmentNumber}`);
  doc.text(`Ano letivo: ${enrollment.academicYear?.year ?? "—"}`);
  doc.text(`Turma (origem): ${enrollment.classroom?.name ?? "—"}`);
  doc.text(`Status atual: ${enrollment.status}`);
  doc.moveDown(1.2);
  doc
    .fontSize(11)
    .text(
      "Documento emitido para registro de transferência/encerramento do vínculo conforme status informado.",
      { align: "justify" },
    );
  doc.moveDown(2);
  doc.fontSize(10).fillColor("#6b7280").text("Documento gerado pelo sistema.");
  sendPdf(res, `transferencia-${enrollment.enrollmentNumber}.pdf`, doc);
}

export async function pdfEnrollmentHistory(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId)
    return res.status(403).json({ error: "Escola não associada" });
  const id = getParam(req, "id");

  const enrollment = await getEnrollmentForPdf(id, schoolId);
  if (!enrollment)
    return res.status(404).json({ error: "Matrícula não encontrada" });

  const history = await prisma.enrollmentHistory.findMany({
    where: { schoolId, enrollmentId: id },
    orderBy: { createdAt: "asc" },
  });

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.fontSize(16).text("Histórico de Movimentações", { align: "center" });
  doc.moveDown(1.2);
  doc.fontSize(12).text(`Aluno: ${enrollment.student?.name ?? "—"}`);
  doc.text(`Nº Matrícula: ${enrollment.enrollmentNumber}`);
  doc.text(`Ano letivo: ${enrollment.academicYear?.year ?? "—"}`);
  doc.moveDown(1);
  doc.fontSize(11).text("Eventos:", { underline: true });
  doc.moveDown(0.5);
  if (!history || history.length === 0) {
    doc.fillColor("#6b7280").text("Sem registros.");
  } else {
    doc.fillColor("#111111");
    for (const h of history as any[]) {
      const when = String(h.createdAt).slice(0, 19).replace("T", " ");
      doc
        .fontSize(10.5)
        .text(
          `• ${when} — ${h.type}${h.description ? `: ${h.description}` : ""}`,
        );
    }
  }
  doc.moveDown(2);
  doc.fontSize(10).fillColor("#6b7280").text("Documento gerado pelo sistema.");
  sendPdf(res, `historico-${enrollment.enrollmentNumber}.pdf`, doc);
}
