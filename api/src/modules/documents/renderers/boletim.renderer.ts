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

export type BoletimConfig = {
  showFrequency: boolean;
  showFinalGrade: boolean;
  showSituation: boolean;
  showSignatureLines: boolean;
  periodId?: string; // if set, show only that period; otherwise all
};

export async function renderBoletim(
  res: any,
  schoolId: string,
  enrollmentId: string,
  config: BoletimConfig,
  docId: string,
): Promise<void> {
  const p: any = prisma as any;

  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, schoolId, deletedAt: null },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          socialName: true,
          cpf: true,
          birthDate: true,
        },
      },
      classroom: {
        select: {
          id: true,
          name: true,
          shift: true,
          gradeLevel: { select: { name: true } },
        },
      },
      academicYear: { select: { year: true } },
    },
  });

  if (!enrollment) throw new Error("Matrícula não encontrada");

  const periods = await prisma.period.findMany({
    where: {
      schoolId,
      academicYearId: (enrollment as any).academicYear?.id
        ? undefined
        : undefined,
      ...(config.periodId ? { id: config.periodId } : {}),
    },
    orderBy: { sequence: "asc" },
  });

  // get periods for this academic year
  const allPeriods = await prisma.period.findMany({
    where: { schoolId, academicYearId: (enrollment as any).academicYearId },
    orderBy: { sequence: "asc" },
  });

  const targetPeriods = config.periodId
    ? allPeriods.filter((p) => p.id === config.periodId)
    : allPeriods;

  // Get all assessments for this classroom grouped by subject/period
  const assessments = await prisma.assessment.findMany({
    where: {
      schoolId,
      classroomId: (enrollment as any).classroomId,
      status: { in: ["PUBLICADA", "ENCERRADA"] },
      ...(config.periodId ? { periodId: config.periodId } : {}),
    },
    include: {
      subject: { select: { id: true, name: true } },
      period: { select: { id: true, name: true, sequence: true } },
    },
    orderBy: [{ subject: { name: "asc" } }, { date: "asc" }],
  });

  // Get grades for this enrollment
  const grades = await prisma.studentGrade.findMany({
    where: {
      schoolId,
      enrollmentId,
      assessmentId: { in: assessments.map((a) => a.id) },
    },
  });

  const gradeMap = new Map(grades.map((g) => [g.assessmentId, g]));

  // Get period grades (computed averages)
  const periodGrades = await prisma.periodGrade.findMany({
    where: { schoolId, enrollmentId },
    include: { period: { select: { id: true, name: true, sequence: true } } },
  });

  const periodGradeMap = new Map(periodGrades.map((pg) => [pg.periodId, pg]));

  // Get final grade
  const finalGrade = await p.finalGrade.findFirst({
    where: { schoolId, enrollmentId },
  });

  // Get attendance if needed
  let attendanceData: { total: number; present: number; pct: number } | null =
    null;
  if (config.showFrequency) {
    const sessions = await prisma.attendanceSession.findMany({
      where: { schoolId, classroomId: (enrollment as any).classroomId },
      select: { id: true, totalSlots: true },
    });
    const sessionIds = sessions.map((s) => s.id);
    const records = await prisma.attendanceRecord.findMany({
      where: { schoolId, enrollmentId, sessionId: { in: sessionIds } },
      select: { present: true },
    });
    const totalSlots = sessions.reduce((s, se) => s + (se.totalSlots || 1), 0);
    const presentCount = records.filter((r) => r.present).length;
    attendanceData = {
      total: totalSlots,
      present: presentCount,
      pct: totalSlots > 0 ? Math.round((presentCount / totalSlots) * 100) : 0,
    };
  }

  // Build subject list
  const subjectMap = new Map<string, { id: string; name: string }>();
  assessments.forEach((a) => {
    if (!(a as any).subject) return;
    subjectMap.set((a as any).subject.id, (a as any).subject);
  });
  const subjects = Array.from(subjectMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  // ─── Build PDF ────────────────────────────────────────────────────────────

  const schoolCfg = await loadSchoolConfig(schoolId);
  const doc = new PDFDocument({ size: "A4", margin: 45, autoFirstPage: true });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="boletim-${enrollmentId.slice(0, 8)}.pdf"`,
  );
  doc.pipe(res);

  await drawHeader(
    doc,
    schoolCfg,
    "BOLETIM ESCOLAR",
    `Ano Letivo ${(enrollment as any).academicYear?.year}${config.periodId ? ` · ${targetPeriods[0]?.name ?? ""}` : ""}`,
  );

  // Student info block
  const student = (enrollment as any).student;
  const classroom = (enrollment as any).classroom;
  const SHIFT: Record<string, string> = {
    MANHA: "Manhã",
    TARDE: "Tarde",
    NOTURNO: "Noturno",
    INTEGRAL: "Integral",
  };

  sectionTitle(doc, "Dados do Aluno");
  drawInfoGrid(
    doc,
    [
      { label: "Nome", value: student?.socialName || student?.name },
      { label: "Turma", value: classroom?.name },
      { label: "Série", value: classroom?.gradeLevel?.name },
      { label: "Turno", value: SHIFT[classroom?.shift] ?? classroom?.shift },
      { label: "Nº Matrícula", value: (enrollment as any).enrollmentNumber },
      { label: "CPF", value: student?.cpf ?? "—" },
    ],
    3,
  );

  // ─── Grades table ─────────────────────────────────────────────────────────

  sectionTitle(doc, "Notas por Período");

  // Dynamic columns: Disciplina + one column per period + Média Final (optional)
  const cols = [
    { header: "Disciplina", width: 140, align: "left" as const },
    ...targetPeriods.map((period) => ({
      header: period.name,
      width: 60,
      align: "center" as const,
    })),
  ];

  if (config.showFinalGrade) {
    cols.push({ header: "Média Final", width: 65, align: "center" as const });
  }
  if (config.showSituation) {
    cols.push({ header: "Situação", width: 60, align: "center" as const });
  }
  if (config.showFrequency) {
    cols.push({ header: "Freq.", width: 50, align: "center" as const });
  }

  const tableRows = subjects.map((subject) => {
    const row: (string | number | null | undefined)[] = [subject.name];

    targetPeriods.forEach((period) => {
      const pg = periodGradeMap.get(period.id);
      if (pg) {
        row.push(Number(pg.average).toFixed(1));
      } else {
        // compute from individual assessments
        const subjectAssessments = assessments.filter(
          (a) =>
            (a as any).subject?.id === subject.id &&
            (a as any).period?.id === period.id,
        );
        if (subjectAssessments.length === 0) {
          row.push("—");
        } else {
          const scored = subjectAssessments
            .map((a) => {
              const g = gradeMap.get(a.id);
              return g?.score != null ? Number(g.score) : null;
            })
            .filter((v): v is number => v !== null);
          if (scored.length === 0) {
            row.push("—");
          } else {
            const avg = scored.reduce((s, v) => s + v, 0) / scored.length;
            row.push(avg.toFixed(1));
          }
        }
      }
    });

    if (config.showFinalGrade) {
      const allPeriodAvgs = targetPeriods
        .map((period) => {
          const pg = periodGradeMap.get(period.id);
          return pg ? Number(pg.average) : null;
        })
        .filter((v): v is number => v !== null);

      if (allPeriodAvgs.length === 0) {
        row.push("—");
      } else {
        const final =
          allPeriodAvgs.reduce((s, v) => s + v, 0) / allPeriodAvgs.length;
        row.push(final.toFixed(1));
      }
    }

    if (config.showSituation) {
      const fg = finalGrade;
      row.push(fg ? (fg.passed ? "Aprovado" : "Reprovado") : "—");
    }

    if (config.showFrequency) {
      row.push(attendanceData ? `${attendanceData.pct}%` : "—");
    }

    return row;
  });

  if (tableRows.length === 0) {
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#9ca3af")
      .text("Nenhuma nota lançada para este período.", 45, doc.y);
    doc.moveDown();
  } else {
    drawTable(doc, cols, tableRows, { rowHeight: 20, fontSize: 9 });
  }

  // ─── Frequency summary ────────────────────────────────────────────────────

  if (config.showFrequency && attendanceData) {
    sectionTitle(doc, "Frequência");
    drawInfoGrid(
      doc,
      [
        { label: "Total de aulas", value: String(attendanceData.total) },
        { label: "Presenças", value: String(attendanceData.present) },
        {
          label: "Faltas",
          value: String(attendanceData.total - attendanceData.present),
        },
        { label: "% Frequência", value: `${attendanceData.pct}%` },
      ],
      4,
    );
  }

  // ─── Signatures ───────────────────────────────────────────────────────────

  if (config.showSignatureLines) {
    drawSignatureLines(doc, [
      "Responsável pelo Aluno",
      "Professor(a)",
      schoolCfg.directorTitle ?? "Diretor(a)",
    ]);
  }

  drawFooter(doc, schoolCfg, docId);
  doc.end();
}
