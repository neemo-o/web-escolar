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

export type FichaAlunoConfig = {
  showHealth: boolean;
  showGuardians: boolean;
  showDocuments: boolean;
  showEnrollments: boolean;
  showSignatureLines: boolean;
};

const GENDER: Record<string, string> = {
  MASCULINO: "Masculino",
  FEMININO: "Feminino",
  OUTRO: "Outro",
  NAO_INFORMADO: "Não informado",
};
const RELATION: Record<string, string> = {
  PAI: "Pai",
  MAE: "Mãe",
  TUTOR_LEGAL: "Tutor Legal",
  OUTRO: "Outro",
};

export async function renderFichaAluno(
  res: any,
  schoolId: string,
  studentId: string,
  config: FichaAlunoConfig,
  docId: string,
): Promise<void> {
  const p: any = prisma as any;

  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId, deletedAt: null },
    include: {
      health: true,
      guardians: {
        include: {
          guardian: {
            select: { id: true, name: true, phone: true, email: true },
          },
        },
      },
      documents: { where: { delivered: true } },
      enrollments: {
        where: { deletedAt: null },
        include: {
          classroom: {
            select: { name: true, gradeLevel: { select: { name: true } } },
          },
          academicYear: { select: { year: true } },
        },
        orderBy: { enrolledAt: "desc" },
      },
    },
  });

  if (!student) throw new Error("Aluno não encontrado");

  // Load guardian profiles
  const guardianProfiles: any[] = [];
  if (config.showGuardians) {
    for (const link of (student as any).guardians ?? []) {
      const prof = await p.guardianProfile.findFirst({
        where: { userId: link.guardian?.id },
      });
      guardianProfiles.push({ ...link, profile: prof });
    }
  }

  const schoolCfg = await loadSchoolConfig(schoolId);
  const doc = new PDFDocument({ size: "A4", margin: 45, autoFirstPage: true });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="ficha-aluno-${studentId.slice(0, 8)}.pdf"`,
  );
  doc.pipe(res);

  await drawHeader(doc, schoolCfg, "FICHA DO ALUNO");

  // ─── Personal data ────────────────────────────────────────────────────────

  sectionTitle(doc, "Dados Pessoais");
  drawInfoGrid(
    doc,
    [
      { label: "Nome completo", value: (student as any).name },
      { label: "Nome social", value: (student as any).socialName ?? "—" },
      { label: "CPF", value: (student as any).cpf ?? "—" },
      { label: "RG", value: (student as any).rg ?? "—" },
      {
        label: "Certidão de nascimento",
        value: (student as any).birthCertificate ?? "—",
      },
      {
        label: "Data de nascimento",
        value: (student as any).birthDate
          ? new Date((student as any).birthDate).toLocaleDateString("pt-BR")
          : "—",
      },
      { label: "Gênero", value: GENDER[(student as any).gender ?? ""] ?? "—" },
      { label: "Nacionalidade", value: (student as any).nationality ?? "—" },
      { label: "Naturalidade", value: (student as any).naturalidade ?? "—" },
    ],
    3,
  );

  // Contact
  sectionTitle(doc, "Contato e Endereço");
  drawInfoGrid(
    doc,
    [
      { label: "E-mail", value: (student as any).email ?? "—" },
      { label: "Telefone", value: (student as any).phone ?? "—" },
      { label: "CEP", value: (student as any).zipCode ?? "—" },
      {
        label: "Endereço",
        value: (student as any).street
          ? `${(student as any).street}, ${(student as any).addressNumber ?? "s/n"}`
          : "—",
      },
      { label: "Bairro", value: (student as any).neighborhood ?? "—" },
      {
        label: "Cidade/UF",
        value: (student as any).city
          ? `${(student as any).city}/${(student as any).state ?? ""}`
          : "—",
      },
    ],
    2,
  );

  // ─── Health data ──────────────────────────────────────────────────────────

  if (config.showHealth && (student as any).health) {
    const h = (student as any).health;
    sectionTitle(doc, "Informações de Saúde");
    drawInfoGrid(
      doc,
      [
        { label: "Tipo sanguíneo", value: h.bloodType ?? "—" },
        { label: "Alergias", value: h.allergies ?? "—" },
        {
          label: "Restrições alimentares",
          value: h.dietaryRestrictions ?? "—",
        },
        { label: "Necessidades especiais", value: h.specialNeeds ?? "—" },
        { label: "Medicamentos", value: h.medication ?? "—" },
        { label: "Observações", value: h.healthNotes ?? "—" },
      ],
      2,
    );
  }

  // ─── Guardians ────────────────────────────────────────────────────────────

  if (config.showGuardians && guardianProfiles.length > 0) {
    sectionTitle(doc, "Responsáveis");
    drawTable(
      doc,
      [
        { header: "Nome", width: 160, align: "left" },
        { header: "Parentesco", width: 90, align: "left" },
        { header: "Telefone", width: 95, align: "left" },
        { header: "E-mail", width: 155, align: "left" },
      ],
      guardianProfiles.map((link: any) => [
        link.guardian?.name ?? "—",
        RELATION[link.relationType ?? ""] ?? link.relationType ?? "—",
        link.guardian?.phone ?? link.profile?.phone ?? "—",
        link.guardian?.email ?? "—",
      ]),
      { rowHeight: 18, fontSize: 9 },
    );
  }

  // ─── Documents ────────────────────────────────────────────────────────────

  if (config.showDocuments && (student as any).documents?.length > 0) {
    sectionTitle(doc, "Documentos Entregues");
    const DOC_LABELS: Record<string, string> = {
      RG: "RG",
      CPF: "CPF",
      CERTIDAO_NASCIMENTO: "Certidão de Nascimento",
      COMPROVANTE_RESIDENCIA: "Comprovante de Residência",
      HISTORICO_ESCOLAR: "Histórico Escolar",
      LAUDO_MEDICO: "Laudo Médico",
      FOTO: "Foto",
      OUTRO: "Outro",
    };
    drawTable(
      doc,
      [
        { header: "Tipo", width: 180, align: "left" },
        { header: "Descrição", width: 220, align: "left" },
        { header: "Situação", width: 100, align: "center" },
      ],
      (student as any).documents.map((d: any) => [
        DOC_LABELS[d.type] ?? d.type,
        d.name,
        d.delivered ? "Entregue" : "Pendente",
      ]),
      { rowHeight: 18, fontSize: 9 },
    );
  }

  // ─── Enrollments ──────────────────────────────────────────────────────────

  if (config.showEnrollments && (student as any).enrollments?.length > 0) {
    sectionTitle(doc, "Histórico de Matrículas");
    drawTable(
      doc,
      [
        { header: "Nº Matrícula", width: 100, align: "left" },
        { header: "Ano Letivo", width: 70, align: "center" },
        { header: "Turma", width: 100, align: "left" },
        { header: "Série", width: 120, align: "left" },
        { header: "Status", width: 110, align: "center" },
      ],
      (student as any).enrollments.map((e: any) => [
        e.enrollmentNumber,
        e.academicYear?.year,
        e.classroom?.name ?? "—",
        e.classroom?.gradeLevel?.name ?? "—",
        e.status,
      ]),
      { rowHeight: 18, fontSize: 9 },
    );
  }

  if (config.showSignatureLines) {
    drawSignatureLines(doc, ["Secretaria Escolar", "Responsável pelo Aluno"]);
  }

  drawFooter(doc, schoolCfg, docId);
  doc.end();
}
