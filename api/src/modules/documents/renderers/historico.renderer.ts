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

export type HistoricoConfig = {
  showSignatureLines: boolean;
  showObservations: boolean;
};

export async function renderHistorico(
  res: any,
  schoolId: string,
  studentId: string,
  config: HistoricoConfig,
  docId: string,
): Promise<void> {
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId, deletedAt: null },
    select: {
      id: true,
      name: true,
      socialName: true,
      cpf: true,
      birthDate: true,
      nationality: true,
      naturalidade: true,
    },
  });

  if (!student) throw new Error("Aluno não encontrado");

  // Get all enrollments for this student with grades
  const enrollments = await prisma.enrollment.findMany({
    where: { schoolId, studentId, deletedAt: null },
    include: {
      classroom: {
        select: {
          name: true,
          shift: true,
          gradeLevel: { select: { name: true } },
        },
      },
      academicYear: { select: { year: true } },
      finalGrades: true,
    },
    orderBy: { academicYear: { year: "asc" } },
  });

  const schoolCfg = await loadSchoolConfig(schoolId);
  const doc = new PDFDocument({ size: "A4", margin: 45, autoFirstPage: true });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="historico-${studentId.slice(0, 8)}.pdf"`,
  );
  doc.pipe(res);

  await drawHeader(doc, schoolCfg, "HISTÓRICO ESCOLAR");

  // Student info
  sectionTitle(doc, "Identificação do Aluno");
  drawInfoGrid(
    doc,
    [
      { label: "Nome completo", value: student.name },
      { label: "Nome social", value: student.socialName ?? "—" },
      { label: "CPF", value: student.cpf ?? "—" },
      {
        label: "Data de nascimento",
        value: student.birthDate
          ? new Date(student.birthDate).toLocaleDateString("pt-BR")
          : "—",
      },
      { label: "Nacionalidade", value: student.nationality ?? "—" },
      { label: "Naturalidade", value: student.naturalidade ?? "—" },
    ],
    3,
  );

  if (enrollments.length === 0) {
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#9ca3af")
      .text("Nenhum histórico acadêmico encontrado.", 45, doc.y);
  }

  // For each enrollment year
  for (const enrollment of enrollments) {
    const e = enrollment as any;

    sectionTitle(
      doc,
      `Ano Letivo ${e.academicYear?.year} — ${e.classroom?.gradeLevel?.name ?? e.classroom?.name}`,
    );

    // Get period grades for this enrollment
    const periodGrades = await prisma.periodGrade.findMany({
      where: { schoolId, enrollmentId: enrollment.id },
      include: { period: { select: { name: true, sequence: true } } },
      orderBy: { period: { sequence: "asc" } },
    });

    // Get assessments to derive subject list
    const assessments = await prisma.assessment.findMany({
      where: {
        schoolId,
        classroomId: e.classroomId,
        status: { in: ["PUBLICADA", "ENCERRADA"] },
      },
      include: { subject: { select: { id: true, name: true } } },
      orderBy: { subject: { name: "asc" } },
    });

    const subjectMap = new Map<string, { id: string; name: string }>();
    assessments.forEach((a) => {
      const subj = (a as any).subject;
      if (subj) subjectMap.set(subj.id, subj);
    });
    const subjects = Array.from(subjectMap.values());

    const periods = periodGrades
      .map((pg) => (pg as any).period)
      .filter(Boolean)
      .sort((a: any, b: any) => a.sequence - b.sequence);

    // deduplicate periods
    const uniquePeriods = Array.from(
      new Map(periods.map((p: any) => [p.id, p])).values(),
    );

    if (subjects.length === 0) {
      drawInfoGrid(
        doc,
        [
          { label: "Turma", value: e.classroom?.name },
          { label: "Status", value: e.status },
          { label: "Matrícula", value: e.enrollmentNumber },
        ],
        3,
      );
      continue;
    }

    const finalGrade = (e.finalGrades as any[])?.[0];

    const cols = [
      { header: "Disciplina", width: 155, align: "left" as const },
      ...uniquePeriods.map((p: any) => ({
        header: p.name,
        width: 55,
        align: "center" as const,
      })),
      { header: "Média Final", width: 65, align: "center" as const },
      { header: "Situação", width: 65, align: "center" as const },
    ];

    const rows = subjects.map((subject) => {
      const row: (string | number | null | undefined)[] = [subject.name];

      uniquePeriods.forEach((period: any) => {
        const pg = periodGrades.find(
          (pg) => (pg as any).periodId === period.id,
        );
        row.push(pg ? Number(pg.average).toFixed(1) : "—");
      });

      // Final average from period averages
      const avgs = uniquePeriods
        .map((period: any) => {
          const pg = periodGrades.find(
            (pg) => (pg as any).periodId === period.id,
          );
          return pg ? Number(pg.average) : null;
        })
        .filter((v): v is number => v !== null);

      const finalAvg =
        avgs.length > 0
          ? (avgs.reduce((s, v) => s + v, 0) / avgs.length).toFixed(1)
          : "—";

      row.push(finalAvg);
      row.push(
        finalGrade ? (finalGrade.passed ? "Aprovado" : "Reprovado") : "—",
      );

      return row;
    });

    drawTable(doc, cols, rows, { rowHeight: 18, fontSize: 9 });

    // Status summary
    drawInfoGrid(
      doc,
      [
        { label: "Nº Matrícula", value: e.enrollmentNumber },
        { label: "Status final", value: e.status },
        {
          label: "Situação",
          value: finalGrade
            ? finalGrade.passed
              ? "Aprovado"
              : "Reprovado"
            : "—",
        },
      ],
      3,
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
