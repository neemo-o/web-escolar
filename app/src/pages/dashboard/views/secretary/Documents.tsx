import React, { useEffect, useState, useCallback, useRef } from "react";
import api from "../../../../utils/api";
import {
  PageShell,
  Card,
  PrimaryButton,
  SearchBar,
  SelectFilter,
  DataTable,
  Pagination,
  StatusBadge,
  IconButton,
  Modal,
  FormField,
  Select,
  ModalFooter,
  InlineAlert,
  toast,
} from "../../../../components/ui";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  DECLARACAO: "Declaração",
  COMUNICADO: "Comunicado",
  ADVERTENCIA: "Advertência",
  SUSPENSAO: "Suspensão",
  BOLETIM: "Boletim",
  CONTRATO: "Contrato",
  COMPROVANTE: "Comprovante",
  OUTRO: "Outro",
};
const CATEGORY_COLORS: Record<
  string,
  "blue" | "yellow" | "red" | "green" | "purple" | "gray"
> = {
  DECLARACAO: "blue",
  COMUNICADO: "purple",
  ADVERTENCIA: "yellow",
  SUSPENSAO: "red",
  BOLETIM: "green",
  CONTRATO: "blue",
  COMPROVANTE: "green",
  OUTRO: "gray",
};
const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: "Rascunho",
  EMITIDO: "Emitido",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};
const STATUS_COLORS: Record<string, "gray" | "blue" | "green" | "red"> = {
  RASCUNHO: "gray",
  EMITIDO: "blue",
  ENTREGUE: "green",
  CANCELADO: "red",
};

const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  FREE: "Documento livre",
  BOLETIM: "Boletim",
  COMPROVANTE_MATRICULA: "Comprovante de Matrícula",
  HISTORICO_ESCOLAR: "Histórico Escolar",
  DECLARACAO_FREQUENCIA: "Declaração de Frequência",
  FICHA_ALUNO: "Ficha do Aluno",
};

const STRUCTURED_TYPES = [
  "BOLETIM",
  "COMPROVANTE_MATRICULA",
  "HISTORICO_ESCOLAR",
  "DECLARACAO_FREQUENCIA",
  "FICHA_ALUNO",
];

const NEEDS_ENROLLMENT = [
  "BOLETIM",
  "COMPROVANTE_MATRICULA",
  "DECLARACAO_FREQUENCIA",
];
const NEEDS_STUDENT = ["HISTORICO_ESCOLAR", "FICHA_ALUNO"];

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([v, l]) => ({
  value: v,
  label: l,
}));
const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([v, l]) => ({
  value: v,
  label: l,
}));
const TEMPLATE_TYPE_OPTIONS = Object.entries(TEMPLATE_TYPE_LABELS).map(
  ([v, l]) => ({ value: v, label: l }),
);

const VARIABLE_CHIPS = [
  { label: "{{aluno.nome}}", value: "{{aluno.nome}}" },
  { label: "{{aluno.cpf}}", value: "{{aluno.cpf}}" },
  { label: "{{matricula.numero}}", value: "{{matricula.numero}}" },
  { label: "{{turma.nome}}", value: "{{turma.nome}}" },
  { label: "{{ano.letivo}}", value: "{{ano.letivo}}" },
  { label: "{{responsavel.nome}}", value: "{{responsavel.nome}}" },
  { label: "{{data}}", value: "{{data}}" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  padding: "0 12px",
  borderRadius: 9,
  border: "1.5px solid #e2e8f0",
  fontSize: 13,
  fontFamily: "inherit",
  boxSizing: "border-box",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Template = {
  id: string;
  name: string;
  category: string;
  templateType: string;
  description?: string;
  headerHtml?: string;
  footerHtml?: string;
  bodyTemplate: string;
  showLogo: boolean;
  requiresSignature: boolean;
  structuredConfig?: any;
  active: boolean;
  createdBy?: { name: string };
};

type IssuedDoc = {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt: string;
  student?: { id: string; name: string };
  template?: { name: string; category: string; templateType: string };
  createdBy?: { name: string };
  deliveredAt?: string;
};

type Student = { id: string; name: string };
type EnrollmentOption = {
  id: string;
  enrollmentNumber: string;
  classroom?: { name: string };
};

// ─── Structured Config defaults ───────────────────────────────────────────────

function defaultConfig(templateType: string): any {
  switch (templateType) {
    case "BOLETIM":
      return {
        showFrequency: true,
        showFinalGrade: true,
        showSituation: true,
        showSignatureLines: false,
        periodId: "",
      };
    case "COMPROVANTE_MATRICULA":
      return {
        showGuardian: true,
        showSchedule: false,
        showSubjects: true,
        showSignatureLines: true,
      };
    case "HISTORICO_ESCOLAR":
      return { showSignatureLines: true, showObservations: false };
    case "DECLARACAO_FREQUENCIA":
      return { showBySubject: true, showSignatureLines: true };
    case "FICHA_ALUNO":
      return {
        showHealth: true,
        showGuardians: true,
        showDocuments: true,
        showEnrollments: true,
        showSignatureLines: false,
      };
    default:
      return {};
  }
}

// ─── Structured config panels ─────────────────────────────────────────────────

function StructuredConfigPanel({
  templateType,
  config,
  onChange,
}: {
  templateType: string;
  config: any;
  onChange: (c: any) => void;
}) {
  function Toggle({ field, label }: { field: string; label: string }) {
    return (
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          marginBottom: 10,
          fontSize: 13,
        }}
      >
        <input
          type="checkbox"
          checked={!!config[field]}
          onChange={(e) => onChange({ ...config, [field]: e.target.checked })}
          style={{ width: 14, height: 14 }}
        />
        {label}
      </label>
    );
  }

  const box = (title: string, children: React.ReactNode) => (
    <div
      style={{
        background: "#f8fafc",
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 12,
      }}
    >
      <p
        style={{
          margin: "0 0 10px",
          fontSize: 11,
          fontWeight: 700,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );

  if (templateType === "BOLETIM")
    return (
      <div>
        {box(
          "Colunas do Boletim",
          <>
            <Toggle
              field="showFrequency"
              label="Incluir coluna de frequência"
            />
            <Toggle field="showFinalGrade" label="Incluir média final" />
            <Toggle
              field="showSituation"
              label="Incluir situação (Aprovado/Reprovado)"
            />
          </>,
        )}
        {box(
          "Rodapé",
          <>
            <Toggle field="showSignatureLines" label="Linhas para assinatura" />
          </>,
        )}
      </div>
    );

  if (templateType === "COMPROVANTE_MATRICULA")
    return (
      <div>
        {box(
          "Seções",
          <>
            <Toggle
              field="showGuardian"
              label="Dados do responsável financeiro"
            />
            <Toggle
              field="showSubjects"
              label="Lista de disciplinas e professores"
            />
            <Toggle field="showSchedule" label="Grade de horários (opcional)" />
          </>,
        )}
        {box(
          "Rodapé",
          <>
            <Toggle field="showSignatureLines" label="Linhas para assinatura" />
          </>,
        )}
      </div>
    );

  if (templateType === "HISTORICO_ESCOLAR")
    return (
      <div>
        {box(
          "Opções",
          <>
            <Toggle
              field="showObservations"
              label="Observações por ano letivo"
            />
            <Toggle field="showSignatureLines" label="Linhas para assinatura" />
          </>,
        )}
      </div>
    );

  if (templateType === "DECLARACAO_FREQUENCIA")
    return (
      <div>
        {box(
          "Detalhamento",
          <>
            <Toggle field="showBySubject" label="Frequência por disciplina" />
            <Toggle field="showSignatureLines" label="Linhas para assinatura" />
          </>,
        )}
      </div>
    );

  if (templateType === "FICHA_ALUNO")
    return (
      <div>
        {box(
          "Seções da Ficha",
          <>
            <Toggle field="showHealth" label="Informações de saúde" />
            <Toggle field="showGuardians" label="Responsáveis" />
            <Toggle field="showDocuments" label="Documentos entregues" />
            <Toggle field="showEnrollments" label="Histórico de matrículas" />
          </>,
        )}
        {box(
          "Rodapé",
          <>
            <Toggle field="showSignatureLines" label="Linhas para assinatura" />
          </>,
        )}
      </div>
    );

  return null;
}

// ─── Rich editor ──────────────────────────────────────────────────────────────

function RichEditor({
  value,
  onChange,
  placeholder,
  minHeight = 120,
  onInsert,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
  onInsert?: (fn: (t: string) => void) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  function execCmd(cmd: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false);
    onChange(editorRef.current?.innerHTML || "");
  }

  function insertText(text: string) {
    editorRef.current?.focus();
    document.execCommand("insertText", false, text);
    onChange(editorRef.current?.innerHTML || "");
  }

  if (onInsert) onInsert(insertText);

  const btn = (label: string, cmd: string) => (
    <button
      type="button"
      onClick={() => execCmd(cmd)}
      style={{
        border: "1px solid #e2e8f0",
        background: "#fff",
        borderRadius: 5,
        padding: "3px 8px",
        cursor: "pointer",
        fontSize: 11,
        color: "#374151",
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        border: "1.5px solid #e2e8f0",
        borderRadius: 9,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: "5px 8px",
          background: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          flexWrap: "wrap",
        }}
      >
        {btn("N", "bold")}
        {btn("I", "italic")}
        {btn("S", "underline")}
        <span
          style={{
            width: 1,
            background: "#e2e8f0",
            height: 16,
            margin: "0 2px",
          }}
        />
        {btn("⬅", "justifyLeft")}
        {btn("≡", "justifyCenter")}
        {btn("➡", "justifyRight")}
        <span
          style={{
            width: 1,
            background: "#e2e8f0",
            height: 16,
            margin: "0 2px",
          }}
        />
        {btn("• Lista", "insertUnorderedList")}
        {btn("1. Lista", "insertOrderedList")}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(editorRef.current?.innerHTML || "")}
        style={{
          minHeight,
          padding: "10px 12px",
          fontSize: 13,
          lineHeight: 1.7,
          outline: "none",
        }}
        data-placeholder={placeholder}
      />
      <style>{`[contenteditable]:empty:before{content:attr(data-placeholder);color:#9ca3af}`}</style>
    </div>
  );
}

// ─── Document Preview ─────────────────────────────────────────────────────────

function DocumentPreview({
  title,
  header,
  body,
  footer,
  requiresSignature,
  isStructured,
  templateType,
}: {
  title: string;
  header: string;
  body: string;
  footer: string;
  requiresSignature: boolean;
  isStructured?: boolean;
  templateType?: string;
}) {
  if (isStructured) {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          padding: "24px 28px",
          minHeight: 420,
          fontFamily: "serif",
          fontSize: 12,
        }}
      >
        <div
          style={{
            borderBottom: "2px solid #6366f1",
            paddingBottom: 12,
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>
            Logo da escola · Nome da instituição
          </div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            {TEMPLATE_TYPE_LABELS[templateType ?? ""] ?? title}
          </div>
        </div>
        <div
          style={{
            background: "#f1f5f9",
            borderRadius: 8,
            padding: "12px 14px",
            marginBottom: 12,
            fontSize: 11,
          }}
        >
          <strong>Dados do aluno</strong> — preenchidos automaticamente pelo
          sistema
        </div>
        {(templateType === "BOLETIM" ||
          templateType === "HISTORICO_ESCOLAR") && (
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                background: "#eef2ff",
                borderRadius: 4,
                padding: "6px 10px",
                marginBottom: 6,
                fontSize: 10,
                fontWeight: 700,
                color: "#4f46e5",
              }}
            >
              NOTAS POR PERÍODO
            </div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 10,
              }}
            >
              <thead>
                <tr>
                  {[
                    "Disciplina",
                    "1º Bim",
                    "2º Bim",
                    "3º Bim",
                    "4º Bim",
                    "Média",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        background: "#f1f5f9",
                        padding: "4px 6px",
                        textAlign: "center",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {["Matemática", "Português", "Ciências"].map((d, i) => (
                  <tr
                    key={d}
                    style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}
                  >
                    <td
                      style={{
                        padding: "3px 6px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      {d}
                    </td>
                    {["8.5", "7.0", "9.0", "8.0", "8.1"].map((v, j) => (
                      <td
                        key={j}
                        style={{
                          padding: "3px 6px",
                          textAlign: "center",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {templateType === "COMPROVANTE_MATRICULA" && (
          <div style={{ fontSize: 10, color: "#374151" }}>
            <div style={{ marginBottom: 8 }}>
              <strong>Matrícula:</strong> 2026-0001 · <strong>Turma:</strong> 7º
              Ano A · <strong>Turno:</strong> Manhã
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Responsável financeiro:</strong> João da Silva · (71)
              99999-0000
            </div>
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 4,
                padding: "8px",
                fontSize: 10,
                color: "#9ca3af",
                textAlign: "center",
              }}
            >
              [Horários aparecem aqui se ativados]
            </div>
          </div>
        )}
        {templateType === "DECLARACAO_FREQUENCIA" && (
          <div style={{ fontSize: 10 }}>
            <div style={{ marginBottom: 8 }}>
              Declaramos que o(a) aluno(a) <strong>[Nome]</strong> apresentou
              frequência de <strong>[X]%</strong>...
            </div>
            <div
              style={{
                background: "#f1f5f9",
                borderRadius: 4,
                padding: "6px 10px",
                fontSize: 10,
                color: "#6b7280",
              }}
            >
              Tabela de frequência por disciplina
            </div>
          </div>
        )}
        {templateType === "FICHA_ALUNO" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              fontSize: 10,
            }}
          >
            {[
              "Dados pessoais",
              "Contato e endereço",
              "Saúde",
              "Responsáveis",
            ].map((s) => (
              <div
                key={s}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  borderRadius: 4,
                  padding: "8px",
                  color: "#6b7280",
                }}
              >
                {s}
              </div>
            ))}
          </div>
        )}
        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            marginTop: 20,
            paddingTop: 8,
            fontSize: 9,
            color: "#9ca3af",
            textAlign: "center",
          }}
        >
          Emitido em {new Date().toLocaleDateString("pt-BR")} ·{" "}
          {TEMPLATE_TYPE_LABELS[templateType ?? ""]}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "24px 28px",
        minHeight: 420,
        fontFamily: "serif",
        fontSize: 12,
        lineHeight: 1.8,
        color: "#111827",
      }}
    >
      {header ? (
        <div
          style={{
            borderBottom: "1.5px solid #d1d5db",
            paddingBottom: 10,
            marginBottom: 14,
            fontSize: 10,
            color: "#6b7280",
            textAlign: "center",
          }}
          dangerouslySetInnerHTML={{ __html: header }}
        />
      ) : (
        <div
          style={{
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: 10,
            marginBottom: 14,
            fontSize: 10,
            color: "#d1d5db",
            textAlign: "center",
          }}
        >
          [Cabeçalho — logo e nome da escola serão inseridos automaticamente]
        </div>
      )}
      {title && (
        <h2
          style={{
            textAlign: "center",
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          {title}
        </h2>
      )}
      <div
        style={{ textAlign: "justify" }}
        dangerouslySetInnerHTML={{
          __html:
            body ||
            '<p style="color:#9ca3af">[Conteúdo do documento aparecerá aqui]</p>',
        }}
      />
      {requiresSignature && (
        <div
          style={{
            marginTop: 32,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
          }}
        >
          {["Responsável", "Secretaria"].map((l) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div
                style={{
                  borderTop: "1px solid #374151",
                  paddingTop: 5,
                  fontSize: 10,
                  color: "#6b7280",
                }}
              >
                {l}
              </div>
            </div>
          ))}
        </div>
      )}
      {footer ? (
        <div
          style={{
            borderTop: "1.5px solid #d1d5db",
            marginTop: 24,
            paddingTop: 8,
            fontSize: 9,
            color: "#9ca3af",
            textAlign: "center",
          }}
          dangerouslySetInnerHTML={{ __html: footer }}
        />
      ) : (
        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            marginTop: 24,
            paddingTop: 8,
            fontSize: 9,
            color: "#d1d5db",
            textAlign: "center",
          }}
        >
          [Rodapé não configurado]
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Tab = "issued" | "templates";

export default function Documents() {
  const [tab, setTab] = useState<Tab>("issued");
  return (
    <PageShell
      title="Documentos"
      description="Templates, documentos estruturados e emissão de documentos da escola."
    >
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 20,
          borderBottom: "2px solid #f1f5f9",
        }}
      >
        {(["issued", "templates"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 20px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontWeight: tab === t ? 700 : 400,
              fontSize: 13,
              color: tab === t ? "#6366f1" : "#6b7280",
              borderBottom:
                tab === t ? "2px solid #6366f1" : "2px solid transparent",
              marginBottom: -2,
            }}
          >
            {t === "issued" ? "📄 Documentos Emitidos" : "🗂 Templates"}
          </button>
        ))}
      </div>
      {tab === "templates" && <TemplatesTab />}
      {tab === "issued" && <IssuedTab />}
    </PageShell>
  );
}

// ─── Templates Tab ─────────────────────────────────────────────────────────────

function TemplatesTab() {
  const [items, setItems] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Template | null>(null);
  const [form, setForm] = useState<any>({
    name: "",
    category: "OUTRO",
    templateType: "FREE",
    description: "",
    headerHtml: "",
    footerHtml: "",
    bodyTemplate: "",
    showLogo: true,
    requiresSignature: false,
    active: true,
    structuredConfig: defaultConfig("FREE"),
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const insertBodyRef = useRef<((t: string) => void) | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (!showInactive) params.set("active", "true");
      if (typeFilter) params.set("templateType", typeFilter);
      const res = await api.fetchJson(`/document-templates?${params}`);
      setItems(res?.data ?? []);
    } catch {
      toast("Erro ao carregar templates", "error");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, showInactive]);

  useEffect(() => {
    load();
  }, [load]);

  function setF(patch: any) {
    setForm((f: any) => ({ ...f, ...patch }));
  }

  function openCreate() {
    setForm({
      name: "",
      category: "OUTRO",
      templateType: "FREE",
      description: "",
      headerHtml: "",
      footerHtml: "",
      bodyTemplate: "",
      showLogo: true,
      requiresSignature: false,
      active: true,
      structuredConfig: defaultConfig("FREE"),
    });
    setFormError("");
    setModal("create");
  }

  function openEdit(item: Template) {
    setForm({
      name: item.name,
      category: item.category,
      templateType: item.templateType,
      description: item.description || "",
      headerHtml: item.headerHtml || "",
      footerHtml: item.footerHtml || "",
      bodyTemplate: item.bodyTemplate,
      showLogo: item.showLogo,
      requiresSignature: item.requiresSignature,
      active: item.active,
      structuredConfig:
        item.structuredConfig ?? defaultConfig(item.templateType),
    });
    setFormError("");
    setSelected(item);
    setModal("edit");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) {
      setFormError("Nome é obrigatório.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const body = {
        name: form.name,
        category: form.category,
        templateType: form.templateType,
        description: form.description || undefined,
        headerHtml: form.headerHtml || undefined,
        footerHtml: form.footerHtml || undefined,
        bodyTemplate: form.bodyTemplate,
        showLogo: form.showLogo,
        requiresSignature: form.requiresSignature,
        structuredConfig: STRUCTURED_TYPES.includes(form.templateType)
          ? form.structuredConfig
          : undefined,
        ...(modal === "edit" && { active: form.active }),
      };
      if (modal === "create") {
        await api.fetchJson("/document-templates", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast("Template criado!");
      } else if (selected) {
        await api.fetchJson(`/document-templates/${selected.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast("Template atualizado!");
      }
      setModal(null);
      load();
    } catch (err: any) {
      setFormError(err?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setSaving(true);
    try {
      await api.fetchJson(`/document-templates/${selected.id}`, {
        method: "DELETE",
      });
      toast("Template removido!");
      setModal(null);
      load();
    } catch (err: any) {
      toast(err?.message || "Erro.", "error");
    } finally {
      setSaving(false);
    }
  }

  const isStructured = STRUCTURED_TYPES.includes(form.templateType);
  const isOpen = modal === "create" || modal === "edit";

  const columns = [
    { key: "name", label: "Nome" },
    { key: "type", label: "Tipo" },
    { key: "cat", label: "Categoria" },
    { key: "status", label: "Status" },
    { key: "logo", label: "Logo" },
    { key: "actions", label: "" },
  ];

  const rows = items.map((item) => [
    <span style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</span>,
    <span
      style={{
        fontSize: 12,
        background: STRUCTURED_TYPES.includes(item.templateType)
          ? "#eef2ff"
          : "#f1f5f9",
        color: STRUCTURED_TYPES.includes(item.templateType)
          ? "#4f46e5"
          : "#6b7280",
        padding: "2px 8px",
        borderRadius: 12,
      }}
    >
      {TEMPLATE_TYPE_LABELS[item.templateType] ?? item.templateType}
    </span>,
    <StatusBadge
      status={item.category}
      label={CATEGORY_LABELS[item.category] ?? item.category}
      color={CATEGORY_COLORS[item.category] ?? "gray"}
    />,
    <StatusBadge
      status={item.active ? "active" : "inactive"}
      label={item.active ? "Ativo" : "Inativo"}
      color={item.active ? "green" : "gray"}
    />,
    <span
      style={{ fontSize: 12, color: item.showLogo ? "#059669" : "#9ca3af" }}
    >
      {item.showLogo ? "✓ Sim" : "—"}
    </span>,

    <div style={{ display: "flex", gap: 4 }}>
      <IconButton onClick={() => openEdit(item)} title="Editar">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </IconButton>
      <IconButton
        onClick={() => {
          setSelected(item);
          setModal("delete");
        }}
        title="Remover"
        variant="danger"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M9 6V4h6v2" />
        </svg>
      </IconButton>
    </div>,
  ]);

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <SelectFilter
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "", label: "Todos os tipos" },
              ...TEMPLATE_TYPE_OPTIONS,
            ]}
          />
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Mostrar inativos
          </label>
        </div>
        <PrimaryButton onClick={openCreate}>+ Novo template</PrimaryButton>
      </div>
      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          emptyMessage="Nenhum template cadastrado."
        />
      </Card>

      <Modal
        open={isOpen}
        onClose={() => setModal(null)}
        title={
          modal === "create" ? "Novo template" : `Editar — ${selected?.name}`
        }
        width={1060}
      >
        <form onSubmit={handleSave}>
          {formError && (
            <div style={{ marginBottom: 14 }}>
              <InlineAlert message={formError} type="error" />
            </div>
          )}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}
          >
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <FormField label="Nome" required>
                  <input
                    value={form.name}
                    onChange={(e) => setF({ name: e.target.value })}
                    style={inputStyle}
                    placeholder="Ex: Boletim Anual"
                  />
                </FormField>
                <FormField label="Tipo de documento">
                  <Select
                    value={form.templateType}
                    onChange={(v) =>
                      setF({
                        templateType: v,
                        structuredConfig: defaultConfig(v),
                      })
                    }
                    options={TEMPLATE_TYPE_OPTIONS}
                  />
                </FormField>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <FormField label="Categoria">
                  <Select
                    value={form.category}
                    onChange={(v) => setF({ category: v })}
                    options={CATEGORY_OPTIONS}
                  />
                </FormField>
                <FormField label="Descrição interna">
                  <input
                    value={form.description}
                    onChange={(e) => setF({ description: e.target.value })}
                    style={inputStyle}
                    placeholder="Para uso da secretaria"
                  />
                </FormField>
              </div>

              <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.showLogo}
                    onChange={(e) => setF({ showLogo: e.target.checked })}
                  />
                  Exibir logo da escola no cabeçalho
                </label>
                {!isStructured && (
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.requiresSignature}
                      onChange={(e) =>
                        setF({ requiresSignature: e.target.checked })
                      }
                    />
                    Espaço para assinatura
                  </label>
                )}
                {modal === "edit" && (
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setF({ active: e.target.checked })}
                    />
                    Ativo
                  </label>
                )}
              </div>

              {isStructured ? (
                <>
                  <div
                    style={{
                      background: "#eef2ff",
                      border: "1px solid #c7d2fe",
                      borderRadius: 9,
                      padding: "10px 14px",
                      marginBottom: 14,
                      fontSize: 12,
                      color: "#4338ca",
                    }}
                  >
                    <strong>Documento estruturado</strong> — o conteúdo é gerado
                    automaticamente a partir dos dados do sistema. Configure as
                    seções abaixo.
                  </div>
                  <StructuredConfigPanel
                    templateType={form.templateType}
                    config={form.structuredConfig ?? {}}
                    onChange={(cfg) => setF({ structuredConfig: cfg })}
                  />
                  <FormField label="Cabeçalho personalizado (opcional)">
                    <RichEditor
                      value={form.headerHtml}
                      onChange={(v) => setF({ headerHtml: v })}
                      placeholder="Deixe vazio para usar o cabeçalho padrão com logo da escola..."
                      minHeight={60}
                    />
                  </FormField>
                  <FormField label="Rodapé personalizado (opcional)">
                    <RichEditor
                      value={form.footerHtml}
                      onChange={(v) => setF({ footerHtml: v })}
                      placeholder="Deixe vazio para usar o rodapé padrão..."
                      minHeight={60}
                    />
                  </FormField>
                </>
              ) : (
                <>
                  <FormField label="Cabeçalho">
                    <RichEditor
                      value={form.headerHtml}
                      onChange={(v) => setF({ headerHtml: v })}
                      placeholder="Nome da escola, endereço... (deixe vazio para usar logo automaticamente)"
                      minHeight={70}
                    />
                  </FormField>
                  <FormField label="Corpo do documento">
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 5,
                        marginBottom: 6,
                      }}
                    >
                      {VARIABLE_CHIPS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => insertBodyRef.current?.(c.value)}
                          style={{
                            padding: "2px 8px",
                            borderRadius: 20,
                            border: "1px solid #c7d2fe",
                            background: "#eef2ff",
                            color: "#4f46e5",
                            fontSize: 10,
                            cursor: "pointer",
                            fontFamily: "monospace",
                          }}
                        >
                          {c.value}
                        </button>
                      ))}
                    </div>
                    <RichEditor
                      value={form.bodyTemplate}
                      onChange={(v) => setF({ bodyTemplate: v })}
                      placeholder="Texto do documento..."
                      minHeight={180}
                      onInsert={(fn) => {
                        insertBodyRef.current = fn;
                      }}
                    />
                  </FormField>
                  <FormField label="Rodapé">
                    <RichEditor
                      value={form.footerHtml}
                      onChange={(v) => setF({ footerHtml: v })}
                      placeholder="Local, data..."
                      minHeight={70}
                    />
                  </FormField>
                </>
              )}
            </div>

            <div>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                }}
              >
                Preview
              </p>
              <div style={{ position: "sticky", top: 16 }}>
                <DocumentPreview
                  title={form.name}
                  header={form.headerHtml}
                  body={form.bodyTemplate}
                  footer={form.footerHtml}
                  requiresSignature={form.requiresSignature}
                  isStructured={isStructured}
                  templateType={form.templateType}
                />
              </div>
            </div>
          </div>

          <ModalFooter>
            <PrimaryButton variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </PrimaryButton>
            <PrimaryButton type="submit" loading={saving}>
              {modal === "create" ? "Criar template" : "Salvar"}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>

      <Modal
        open={modal === "delete"}
        onClose={() => setModal(null)}
        title="Remover template"
      >
        <p style={{ margin: "0 0 20px", color: "#374151" }}>
          Remover <strong>{selected?.name}</strong>?
        </p>
        <ModalFooter>
          <PrimaryButton variant="ghost" onClick={() => setModal(null)}>
            Cancelar
          </PrimaryButton>
          <PrimaryButton
            variant="danger"
            onClick={handleDelete}
            loading={saving}
          >
            Remover
          </PrimaryButton>
        </ModalFooter>
      </Modal>
    </>
  );
}

// ─── Issued Documents Tab ─────────────────────────────────────────────────────

function IssuedTab() {
  const [items, setItems] = useState<IssuedDoc[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modal, setModal] = useState<"create" | "view" | "delete" | null>(null);
  const [selected, setSelected] = useState<IssuedDoc | null>(null);
  const [selectedFull, setSelectedFull] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState<any>({
    templateId: "",
    studentId: "",
    enrollmentId: "",
    title: "",
    category: "OUTRO",
    bodySnapshot: "",
    headerSnapshot: "",
    footerSnapshot: "",
    notes: "",
    structuredConfig: {},
  });

  const [templates, setTemplates] = useState<Template[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentOption[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [resolvedBody, setResolvedBody] = useState("");
  const resolveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insertBodyRef = useRef<((t: string) => void) | null>(null);
  const LIMIT = 20;

  const selectedTemplate = templates.find((t) => t.id === form.templateId);
  const templateType = selectedTemplate?.templateType ?? "FREE";
  const isStructured = STRUCTURED_TYPES.includes(templateType);
  const needsEnrollment = NEEDS_ENROLLMENT.includes(templateType);
  const needsStudent = NEEDS_STUDENT.includes(templateType);

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: String(LIMIT),
        });
        if (statusFilter) params.set("status", statusFilter);
        if (categoryFilter) params.set("category", categoryFilter);
        const res = await api.fetchJson(`/issued-documents?${params}`);
        setItems(res?.data ?? []);
        setTotal(res?.meta?.total ?? 0);
        setPage(p);
      } catch {
        toast("Erro ao carregar documentos", "error");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, categoryFilter],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  async function loadTemplates() {
    try {
      const res = await api.fetchJson("/document-templates?active=true");
      setTemplates(res?.data ?? []);
    } catch {}
  }

  async function searchStudents(q: string) {
    if (!q || q.length < 2) {
      setStudents([]);
      return;
    }
    try {
      const res = await api.fetchJson(
        `/students?name=${encodeURIComponent(q)}&limit=10`,
      );
      setStudents(res?.data ?? []);
    } catch {}
  }

  async function loadEnrollments(studentId: string) {
    if (!studentId) {
      setEnrollments([]);
      return;
    }
    try {
      const res = await api.fetchJson(
        `/enrollments?studentId=${studentId}&limit=20`,
      );
      setEnrollments(res?.data ?? []);
    } catch {}
  }

  function setF(patch: any) {
    const next = { ...form, ...patch };
    setForm(next);
    if (!STRUCTURED_TYPES.includes(selectedTemplate?.templateType ?? "FREE")) {
      scheduleResolve(next);
    }
  }

  function scheduleResolve(f: any) {
    if (resolveTimer.current) clearTimeout(resolveTimer.current);
    resolveTimer.current = setTimeout(async () => {
      try {
        const res = await api.fetchJson("/documents/resolve-variables", {
          method: "POST",
          body: JSON.stringify({
            body: f.bodySnapshot,
            studentId: f.studentId || undefined,
            enrollmentId: f.enrollmentId || undefined,
          }),
        });
        setResolvedBody(res?.resolved ?? f.bodySnapshot);
      } catch {
        setResolvedBody(f.bodySnapshot);
      }
    }, 600);
  }

  function applyTemplate(templateId: string) {
    if (!templateId) {
      setForm((prev: any) => ({
        ...prev,
        templateId: "",
        bodySnapshot: "",
        headerSnapshot: "",
        footerSnapshot: "",
        category: "OUTRO",
        structuredConfig: {},
      }));
      setResolvedBody("");
      return;
    }
    const t = templates.find((x) => x.id === templateId);
    if (!t) return;
    const isStructured = STRUCTURED_TYPES.includes(t.templateType);
    setForm((prev: any) => ({
      ...prev,
      templateId,
      title: prev.title || t.name,
      bodySnapshot: t.templateType === "FREE" ? t.bodyTemplate : "",
      headerSnapshot: t.headerHtml || "",
      footerSnapshot: t.footerHtml || "",
      category: t.category,
      structuredConfig: t.structuredConfig ?? defaultConfig(t.templateType),
    }));
    if (!isStructured) {
      scheduleResolve({
        ...form,
        templateId,
        title: form.title || t.name,
        bodySnapshot: t.templateType === "FREE" ? t.bodyTemplate : "",
        headerSnapshot: t.headerHtml || "",
        footerSnapshot: t.footerHtml || "",
        category: t.category,
        structuredConfig: t.structuredConfig ?? defaultConfig(t.templateType),
      });
    } else {
      setResolvedBody("");
    }
  }

  function openCreate() {
    setForm({
      templateId: "",
      studentId: "",
      enrollmentId: "",
      title: "",
      category: "OUTRO",
      bodySnapshot: "",
      headerSnapshot: "",
      footerSnapshot: "",
      notes: "",
      structuredConfig: {},
    });
    setResolvedBody("");
    setFormError("");
    setStudents([]);
    setEnrollments([]);
    setStudentSearch("");
    loadTemplates();
    setModal("create");
  }

  async function openView(doc: IssuedDoc) {
    setSelected(doc);
    setModal("view");
    setSelectedFull(null);
    try {
      const full = await api.fetchJson(`/issued-documents/${doc.id}`);
      setSelectedFull(full);
    } catch {}
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) {
      setFormError("Título é obrigatório.");
      return;
    }
    if (needsEnrollment && !form.enrollmentId) {
      setFormError("Selecione uma matrícula para este tipo de documento.");
      return;
    }
    if (needsStudent && !form.studentId) {
      setFormError("Selecione um aluno para este tipo de documento.");
      return;
    }
    const currentTemplate = templates.find((t) => t.id === form.templateId);
    const currentTemplateType = currentTemplate?.templateType ?? "FREE";
    const currentIsStructured = STRUCTURED_TYPES.includes(currentTemplateType);
    setSaving(true);
    setFormError("");
    try {
      await api.fetchJson("/issued-documents", {
        method: "POST",
        body: JSON.stringify({
          templateId: form.templateId || undefined,
          studentId: form.studentId || undefined,
          enrollmentId: form.enrollmentId || undefined,
          title: form.title,
          category: form.category,
          bodySnapshot: form.bodySnapshot,
          headerSnapshot: form.headerSnapshot || undefined,
          footerSnapshot: form.footerSnapshot || undefined,
          notes: form.notes || undefined,
          structuredPayload: currentIsStructured
            ? form.structuredConfig
            : undefined,
        }),
      });
      toast("Documento criado!");
      setModal(null);
      load(1);
    } catch (err: any) {
      setFormError(err?.message || "Erro ao criar.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await api.fetchJson(`/issued-documents/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast(`Status: ${STATUS_LABELS[status]}`);
      load(page);
      if (selectedFull?.id === id)
        setSelectedFull((s: any) => (s ? { ...s, status } : s));
    } catch (err: any) {
      toast(err?.message || "Erro", "error");
    }
  }

  async function downloadPdf(id: string, title: string) {
    try {
      const blob = await (api as any).fetchBlob(`/issued-documents/${id}/pdf`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, "_").slice(0, 60)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      load(page);
    } catch (err: any) {
      toast(err?.message || "Erro ao gerar PDF", "error");
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setSaving(true);
    try {
      await api.fetchJson(`/issued-documents/${selected.id}`, {
        method: "DELETE",
      });
      toast("Documento cancelado.");
      setModal(null);
      load(page);
    } catch (err: any) {
      toast(err?.message || "Erro.", "error");
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: "title", label: "Título" },
    { key: "type", label: "Tipo" },
    { key: "student", label: "Aluno" },
    { key: "status", label: "Status" },
    { key: "date", label: "Data" },
    { key: "actions", label: "" },
  ];
  const rows = items.map((doc) => [
    <span style={{ fontWeight: 600, fontSize: 13 }}>{doc.title}</span>,
    <span style={{ fontSize: 11, color: "#6b7280" }}>
      {doc.template
        ? (TEMPLATE_TYPE_LABELS[doc.template.templateType] ?? "Livre")
        : "Avulso"}
    </span>,
    <span style={{ fontSize: 12 }}>
      {doc.student?.name ?? <span style={{ color: "#9ca3af" }}>—</span>}
    </span>,
    <StatusBadge
      status={doc.status}
      label={STATUS_LABELS[doc.status] ?? doc.status}
      color={STATUS_COLORS[doc.status] ?? "gray"}
    />,
    <span style={{ fontSize: 12, color: "#6b7280" }}>
      {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
    </span>,
    <div style={{ display: "flex", gap: 4 }}>
      <IconButton onClick={() => openView(doc)} title="Ver">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </IconButton>
      <IconButton onClick={() => downloadPdf(doc.id, doc.title)} title="PDF">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </IconButton>
      {doc.status !== "CANCELADO" && doc.status !== "ENTREGUE" && (
        <IconButton
          onClick={() => {
            setSelected(doc);
            setModal("delete");
          }}
          title="Cancelar"
          variant="danger"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </IconButton>
      )}
    </div>,
  ]);

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 14,
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "", label: "Todos os status" },
              ...STATUS_OPTIONS,
            ]}
          />
          <SelectFilter
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: "", label: "Todas as categorias" },
              ...CATEGORY_OPTIONS,
            ]}
          />
        </div>
        <PrimaryButton onClick={openCreate}>+ Emitir documento</PrimaryButton>
      </div>
      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          emptyMessage="Nenhum documento emitido."
        />
        <Pagination
          page={page}
          total={total}
          limit={LIMIT}
          onChange={(p) => load(p)}
        />
      </Card>

      {/* CREATE */}
      <Modal
        open={modal === "create"}
        onClose={() => setModal(null)}
        title="Emitir novo documento"
        width={1060}
      >
        <form onSubmit={handleCreate}>
          {formError && (
            <div style={{ marginBottom: 14 }}>
              <InlineAlert message={formError} type="error" />
            </div>
          )}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}
          >
            <div>
              <FormField label="Template base (opcional)">
                <Select
                  value={form.templateId}
                  onChange={(v) => {
                    setF({ templateId: v });
                    applyTemplate(v);
                  }}
                  options={[
                    { value: "", label: "Sem template / documento avulso" },
                    ...templates.map((t) => ({
                      value: t.id,
                      label: `${TEMPLATE_TYPE_LABELS[t.templateType]} — ${t.name}`,
                    })),
                  ]}
                />
              </FormField>

              {selectedTemplate &&
                STRUCTURED_TYPES.includes(selectedTemplate.templateType) && (
                  <div
                    style={{
                      background: "#eef2ff",
                      border: "1px solid #c7d2fe",
                      borderRadius: 9,
                      padding: "10px 14px",
                      marginBottom: 12,
                      fontSize: 12,
                      color: "#4338ca",
                    }}
                  >
                    <strong>
                      {TEMPLATE_TYPE_LABELS[selectedTemplate.templateType]}
                    </strong>{" "}
                    — documento estruturado. Preencha os campos abaixo e o
                    conteúdo será gerado automaticamente.
                  </div>
                )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <FormField label="Título" required>
                  <input
                    value={form.title}
                    onChange={(e) => setF({ title: e.target.value })}
                    style={inputStyle}
                    placeholder="Título do documento"
                  />
                </FormField>
                <FormField label="Categoria">
                  <Select
                    value={form.category}
                    onChange={(v) => setF({ category: v })}
                    options={CATEGORY_OPTIONS}
                  />
                </FormField>
              </div>

              {/* Student search - always show */}
              <FormField
                label={
                  needsStudent
                    ? "Aluno *"
                    : needsEnrollment
                      ? "Aluno *"
                      : "Aluno (opcional)"
                }
              >
                <input
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    searchStudents(e.target.value);
                  }}
                  style={inputStyle}
                  placeholder="Digite o nome..."
                />
                {students.length > 0 && (
                  <div
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      background: "#fff",
                      marginTop: 4,
                      maxHeight: 140,
                      overflowY: "auto",
                    }}
                  >
                    {students.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setF({ studentId: s.id, enrollmentId: "" });
                          setStudentSearch(s.name);
                          setStudents([]);
                          loadEnrollments(s.id);
                        }}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "8px 12px",
                          border: "none",
                          background:
                            form.studentId === s.id ? "#eef2ff" : "transparent",
                          cursor: "pointer",
                          fontSize: 13,
                        }}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </FormField>

              {(needsEnrollment || enrollments.length > 0) && (
                <FormField
                  label={
                    needsEnrollment ? "Matrícula *" : "Matrícula (opcional)"
                  }
                >
                  <Select
                    value={form.enrollmentId}
                    onChange={(v) => setF({ enrollmentId: v })}
                    options={[
                      {
                        value: "",
                        label:
                          enrollments.length === 0
                            ? "Busque um aluno primeiro..."
                            : "Selecionar...",
                      },
                      ...enrollments.map((en) => ({
                        value: en.id,
                        label: `${en.enrollmentNumber} — ${en.classroom?.name ?? ""}`,
                      })),
                    ]}
                  />
                </FormField>
              )}

              {isStructured && selectedTemplate ? (
                <StructuredConfigPanel
                  templateType={selectedTemplate.templateType}
                  config={form.structuredConfig}
                  onChange={(cfg) => setF({ structuredConfig: cfg })}
                />
              ) : (
                <>
                  <FormField label="Cabeçalho">
                    <RichEditor
                      value={form.headerSnapshot}
                      onChange={(v) => setF({ headerSnapshot: v })}
                      placeholder="Cabeçalho..."
                      minHeight={60}
                    />
                  </FormField>
                  <FormField label="Corpo do documento">
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 4,
                        marginBottom: 6,
                      }}
                    >
                      {VARIABLE_CHIPS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => insertBodyRef.current?.(c.value)}
                          style={{
                            padding: "2px 7px",
                            borderRadius: 20,
                            border: "1px solid #c7d2fe",
                            background: "#eef2ff",
                            color: "#4f46e5",
                            fontSize: 10,
                            cursor: "pointer",
                            fontFamily: "monospace",
                          }}
                        >
                          {c.value}
                        </button>
                      ))}
                    </div>
                    <RichEditor
                      value={form.bodySnapshot}
                      onChange={(v) => setF({ bodySnapshot: v })}
                      placeholder="Conteúdo do documento..."
                      minHeight={180}
                      onInsert={(fn) => {
                        insertBodyRef.current = fn;
                      }}
                    />
                  </FormField>
                  <FormField label="Rodapé">
                    <RichEditor
                      value={form.footerSnapshot}
                      onChange={(v) => setF({ footerSnapshot: v })}
                      placeholder="Rodapé..."
                      minHeight={60}
                    />
                  </FormField>
                </>
              )}

              <FormField label="Observações internas">
                <textarea
                  value={form.notes}
                  onChange={(e) => setF({ notes: e.target.value })}
                  style={{
                    ...inputStyle,
                    height: "auto",
                    minHeight: 56,
                    padding: "8px 12px",
                    resize: "vertical",
                  }}
                  placeholder="Notas da secretaria..."
                />
              </FormField>
            </div>

            <div>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                }}
              >
                {isStructured
                  ? "Layout do documento"
                  : "Preview com variáveis resolvidas"}
              </p>
              <div style={{ position: "sticky", top: 16 }}>
                <DocumentPreview
                  title={form.title}
                  header={form.headerSnapshot}
                  body={resolvedBody || form.bodySnapshot}
                  footer={form.footerSnapshot}
                  requiresSignature={false}
                  isStructured={isStructured}
                  templateType={
                    isStructured ? selectedTemplate?.templateType : undefined
                  }
                />
              </div>
            </div>
          </div>
          <ModalFooter>
            <PrimaryButton variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </PrimaryButton>
            <PrimaryButton type="submit" loading={saving}>
              Salvar documento
            </PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>

      {/* VIEW */}
      <Modal
        open={modal === "view"}
        onClose={() => {
          setModal(null);
          setSelectedFull(null);
        }}
        title={selected?.title ?? "Documento"}
        width={860}
      >
        {selectedFull ? (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                }}
              >
                Informações
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  fontSize: 13,
                }}
              >
                {[
                  [
                    "Tipo",
                    selectedFull.template
                      ? (TEMPLATE_TYPE_LABELS[
                          selectedFull.template.templateType
                        ] ?? "Livre")
                      : "Documento avulso",
                  ],
                  [
                    "Categoria",
                    CATEGORY_LABELS[selectedFull.category] ??
                      selectedFull.category,
                  ],
                  ["Aluno", selectedFull.student?.name ?? "—"],
                  [
                    "Matrícula",
                    selectedFull.enrollment?.enrollmentNumber ?? "—",
                  ],
                  ["Criado por", selectedFull.createdBy?.name ?? "—"],
                  [
                    "Data",
                    new Date(selectedFull.createdAt).toLocaleDateString(
                      "pt-BR",
                    ),
                  ],
                  ...(selectedFull.deliveredAt
                    ? [
                        [
                          "Entregue em",
                          new Date(selectedFull.deliveredAt).toLocaleDateString(
                            "pt-BR",
                          ),
                        ],
                      ]
                    : []),
                  ...(selectedFull.notes
                    ? [["Observações", selectedFull.notes]]
                    : []),
                ].map(([label, value]) => (
                  <div key={label} style={{ display: "flex", gap: 8 }}>
                    <span
                      style={{ fontSize: 12, color: "#6b7280", minWidth: 110 }}
                    >
                      {label}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>
                      {value}
                    </span>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span
                    style={{ fontSize: 12, color: "#6b7280", minWidth: 110 }}
                  >
                    Status
                  </span>
                  <StatusBadge
                    status={selectedFull.status}
                    label={STATUS_LABELS[selectedFull.status]}
                    color={STATUS_COLORS[selectedFull.status] ?? "gray"}
                  />
                </div>
              </div>
              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <PrimaryButton
                  onClick={() =>
                    downloadPdf(selectedFull.id, selectedFull.title)
                  }
                >
                  ⬇ Baixar PDF
                </PrimaryButton>
                {selectedFull.status !== "CANCELADO" &&
                  selectedFull.status !== "ENTREGUE" && (
                    <PrimaryButton
                      variant="ghost"
                      onClick={() => updateStatus(selectedFull.id, "ENTREGUE")}
                    >
                      ✓ Marcar como entregue
                    </PrimaryButton>
                  )}
                {selectedFull.status === "RASCUNHO" && (
                  <PrimaryButton
                    variant="ghost"
                    onClick={() => updateStatus(selectedFull.id, "EMITIDO")}
                  >
                    Marcar como emitido
                  </PrimaryButton>
                )}
              </div>
            </div>
            <div>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                }}
              >
                Preview
              </p>
              <DocumentPreview
                title={selectedFull.title}
                header={selectedFull.headerSnapshot || ""}
                body={selectedFull.bodySnapshot}
                footer={selectedFull.footerSnapshot || ""}
                requiresSignature={false}
                isStructured={STRUCTURED_TYPES.includes(
                  selectedFull.template?.templateType ?? "",
                )}
                templateType={selectedFull.template?.templateType}
              />
            </div>
          </div>
        ) : (
          <p style={{ color: "#9ca3af" }}>Carregando...</p>
        )}
      </Modal>

      {/* DELETE */}
      <Modal
        open={modal === "delete"}
        onClose={() => setModal(null)}
        title="Cancelar documento"
      >
        <p style={{ margin: "0 0 20px", color: "#374151" }}>
          Cancelar <strong>{selected?.title}</strong>?
        </p>
        <ModalFooter>
          <PrimaryButton variant="ghost" onClick={() => setModal(null)}>
            Voltar
          </PrimaryButton>
          <PrimaryButton
            variant="danger"
            onClick={handleDelete}
            loading={saving}
          >
            Cancelar documento
          </PrimaryButton>
        </ModalFooter>
      </Modal>
    </>
  );
}
