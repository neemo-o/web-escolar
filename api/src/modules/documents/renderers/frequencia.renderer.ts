import PDFDocument from "pdfkit";
import { prisma } from "../../../config/prisma";
import {
  loadSchoolConfig,
  drawHeader,
  drawFooter,
  drawTable,
  sectionTitle,
  drawInfoGrid,
  drawSignatureLines,
} from "./shared.renderer";

export type FrequenciaConfig = {
  showBySubject: boolean;
  showSignatureLines: boolean;
  periodId?: string;
};

export async function renderFrequencia(
  res: any,
  schoolId: string,
  enrollmentId: string,
  config: FrequenciaConfig,
  docId: string,
): Promise<void> {
  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, schoolId, deletedAt: null },
    include: {
      student: {
        select: { id: true, name: true, socialName: true, cpf: true },
      },
      classroom: {
        select: {
          id: true,
          name: true,
          shift: true,
          gradeLevel: { select: { name: true } },
        },
      },
      academicYear: { select: { year: true, startDate: true, endDate: true } },
    },
  });

  if (!enrollment) throw new Error("Matrícula não encontrada");

  const student = (enrollment as any).student;
  const classroom = (enrollment as any).classroom;

  // Get all sessions for classroom
  const sessionWhere: any = {
    schoolId,
    classroomId: (enrollment as any).classroomId,
  };

  const sessions = await prisma.attendanceSession.findMany({
    where: sessionWhere,
    include: { subject: { select: { id: true, name: true } } } as any,
    orderBy: { date: "asc" },
  });

  const sessionIds = sessions.map((s) => s.id);

  const records = await prisma.attendanceRecord.findMany({
    where: { schoolId, enrollmentId, sessionId: { in: sessionIds } },
    select: { sessionId: true, present: true, justified: true },
  });

  const recordMap = new Map(records.map((r) => [r.sessionId, r]));

  // Overall attendance
  const totalSlots = sessions.reduce((s, se) => s + (se.totalSlots || 1), 0);
  const presentCount = records.filter((r) => r.present).length;
  const justifiedCount = records.filter(
    (r) => !r.present && r.justified,
  ).length;
  const absentCount = records.filter((r) => !r.present).length;
  const pct =
    totalSlots > 0 ? ((presentCount / totalSlots) * 100).toFixed(1) : "0.0";

  // By subject
  const subjectSessions = new Map<
    string,
    { name: string; total: number; present: number; absent: number }
  >();

  sessions.forEach((session) => {
    const subj = (session as any).subject;
    if (!subj) return;
    if (!subjectSessions.has(subj.id)) {
      subjectSessions.set(subj.id, {
        name: subj.name,
        total: 0,
        present: 0,
        absent: 0,
      });
    }
    const entry = subjectSessions.get(subj.id)!;
    const slots = session.totalSlots || 1;
    entry.total += slots;
    const rec = recordMap.get(session.id);
    if (rec?.present) entry.present += slots;
    else entry.absent += slots;
  });

  const schoolCfg = await loadSchoolConfig(schoolId);
  const doc = new PDFDocument({ size: "A4", margin: 45, autoFirstPage: true });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="frequencia-${enrollmentId.slice(0, 8)}.pdf"`,
  );
  doc.pipe(res);

  await drawHeader(
    doc,
    schoolCfg,
    "DECLARAÇÃO DE FREQUÊNCIA",
    `Ano Letivo ${(enrollment as any).academicYear?.year}`,
  );

  sectionTitle(doc, "Dados do Aluno");
  drawInfoGrid(
    doc,
    [
      { label: "Nome", value: student?.socialName || student?.name },
      { label: "CPF", value: student?.cpf ?? "—" },
      { label: "Turma", value: classroom?.name },
      { label: "Série", value: classroom?.gradeLevel?.name },
      { label: "Nº Matrícula", value: (enrollment as any).enrollmentNumber },
      {
        label: "Período",
        value: `${new Date((enrollment as any).academicYear?.startDate).toLocaleDateString("pt-BR")} a ${new Date((enrollment as any).academicYear?.endDate).toLocaleDateString("pt-BR")}`,
      },
    ],
    3,
  );

  sectionTitle(doc, "Resumo de Frequência");
  drawInfoGrid(
    doc,
    [
      { label: "Total de aulas", value: String(totalSlots) },
      { label: "Presenças", value: String(presentCount) },
      { label: "Faltas", value: String(absentCount) },
      { label: "Faltas justificadas", value: String(justifiedCount) },
      { label: "Frequência (%)", value: `${pct}%` },
      {
        label: "Situação",
        value: Number(pct) >= 75 ? "Regular (≥ 75%)" : "Irregular (< 75%)",
      },
    ],
    3,
  );

  // Declaratory text
  doc.moveDown(0.5);
  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#111827")
    .text(
      `Declaramos para os devidos fins que o(a) aluno(a) ${student?.name} apresentou frequência de ${pct}% no período letivo de ${(enrollment as any).academicYear?.year}, correspondente a ${presentCount} presenças de ${totalSlots} aulas ministradas.`,
      45,
      doc.y,
      { align: "justify", width: doc.page.width - 90 },
    );

  if (config.showBySubject && subjectSessions.size > 0) {
    sectionTitle(doc, "Frequência por Disciplina");
    drawTable(
      doc,
      [
        { header: "Disciplina", width: 200, align: "left" },
        { header: "Total de Aulas", width: 90, align: "center" },
        { header: "Presenças", width: 80, align: "center" },
        { header: "Faltas", width: 70, align: "center" },
        { header: "Frequência", width: 80, align: "center" },
      ],
      Array.from(subjectSessions.values()).map((s) => [
        s.name,
        s.total,
        s.present,
        s.absent,
        s.total > 0 ? `${((s.present / s.total) * 100).toFixed(1)}%` : "—",
      ]),
      { rowHeight: 18, fontSize: 9 },
    );
  }

  if (config.showSignatureLines) {
    drawSignatureLines(doc, [
      "Secretaria Escolar",
      schoolCfg.directorTitle ?? "Diretor(a)",
    ]);
  }

  drawFooter(doc, schoolCfg, docId);
  doc.end();
}
