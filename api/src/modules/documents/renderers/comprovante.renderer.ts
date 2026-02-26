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

export type ComprovanteConfig = {
  showGuardian: boolean;
  showSchedule: boolean;
  showSubjects: boolean;
  showSignatureLines: boolean;
};

const SHIFT: Record<string, string> = {
  MANHA: "Manhã",
  TARDE: "Tarde",
  NOTURNO: "Noturno",
  INTEGRAL: "Integral",
};
const DAY: Record<number, string> = {
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};

export async function renderComprovante(
  res: any,
  schoolId: string,
  enrollmentId: string,
  config: ComprovanteConfig,
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
          phone: true,
          email: true,
          street: true,
          addressNumber: true,
          neighborhood: true,
          city: true,
          state: true,
        },
      },
      classroom: {
        select: {
          id: true,
          name: true,
          shift: true,
          gradeLevel: { select: { name: true } },
          academicYear: { select: { year: true } },
        },
      },
      academicYear: { select: { year: true } },
      financialResponsibleGuardian: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
  });

  if (!enrollment) throw new Error("Matrícula não encontrada");

  const student = (enrollment as any).student;
  const classroom = (enrollment as any).classroom;
  const guardian = (enrollment as any).financialResponsibleGuardian;

  // Load guardian profile for extra details
  let guardianProfile: any = null;
  if (guardian && config.showGuardian) {
    guardianProfile = await p.guardianProfile.findFirst({
      where: { userId: guardian.id },
    });
  }

  // Load schedule if needed
  let schedules: any[] = [];
  if (config.showSchedule) {
    schedules = await prisma.schedule.findMany({
      where: { schoolId, classroomId: (enrollment as any).classroomId },
      include: {
        subject: { select: { name: true, code: true } },
        timeBlock: {
          select: { name: true, startTime: true, endTime: true, order: true },
        },
        teacher: { select: { name: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }],
    });
  }

  // Load subjects if needed
  let classroomSubjects: any[] = [];
  if (config.showSubjects) {
    classroomSubjects = await prisma.classroomSubject.findMany({
      where: {
        schoolId,
        classroomId: (enrollment as any).classroomId,
        dateTo: null,
      },
      include: {
        subject: { select: { name: true, code: true } },
      },
      orderBy: { subject: { name: "asc" } },
    });

    const teachers = await prisma.classroomTeacher.findMany({
      where: {
        schoolId,
        classroomId: (enrollment as any).classroomId,
        dateTo: null,
      },
      include: {
        subject: { select: { id: true } },
        teacher: { select: { name: true } },
      },
    });

    classroomSubjects = classroomSubjects.map((cs: any) => ({
      ...cs,
      teacherName:
        teachers.find((t: any) => t.subject?.id === cs.subjectId)?.teacher
          ?.name ?? "—",
    }));
  }

  // ─── Build PDF ─────────────────────────────────────────────────────────────

  const schoolCfg = await loadSchoolConfig(schoolId);
  const doc = new PDFDocument({ size: "A4", margin: 45, autoFirstPage: true });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="comprovante-${enrollmentId.slice(0, 8)}.pdf"`,
  );
  doc.pipe(res);

  await drawHeader(
    doc,
    schoolCfg,
    "COMPROVANTE DE MATRÍCULA",
    `Ano Letivo ${(enrollment as any).academicYear?.year}`,
  );

  // ─── Student section ──────────────────────────────────────────────────────

  sectionTitle(doc, "Dados do Aluno");
  drawInfoGrid(
    doc,
    [
      { label: "Nome completo", value: student?.name },
      { label: "Nome social", value: student?.socialName ?? "—" },
      { label: "CPF", value: student?.cpf ?? "—" },
      {
        label: "Data de nascimento",
        value: student?.birthDate
          ? new Date(student.birthDate).toLocaleDateString("pt-BR")
          : "—",
      },
      { label: "Telefone", value: student?.phone ?? "—" },
      { label: "E-mail", value: student?.email ?? "—" },
    ],
    2,
  );

  if (student?.street) {
    drawInfoGrid(
      doc,
      [
        {
          label: "Endereço",
          value: `${student.street}, ${student.addressNumber ?? "s/n"} — ${student.neighborhood ?? ""}, ${student.city ?? ""}/${student.state ?? ""}`,
        },
      ],
      1,
    );
  }

  // ─── Enrollment section ───────────────────────────────────────────────────

  sectionTitle(doc, "Dados da Matrícula");
  drawInfoGrid(
    doc,
    [
      { label: "Nº Matrícula", value: (enrollment as any).enrollmentNumber },
      { label: "Status", value: (enrollment as any).status },
      {
        label: "Data de matrícula",
        value: new Date((enrollment as any).enrolledAt).toLocaleDateString(
          "pt-BR",
        ),
      },
      { label: "Turma", value: classroom?.name },
      { label: "Série", value: classroom?.gradeLevel?.name },
      {
        label: "Turno",
        value: SHIFT[classroom?.shift] ?? classroom?.shift ?? "—",
      },
    ],
    3,
  );

  // ─── Guardian section ─────────────────────────────────────────────────────

  if (config.showGuardian && guardian) {
    sectionTitle(doc, "Responsável Financeiro");
    drawInfoGrid(
      doc,
      [
        { label: "Nome", value: guardian.name },
        { label: "Telefone", value: guardian.phone ?? "—" },
        { label: "E-mail", value: guardian.email ?? "—" },
        { label: "CPF", value: guardianProfile?.cpf ?? "—" },
        { label: "Profissão", value: guardianProfile?.profession ?? "—" },
        {
          label: "Endereço",
          value: guardianProfile?.street
            ? `${guardianProfile.street}, ${guardianProfile.addressNumber ?? "s/n"}`
            : "—",
        },
      ],
      2,
    );
  }

  // ─── Subjects section ─────────────────────────────────────────────────────

  if (config.showSubjects && classroomSubjects.length > 0) {
    sectionTitle(doc, "Disciplinas");
    drawTable(
      doc,
      [
        { header: "Disciplina", width: 200, align: "left" },
        { header: "Código", width: 70, align: "center" },
        { header: "Professor(a)", width: 180, align: "left" },
        { header: "C.H.", width: 50, align: "center" },
      ],
      classroomSubjects.map((cs: any) => [
        cs.subject?.name ?? "—",
        cs.subject?.code ?? "—",
        cs.teacherName,
        cs.workloadHours ? `${cs.workloadHours}h` : "—",
      ]),
      { rowHeight: 18, fontSize: 9 },
    );
  }

  // ─── Schedule section ─────────────────────────────────────────────────────

  if (config.showSchedule && schedules.length > 0) {
    sectionTitle(doc, "Grade de Horários");

    // group by day
    const byDay = new Map<number, typeof schedules>();
    schedules.forEach((s: any) => {
      if (!byDay.has(s.dayOfWeek)) byDay.set(s.dayOfWeek, []);
      byDay.get(s.dayOfWeek)!.push(s);
    });

    const rows: (string | number | null | undefined)[][] = [];
    Array.from(byDay.entries())
      .sort(([a], [b]) => a - b)
      .forEach(([day, daySchedules]) => {
        daySchedules
          .sort(
            (a: any, b: any) =>
              (a.timeBlock?.order ?? 0) - (b.timeBlock?.order ?? 0),
          )
          .forEach((s: any, i: number) => {
            const startTime = s.timeBlock?.startTime
              ? new Date(s.timeBlock.startTime).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })
              : "—";
            const endTime = s.timeBlock?.endTime
              ? new Date(s.timeBlock.endTime).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })
              : "—";

            rows.push([
              i === 0 ? (DAY[day] ?? `Dia ${day}`) : "",
              s.timeBlock?.name ?? "—",
              `${startTime} – ${endTime}`,
              s.subject?.name ?? "—",
              s.teacher?.name ?? "—",
            ]);
          });
      });

    drawTable(
      doc,
      [
        { header: "Dia", width: 70, align: "left" },
        { header: "Aula", width: 60, align: "center" },
        { header: "Horário", width: 90, align: "center" },
        { header: "Disciplina", width: 170, align: "left" },
        { header: "Professor(a)", width: 110, align: "left" },
      ],
      rows,
      { rowHeight: 18, fontSize: 9 },
    );
  }

  // ─── Signatures ───────────────────────────────────────────────────────────

  if (config.showSignatureLines) {
    drawSignatureLines(doc, [
      "Responsável pelo Aluno",
      "Secretaria",
      schoolCfg.directorTitle ?? "Diretor(a)",
    ]);
  }

  drawFooter(doc, schoolCfg, docId);
  doc.end();
}
