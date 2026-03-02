import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../../../utils/api";
import {
  PageShell,
  Card,
  PrimaryButton,
  DataTable,
  Pagination,
  StatusBadge,
  IconButton,
  Modal,
  FormField,
  Select,
  ModalFooter,
  InlineAlert,
  SearchBar,
  toast,
} from "../../../../components/ui";

// ─── Constants ────────────────────────────────────────────────────────────────

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

const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  FREE: "Livre",
  BOLETIM: "Boletim",
  COMPROVANTE_MATRICULA: "Comprovante de Matrícula",
  HISTORICO_ESCOLAR: "Histórico Escolar",
  DECLARACAO_FREQUENCIA: "Declaração de Frequência",
  FICHA_ALUNO: "Ficha do Aluno",
};
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
const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: "Rascunho",
  EMITIDO: "Emitido",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};
const STATUS_COLORS: Record<string, any> = {
  RASCUNHO: "yellow",
  EMITIDO: "blue",
  ENTREGUE: "green",
  CANCELADO: "red",
};

const VARIABLES = [
  { label: "Nome do aluno", value: "{{aluno.nome}}" },
  { label: "CPF do aluno", value: "{{aluno.cpf}}" },
  { label: "Nascimento", value: "{{aluno.nascimento}}" },
  { label: "Mãe", value: "{{aluno.mae}}" },
  { label: "Pai", value: "{{aluno.pai}}" },
  { label: "Nº Matrícula", value: "{{matricula.numero}}" },
  { label: "Turma", value: "{{turma.nome}}" },
  { label: "Série", value: "{{turma.serie}}" },
  { label: "Turno", value: "{{turma.turno}}" },
  { label: "Ano letivo", value: "{{ano.letivo}}" },
  { label: "Responsável", value: "{{responsavel.nome}}" },
  { label: "Nome da escola", value: "{{escola.nome}}" },
  { label: "Endereço", value: "{{escola.endereco}}" },
  { label: "Diretor(a)", value: "{{diretor.nome}}" },
  { label: "Data de hoje", value: "{{data}}" },
  { label: "Data por extenso", value: "{{data.extenso}}" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1.5px solid #e2e8f0",
  fontSize: 13,
  outline: "none",
  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  boxSizing: "border-box",
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([v, l]) => ({
  value: v,
  label: l,
}));
const TEMPLATE_TYPE_OPTIONS = Object.entries(TEMPLATE_TYPE_LABELS).map(
  ([v, l]) => ({ value: v, label: l }),
);

type Tab = "free" | "issued";

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Documents() {
  const [tab, setTab] = useState<Tab>("free");

  const tabs: { key: Tab; label: string }[] = [
    { key: "free", label: "Documentos Livres" },
    { key: "issued", label: "Documentos Emitidos" },
  ];

  return (
    <PageShell
      title="Documentos"
      description="Emissão e gestão de documentos da escola."
    >
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 20,
          borderBottom: "2px solid #f1f5f9",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 20px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontWeight: tab === t.key ? 700 : 400,
              fontSize: 13,
              color: tab === t.key ? "#6366f1" : "#6b7280",
              borderBottom:
                tab === t.key ? "2px solid #6366f1" : "2px solid transparent",
              marginBottom: -2,
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "free" && <FreeDocumentsTab />}
      {tab === "issued" && <IssuedTab />}
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — DOCUMENTOS LIVRES
// ═══════════════════════════════════════════════════════════════════════════════

function FreeDocumentsTab() {
  const [subTab, setSubTab] = useState<"emit" | "templates">("emit");

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { key: "emit", label: "Emitir / Rascunhos" },
          { key: "templates", label: "Templates" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setSubTab(s.key as any)}
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              border: "1.5px solid",
              borderColor: subTab === s.key ? "#6366f1" : "#e2e8f0",
              background: subTab === s.key ? "#eef2ff" : "#fff",
              color: subTab === s.key ? "#4f46e5" : "#6b7280",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
      {subTab === "emit" ? <FreeEmitTab /> : <TemplatesTab />}
    </div>
  );
}

// ─── Free Emit Tab ────────────────────────────────────────────────────────────

function FreeEmitTab() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchStudent, setSearchStudent] = useState("");
  const [statusFilter, setStatusFilter] = useState("RASCUNHO");
  const [modal, setModal] = useState<
    "create" | "edit" | "view" | "delete" | null
  >(null);
  const [selected, setSelected] = useState<any>(null);
  const LIMIT = 20;

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: String(LIMIT),
          templateType: "FREE",
        });
        if (statusFilter) params.set("status", statusFilter);
        if (searchStudent) params.set("studentName", searchStudent);
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
    [statusFilter, searchStudent],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const columns = [
    { key: "title", label: "Título" },
    { key: "student", label: "Aluno" },
    { key: "status", label: "Status" },
    { key: "date", label: "Criado em" },
    { key: "actions", label: "" },
  ];

  const rows = items.map((doc) => [
    <span style={{ fontWeight: 600, fontSize: 13 }}>{doc.title}</span>,
    <span style={{ fontSize: 12 }}>
      {doc.student?.name ?? <span style={{ color: "#9ca3af" }}>—</span>}
    </span>,
    <StatusBadge
      status={doc.status}
      label={STATUS_LABELS[doc.status]}
      color={STATUS_COLORS[doc.status]}
    />,
    <span style={{ fontSize: 12, color: "#6b7280" }}>
      {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
    </span>,
    <div style={{ display: "flex", gap: 4 }}>
      {doc.status === "RASCUNHO" && (
        <IconButton
          icon="edit"
          title="Editar"
          onClick={() => {
            setSelected(doc);
            setModal("edit");
          }}
        />
      )}
      <IconButton
        icon="view"
        title="Ver"
        onClick={() => {
          setSelected(doc);
          setModal("view");
        }}
      />
      {doc.status === "EMITIDO" && (
        <IconButton
          icon="download"
          title="Baixar PDF"
          onClick={() => downloadPdf(doc.id, doc.title)}
        />
      )}
      <IconButton
        icon="delete"
        title="Cancelar"
        onClick={() => {
          setSelected(doc);
          setModal("delete");
        }}
      />
    </div>,
  ]);

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
    } catch (err: any) {
      toast(err?.message || "Erro ao gerar PDF", "error");
    }
  }

  async function handleDelete() {
    if (!selected) return;
    try {
      await api.fetchJson(`/issued-documents/${selected.id}`, {
        method: "DELETE",
      });
      toast("Documento cancelado.");
      setModal(null);
      load(page);
    } catch (err: any) {
      toast(err?.message || "Erro.", "error");
    }
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <PrimaryButton
          onClick={() => {
            setSelected(null);
            setModal("create");
          }}
        >
          + Novo Documento
        </PrimaryButton>
        <SearchBar
          value={searchStudent}
          onChange={setSearchStudent}
          placeholder="Buscar por aluno..."
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ ...inputStyle, width: 160 }}
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          emptyMessage="Nenhum documento encontrado."
        />
        <Pagination page={page} total={total} limit={LIMIT} onChange={load} />
      </Card>

      {(modal === "create" || modal === "edit") && (
        <FreeDocumentEditor
          docId={modal === "edit" ? selected?.id : null}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load(page);
          }}
        />
      )}

      <Modal
        open={modal === "view"}
        onClose={() => setModal(null)}
        title={selected?.title ?? "Documento"}
        width={560}
      >
        {selected && (
          <DocumentViewPanel
            doc={selected}
            onDownload={downloadPdf}
            onClose={() => setModal(null)}
            onStatusChange={() => load(page)}
          />
        )}
      </Modal>

      <Modal
        open={modal === "delete"}
        onClose={() => setModal(null)}
        title="Cancelar documento"
      >
        <p style={{ margin: "0 0 20px", color: "#374151" }}>
          Cancelar <strong>{selected?.title}</strong>? Esta ação não pode ser
          desfeita.
        </p>
        <ModalFooter>
          <PrimaryButton variant="ghost" onClick={() => setModal(null)}>
            Voltar
          </PrimaryButton>
          <PrimaryButton variant="danger" onClick={handleDelete}>
            Cancelar documento
          </PrimaryButton>
        </ModalFooter>
      </Modal>
    </>
  );
}

// ─── Free Document Editor (full-page modal) ───────────────────────────────────

function FreeDocumentEditor({
  docId,
  onClose,
  onSaved,
}: {
  docId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<any>({
    templateId: "",
    studentId: "",
    enrollmentId: "",
    title: "",
    category: "DECLARACAO",
    bodySnapshot: "",
    headerSnapshot: "",
    footerSnapshot: "",
    notes: "",
    signatureLines: [],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [resolvedBody, setResolvedBody] = useState("");
  const [presets, setPresets] = useState<any[]>([]);
  const resolveTimer = useRef<any>(null);
  const insertRef = useRef<((t: string) => void) | null>(null);
  const isEdit = Boolean(docId);

  useEffect(() => {
    loadTemplates();
    loadPresets();
    if (docId) loadDoc(docId);
  }, [docId]);

  async function loadDoc(id: string) {
    setLoading(true);
    try {
      const doc = await api.fetchJson(`/issued-documents/${id}`);
      setForm({
        templateId: doc.templateId ?? "",
        studentId: doc.studentId ?? "",
        enrollmentId: doc.enrollmentId ?? "",
        title: doc.title ?? "",
        category: doc.category ?? "DECLARACAO",
        bodySnapshot: doc.bodySnapshot ?? "",
        headerSnapshot: doc.headerSnapshot ?? "",
        footerSnapshot: doc.footerSnapshot ?? "",
        notes: doc.notes ?? "",
        signatureLines: doc.signatureLines ?? [],
      });
      if (doc.student) setStudents([doc.student]);
      setStudentSearch(doc.student?.name ?? "");
      if (doc.enrollmentId) loadEnrollments(doc.studentId);
      scheduleResolve({ ...doc, bodySnapshot: doc.bodySnapshot ?? "" });
    } catch {
      toast("Erro ao carregar documento", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadTemplates() {
    try {
      const res = await api.fetchJson(
        "/document-templates?active=true&templateType=FREE",
      );
      setTemplates(res?.data ?? []);
    } catch {}
  }

  async function loadPresets() {
    try {
      const res = await api.fetchJson("/document-signature-presets");
      setPresets(res?.data ?? []);
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
    scheduleResolve(next);
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
    }, 500);
  }

  function applyTemplate(templateId: string) {
    if (!templateId) {
      setF({
        templateId: "",
        bodySnapshot: "",
        headerSnapshot: "",
        footerSnapshot: "",
      });
      return;
    }
    const t = templates.find((x) => x.id === templateId);
    if (!t) return;
    setF({
      templateId,
      title: form.title || t.name,
      bodySnapshot: t.bodyTemplate ?? "",
      headerSnapshot: t.headerHtml ?? "",
      footerSnapshot: t.footerHtml ?? "",
      category: t.category ?? "DECLARACAO",
      signatureLines: t.signatureLines ?? form.signatureLines ?? [],
    });
  }

  async function handleSave(emitNow: boolean) {
    if (!form.title.trim()) {
      setError("Título é obrigatório.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = {
        templateId: form.templateId || undefined,
        studentId: form.studentId || undefined,
        enrollmentId: form.enrollmentId || undefined,
        title: form.title,
        category: form.category,
        bodySnapshot: form.bodySnapshot,
        headerSnapshot: form.headerSnapshot || undefined,
        footerSnapshot: form.footerSnapshot || undefined,
        notes: form.notes || undefined,
        signatureLines: form.signatureLines?.length
          ? form.signatureLines
          : undefined,
        emitNow,
      };
      if (isEdit) {
        await api.fetchJson(`/issued-documents/${docId}`, {
          method: "PATCH",
          body: JSON.stringify({ ...body, emitNow }),
        });
        toast(emitNow ? "Documento emitido!" : "Rascunho salvo!");
      } else {
        await api.fetchJson("/issued-documents", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast(emitNow ? "Documento emitido!" : "Rascunho salvo!");
      }
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: 32,
            borderRadius: 16,
            fontSize: 14,
            color: "#6b7280",
          }}
        >
          Carregando...
        </div>
      </div>
    );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "100%",
          maxWidth: 1200,
          display: "flex",
          flexDirection: "column",
          maxHeight: "calc(100vh - 32px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 15, color: "#111827" }}>
            {isEdit ? "Editar documento" : "Novo documento livre"}
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "#f3f4f6",
              borderRadius: 7,
              width: 28,
              height: 28,
              cursor: "pointer",
              color: "#6b7280",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0,
          }}
        >
          {/* Left: Form */}
          <div
            style={{
              padding: "20px 24px",
              borderRight: "1px solid #f1f5f9",
              overflowY: "auto",
            }}
          >
            {error && (
              <div style={{ marginBottom: 12 }}>
                <InlineAlert message={error} type="error" />
              </div>
            )}

            {/* Template selector */}
            <FormField label="Usar template (opcional)">
              <select
                value={form.templateId}
                onChange={(e) => applyTemplate(e.target.value)}
                style={inputStyle}
              >
                <option value="">— Começar em branco —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </FormField>

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
                  placeholder="Ex: Declaração de Matrícula"
                />
              </FormField>
              <FormField label="Categoria">
                <select
                  value={form.category}
                  onChange={(e) => setF({ category: e.target.value })}
                  style={inputStyle}
                >
                  {CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* Student search */}
            <FormField label="Aluno">
              <div style={{ position: "relative" }}>
                <input
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    searchStudents(e.target.value);
                    if (!e.target.value)
                      setF({ studentId: "", enrollmentId: "" });
                  }}
                  style={inputStyle}
                  placeholder="Buscar aluno por nome..."
                />
                {students.length > 0 && !form.studentId && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "#fff",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: 8,
                      zIndex: 10,
                      maxHeight: 180,
                      overflowY: "auto",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    {students.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setF({ studentId: s.id, enrollmentId: "" });
                          setStudentSearch(s.name);
                          loadEnrollments(s.id);
                          setStudents([]);
                        }}
                        style={{
                          padding: "9px 12px",
                          cursor: "pointer",
                          fontSize: 13,
                          borderBottom: "1px solid #f1f5f9",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#f8fafc")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        {s.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormField>

            {enrollments.length > 0 && (
              <FormField label="Matrícula">
                <select
                  value={form.enrollmentId}
                  onChange={(e) => setF({ enrollmentId: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">— Selecionar matrícula —</option>
                  {enrollments.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.enrollmentNumber} — {e.classroom?.name} (
                      {e.academicYear?.year})
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            {/* Body */}
            <FormField label="Corpo do documento">
              <VariableChips onInsert={(v) => insertRef.current?.(v)} />
              <RichEditor
                value={form.bodySnapshot}
                onChange={(v) => setF({ bodySnapshot: v })}
                placeholder="Texto do documento... Use variáveis acima para inserir dados dinâmicos."
                minHeight={200}
                onInsert={(fn) => {
                  insertRef.current = fn;
                }}
              />
            </FormField>

            {/* Signatures */}
            <SignatureBuilder
              lines={form.signatureLines ?? []}
              presets={presets}
              onChange={(lines) => setF({ signatureLines: lines })}
            />

            <FormField label="Observações internas (não aparecem no documento)">
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
                placeholder="Anotações da secretaria..."
              />
            </FormField>
          </div>

          {/* Right: Preview */}
          <div
            style={{
              padding: "20px 24px",
              background: "#f8fafc",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#6b7280",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Preview em tempo real
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <DocumentPreview
                title={form.title}
                body={resolvedBody || form.bodySnapshot}
                header={form.headerSnapshot}
                footer={form.footerSnapshot}
                signatures={form.signatureLines ?? []}
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          <PrimaryButton variant="ghost" onClick={onClose}>
            Cancelar
          </PrimaryButton>
          <PrimaryButton
            variant="ghost"
            onClick={() => handleSave(false)}
            loading={saving}
          >
            💾 Salvar rascunho
          </PrimaryButton>
          <PrimaryButton onClick={() => handleSave(true)} loading={saving}>
            ✅ Emitir documento
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

// ─── Document Preview ─────────────────────────────────────────────────────────

function DocumentPreview({
  title,
  body,
  header,
  footer,
  signatures,
}: {
  title: string;
  body: string;
  header?: string;
  footer?: string;
  signatures?: any[];
}) {
  const [schoolConfig, setSchoolConfig] = useState<any>(null);
  const lines = Array.isArray(signatures)
    ? signatures.map((s: any) => (typeof s === "string" ? s : (s.label ?? "")))
    : [];

  useEffect(() => {
    // Fetch school config for header/footer
    api
      .fetchJson("/schools/me/document-config")
      .then((cfg) => {
        if (cfg) setSchoolConfig(cfg);
      })
      .catch(() => {});
  }, []);

  // Build header from school config
  const renderHeader = () => {
    // If custom header provided (from template), use it
    if (header?.trim()) {
      return (
        <div
          dangerouslySetInnerHTML={{ __html: header }}
          style={{
            marginBottom: 12,
            paddingBottom: 10,
            borderBottom: "1px solid #e5e7eb",
            fontSize: 10,
            color: "#374151",
          }}
        />
      );
    }

    // Otherwise use school config
    const sc = schoolConfig;
    if (!sc?.displayName) {
      return (
        <div
          style={{
            marginBottom: 12,
            paddingBottom: 10,
            borderBottom: "1px solid #e5e7eb",
            textAlign: "center",
            color: "#6b7280",
            fontSize: 9,
          }}
        >
          [Cabeçalho da escola]
        </div>
      );
    }

    return (
      <div
        style={{
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: "1px solid #e5e7eb",
          fontSize: 10,
          color: "#374151",
          textAlign: "center",
        }}
      >
        {sc.logoUrl && (
          <img
            src={sc.logoUrl}
            alt="Logo"
            style={{
              maxHeight: 50,
              maxWidth: 150,
              marginBottom: 8,
              display: "block",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          />
        )}
        <div style={{ fontWeight: 700, fontSize: 11 }}>{sc.displayName}</div>
        {sc.address && <div>{sc.address}</div>}
        {(sc.phone || sc.contactEmail) && (
          <div>
            {sc.phone}
            {sc.phone && sc.contactEmail && " | "}
            {sc.contactEmail}
          </div>
        )}
      </div>
    );
  };

  // Build footer from school config
  const renderFooter = () => {
    // If custom footer provided (from template), use it
    if (footer?.trim()) {
      return <span dangerouslySetInnerHTML={{ __html: footer }} />;
    }

    // Otherwise use school config
    const sc = schoolConfig;
    if (!sc?.footerDefault) {
      return "[Rodapé padrão da escola]";
    }

    return sc.footerDefault;
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 6,
        padding: "28px 32px",
        minHeight: 600,
        fontFamily: "Georgia, serif",
        fontSize: 11,
        lineHeight: 1.7,
        color: "#111827",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      {renderHeader()}

      {/* Title */}
      {title && (
        <div
          style={{
            textAlign: "center",
            fontWeight: 700,
            fontSize: 13,
            marginBottom: 20,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {title}
        </div>
      )}

      {/* Body */}
      <div
        dangerouslySetInnerHTML={{
          __html:
            body ||
            '<span style="color:#d1d5db">Conteúdo do documento aparece aqui...</span>',
        }}
        style={{ minHeight: 300 }}
      />

      {/* Signatures */}
      {lines.length > 0 && (
        <div
          style={{
            marginTop: 48,
            display: "grid",
            gridTemplateColumns: `repeat(${lines.length}, 1fr)`,
            gap: 16,
          }}
        >
          {lines.map((label, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div
                style={{
                  borderTop: "1px solid #374151",
                  paddingTop: 6,
                  fontSize: 9,
                  color: "#6b7280",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: 32,
          paddingTop: 8,
          borderTop: "1px solid #e5e7eb",
          fontSize: 9,
          color: "#9ca3af",
          textAlign: "center",
        }}
      >
        {renderFooter()}
      </div>
    </div>
  );
}

// ─── Variable Chips ───────────────────────────────────────────────────────────

function VariableChips({ onInsert }: { onInsert: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 8 }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          fontSize: 11,
          color: "#4f46e5",
          background: "#eef2ff",
          border: "1px solid #c7d2fe",
          borderRadius: 6,
          padding: "3px 10px",
          cursor: "pointer",
          marginBottom: 4,
        }}
      >
        {open ? "▲" : "▼"} Inserir variável
      </button>
      {open && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            padding: "8px",
            background: "#f8fafc",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
          }}
        >
          {VARIABLES.map((v) => (
            <button
              key={v.value}
              type="button"
              onClick={() => {
                onInsert(v.value);
              }}
              title={v.label}
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
              {v.value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Signature Builder ────────────────────────────────────────────────────────

function SignatureBuilder({
  lines,
  presets,
  onChange,
}: {
  lines: any[];
  presets: any[];
  onChange: (v: any[]) => void;
}) {
  const [newLabel, setNewLabel] = useState("");

  function add(label: string) {
    if (!label.trim()) return;
    onChange([...lines, { label: label.trim() }]);
    setNewLabel("");
  }

  function remove(i: number) {
    onChange(lines.filter((_, idx) => idx !== i));
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#374151",
          marginBottom: 8,
        }}
      >
        Linhas de assinatura
      </div>

      {lines.length > 0 && (
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}
        >
          {lines.map((line, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "#f1f5f9",
                borderRadius: 20,
                padding: "3px 10px",
                fontSize: 12,
              }}
            >
              <span>{line.label ?? line}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  fontSize: 14,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {presets.length > 0 && (
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}
        >
          <span style={{ fontSize: 11, color: "#9ca3af", alignSelf: "center" }}>
            Presets:
          </span>
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => add(p.label)}
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 20,
                border: "1px solid #e2e8f0",
                background: "#fff",
                cursor: "pointer",
                color: "#374151",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(newLabel);
            }
          }}
          style={{ ...inputStyle, flex: 1 }}
          placeholder="Ex: Secretária, Diretor(a), Responsável..."
        />
        <PrimaryButton
          onClick={() => add(newLabel)}
          style={{ whiteSpace: "nowrap" }}
        >
          + Adicionar
        </PrimaryButton>
      </div>
    </div>
  );
}

// ─── Document View Panel ──────────────────────────────────────────────────────

function DocumentViewPanel({ doc, onDownload, onClose, onStatusChange }: any) {
  const [full, setFull] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .fetchJson(`/issued-documents/${doc.id}`)
      .then(setFull)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [doc.id]);

  async function changeStatus(status: string) {
    try {
      await api.fetchJson(`/issued-documents/${doc.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast(`Status atualizado: ${STATUS_LABELS[status]}`);
      onStatusChange();
      setFull((f: any) => (f ? { ...f, status } : f));
    } catch (err: any) {
      toast(err?.message || "Erro", "error");
    }
  }

  if (loading)
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
        Carregando...
      </div>
    );
  if (!full) return null;

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <span style={{ fontSize: 11, color: "#6b7280" }}>Status</span>
          <br />
          <StatusBadge
            status={full.status}
            label={STATUS_LABELS[full.status]}
            color={STATUS_COLORS[full.status]}
          />
        </div>
        <div>
          <span style={{ fontSize: 11, color: "#6b7280" }}>Categoria</span>
          <br />
          <span style={{ fontSize: 13 }}>
            {CATEGORY_LABELS[full.category] ?? full.category}
          </span>
        </div>
        <div>
          <span style={{ fontSize: 11, color: "#6b7280" }}>Aluno</span>
          <br />
          <span style={{ fontSize: 13 }}>{full.student?.name ?? "—"}</span>
        </div>
        <div>
          <span style={{ fontSize: 11, color: "#6b7280" }}>Criado por</span>
          <br />
          <span style={{ fontSize: 13 }}>{full.createdBy?.name ?? "—"}</span>
        </div>
        {full.emittedAt && (
          <div>
            <span style={{ fontSize: 11, color: "#6b7280" }}>Emitido em</span>
            <br />
            <span style={{ fontSize: 13 }}>
              {new Date(full.emittedAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
        )}
        {full.notes && (
          <div style={{ gridColumn: "1 / -1" }}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>Observações</span>
            <br />
            <span style={{ fontSize: 13 }}>{full.notes}</span>
          </div>
        )}
      </div>

      <ModalFooter>
        {full.status === "EMITIDO" && (
          <PrimaryButton
            variant="ghost"
            onClick={() => changeStatus("ENTREGUE")}
          >
            Marcar como entregue
          </PrimaryButton>
        )}
        {full.status !== "CANCELADO" && (
          <PrimaryButton onClick={() => onDownload(full.id, full.title)}>
            ⬇ Baixar PDF
          </PrimaryButton>
        )}
      </ModalFooter>
    </div>
  );
}

// ─── Rich Editor ──────────────────────────────────────────────────────────────

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
  const lastValue = useRef(value);

  useEffect(() => {
    if (editorRef.current && value !== lastValue.current) {
      const sel = document.getSelection();
      const hasFocus = editorRef.current.contains(sel?.anchorNode ?? null);
      if (!hasFocus) {
        editorRef.current.innerHTML = value;
        lastValue.current = value;
      }
    }
  }, [value]);

  function execCmd(cmd: string, arg?: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, arg);
    const v = editorRef.current?.innerHTML || "";
    lastValue.current = v;
    onChange(v);
  }

  function insertText(text: string) {
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, text);
    const v = editorRef.current?.innerHTML || "";
    lastValue.current = v;
    onChange(v);
  }

  if (onInsert) onInsert(insertText);

  const btn = (label: string, cmd: string, arg?: string, title?: string) => (
    <button
      type="button"
      title={title ?? label}
      onClick={() => execCmd(cmd, arg)}
      style={{
        border: "1px solid #e2e8f0",
        background: "#fff",
        borderRadius: 5,
        padding: "3px 7px",
        cursor: "pointer",
        fontSize: 11,
        color: "#374151",
        fontWeight: cmd === "bold" ? 700 : 400,
        fontStyle: cmd === "italic" ? "italic" : "normal",
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
          gap: 3,
          padding: "5px 8px",
          background: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {btn("N", "bold", undefined, "Negrito")}
        {btn("I", "italic", undefined, "Itálico")}
        {btn("S̲", "underline", undefined, "Sublinhado")}
        <span
          style={{
            width: 1,
            background: "#e2e8f0",
            height: 16,
            margin: "0 2px",
          }}
        />
        {btn("⬅", "justifyLeft", undefined, "Alinhar à esquerda")}
        {btn("≡", "justifyCenter", undefined, "Centralizar")}
        {btn("➡", "justifyRight", undefined, "Alinhar à direita")}
        {btn("⇔", "justifyFull", undefined, "Justificar")}
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
        <span
          style={{
            width: 1,
            background: "#e2e8f0",
            height: 16,
            margin: "0 2px",
          }}
        />
        <select
          onChange={(e) => execCmd("fontSize", e.target.value)}
          defaultValue=""
          style={{
            fontSize: 10,
            border: "1px solid #e2e8f0",
            borderRadius: 4,
            padding: "2px 4px",
            background: "#fff",
          }}
        >
          <option value="" disabled>
            Tamanho
          </option>
          {["1", "2", "3", "4", "5", "6", "7"].map((s) => (
            <option key={s} value={s}>
              {["8", "10", "12", "14", "16", "20", "24"][+s - 1]}pt
            </option>
          ))}
        </select>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          const v = editorRef.current?.innerHTML || "";
          lastValue.current = v;
          onChange(v);
        }}
        style={{
          minHeight,
          padding: "10px 12px",
          fontSize: 13,
          lineHeight: 1.8,
          outline: "none",
        }}
        data-placeholder={placeholder}
      />
      <style>{`[contenteditable]:empty:before{content:attr(data-placeholder);color:#9ca3af}`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — DOCUMENTOS EMITIDOS
// ═══════════════════════════════════════════════════════════════════════════════

function IssuedTab() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [modal, setModal] = useState<"view" | "config" | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const LIMIT = 20;

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
        if (studentSearch) params.set("studentName", studentSearch);
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        const res = await api.fetchJson(`/issued-documents?${params}`);
        setItems(res?.data ?? []);
        setTotal(res?.meta?.total ?? 0);
        setPage(p);
      } catch {
        toast("Erro ao carregar", "error");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, categoryFilter, studentSearch, dateFrom, dateTo],
  );

  useEffect(() => {
    load(1);
  }, [load]);

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
    } catch (err: any) {
      toast(err?.message || "Erro ao gerar PDF", "error");
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
    <span
      style={{
        fontSize: 11,
        color: "#6b7280",
        background: "#f1f5f9",
        padding: "2px 7px",
        borderRadius: 12,
      }}
    >
      {TEMPLATE_TYPE_LABELS[
        doc.template?.templateType ?? doc.templateTypeSaved ?? "FREE"
      ] ?? "Livre"}
    </span>,
    <span style={{ fontSize: 12 }}>
      {doc.student?.name ?? <span style={{ color: "#9ca3af" }}>—</span>}
    </span>,
    <StatusBadge
      status={doc.status}
      label={STATUS_LABELS[doc.status]}
      color={STATUS_COLORS[doc.status]}
    />,
    <span style={{ fontSize: 12, color: "#6b7280" }}>
      {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
    </span>,
    <div style={{ display: "flex", gap: 4 }}>
      <IconButton
        icon="view"
        title="Ver"
        onClick={() => {
          setSelected(doc);
          setModal("view");
        }}
      />
      {doc.status !== "CANCELADO" && (
        <IconButton
          icon="download"
          title="Baixar PDF"
          onClick={() => downloadPdf(doc.id, doc.title)}
        />
      )}
    </div>,
  ]);

  return (
    <>
      {/* Config school button */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 12,
        }}
      >
        <PrimaryButton variant="ghost" onClick={() => setModal("config")}>
          ⚙ Configuração da Escola
        </PrimaryButton>
      </div>

      {/* Filters */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}
      >
        <SearchBar
          value={studentSearch}
          onChange={setStudentSearch}
          placeholder="Buscar por aluno..."
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ ...inputStyle, width: 150 }}
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ ...inputStyle, width: 160 }}
        >
          <option value="">Todas categorias</option>
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          style={{ ...inputStyle, width: 140 }}
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          style={{ ...inputStyle, width: 140 }}
        />
      </div>

      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          emptyMessage="Nenhum documento emitido."
        />
        <Pagination page={page} total={total} limit={LIMIT} onChange={load} />
      </Card>

      <Modal
        open={modal === "view"}
        onClose={() => setModal(null)}
        title={selected?.title ?? "Documento"}
        width={560}
      >
        {selected && (
          <DocumentViewPanel
            doc={selected}
            onDownload={downloadPdf}
            onClose={() => setModal(null)}
            onStatusChange={() => load(page)}
          />
        )}
      </Modal>

      <Modal
        open={modal === "config"}
        onClose={() => setModal(null)}
        title="Configuração da Escola — Documentos"
        width={560}
      >
        <SchoolDocumentConfig onClose={() => setModal(null)} />
      </Modal>
    </>
  );
}

// ─── School Document Config ───────────────────────────────────────────────────

function SchoolDocumentConfig({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    displayName: "",
    address: "",
    phone: "",
    contactEmail: "",
    website: "",
    directorName: "",
    directorTitle: "Diretor(a)",
    logoUrl: "",
    headerHtml: "",
    footerHtml: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .fetchJson("/schools/me/document-config")
      .then((cfg: any) => {
        if (cfg)
          setForm({
            displayName: cfg.displayName ?? "",
            address: cfg.address ?? "",
            phone: cfg.phone ?? "",
            contactEmail: cfg.contactEmail ?? "",
            website: cfg.website ?? "",
            directorName: cfg.directorName ?? "",
            directorTitle: cfg.directorTitle ?? "Diretor(a)",
            logoUrl: cfg.logoUrl ?? "",
            headerHtml: cfg.headerHtml ?? "",
            footerHtml: cfg.footerHtml ?? "",
          });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await api.fetchJson("/schools/me/document-config", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      toast("Configurações salvas!");
      onClose();
    } catch (err: any) {
      toast(err?.message || "Erro", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div style={{ padding: 20, color: "#6b7280", textAlign: "center" }}>
        Carregando...
      </div>
    );

  const setF = (p: any) => setForm((f) => ({ ...f, ...p }));

  const SCHOOL_VARS = [
    { label: "Nome da escola", value: "{{escola.nome}}" },
    { label: "Endereço", value: "{{escola.endereco}}" },
    { label: "Telefone", value: "{{escola.telefone}}" },
    { label: "E-mail", value: "{{escola.email}}" },
    { label: "Site", value: "{{escola.site}}" },
    { label: "Diretor(a)", value: "{{escola.diretor}}" },
    { label: "Data atual", value: "{{data.hoje}}" },
  ];

  return (
    <div>
      <div
        style={{
          background: "#eef2ff",
          border: "1px solid #c7d2fe",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 16,
          fontSize: 12,
          color: "#4338ca",
        }}
      >
        Configure as informações e o layout padrão do cabeçalho e rodapé dos
        documentos emitidos.
      </div>

      {/* Dados da escola */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#374151",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        Dados da Escola
      </div>
      <FormField label="Nome de exibição">
        <input
          value={form.displayName}
          onChange={(e) => setF({ displayName: e.target.value })}
          style={inputStyle}
          placeholder="Nome oficial para documentos"
        />
      </FormField>
      <FormField label="URL do Logo">
        <input
          value={form.logoUrl}
          onChange={(e) => setF({ logoUrl: e.target.value })}
          style={inputStyle}
          placeholder="https://..."
        />
      </FormField>
      <FormField label="Endereço completo">
        <input
          value={form.address}
          onChange={(e) => setF({ address: e.target.value })}
          style={inputStyle}
        />
      </FormField>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Telefone">
          <input
            value={form.phone}
            onChange={(e) => setF({ phone: e.target.value })}
            style={inputStyle}
          />
        </FormField>
        <FormField label="E-mail">
          <input
            value={form.contactEmail}
            onChange={(e) => setF({ contactEmail: e.target.value })}
            style={inputStyle}
          />
        </FormField>
        <FormField label="Diretor(a)">
          <input
            value={form.directorName}
            onChange={(e) => setF({ directorName: e.target.value })}
            style={inputStyle}
          />
        </FormField>
        <FormField label="Cargo">
          <input
            value={form.directorTitle}
            onChange={(e) => setF({ directorTitle: e.target.value })}
            style={inputStyle}
          />
        </FormField>
      </div>

      {/* Cabeçalho customizável */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#374151",
          margin: "16px 0 8px",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        Cabeçalho dos Documentos
      </div>
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 6,
          padding: "8px 12px",
          marginBottom: 8,
          fontSize: 11,
          color: "#6b7280",
        }}
      >
        Deixe em branco para usar o cabeçalho automático com logo e dados da
        escola. Use variáveis:&nbsp;
        {SCHOOL_VARS.slice(0, 4).map((v) => (
          <code
            key={v.value}
            style={{
              background: "#e0e7ff",
              color: "#4338ca",
              borderRadius: 3,
              padding: "1px 5px",
              margin: "0 2px",
              cursor: "pointer",
              fontSize: 10,
            }}
            onClick={() =>
              setF({ headerHtml: (form.headerHtml || "") + v.value })
            }
          >
            {v.value}
          </code>
        ))}
      </div>
      <RichEditor
        value={form.headerHtml}
        onChange={(v) => setF({ headerHtml: v })}
        minHeight={80}
        placeholder="Cabeçalho personalizado (opcional)..."
      />

      {/* Rodapé customizável */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#374151",
          margin: "16px 0 8px",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        Rodapé dos Documentos
      </div>
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 6,
          padding: "8px 12px",
          marginBottom: 8,
          fontSize: 11,
          color: "#6b7280",
        }}
      >
        Texto exibido no rodapé de todos os documentos. Variáveis
        disponíveis:&nbsp;
        {SCHOOL_VARS.map((v) => (
          <code
            key={v.value}
            style={{
              background: "#e0e7ff",
              color: "#4338ca",
              borderRadius: 3,
              padding: "1px 5px",
              margin: "0 2px",
              cursor: "pointer",
              fontSize: 10,
            }}
            onClick={() =>
              setF({ footerHtml: (form.footerHtml || "") + v.value })
            }
          >
            {v.value}
          </code>
        ))}
      </div>
      <RichEditor
        value={form.footerHtml}
        onChange={(v) => setF({ footerHtml: v })}
        minHeight={60}
        placeholder="Ex: Documento emitido pela Secretaria de {{escola.nome}}. Válido mediante assinatura."
      />

      <ModalFooter>
        <PrimaryButton variant="ghost" onClick={onClose}>
          Cancelar
        </PrimaryButton>
        <PrimaryButton onClick={handleSave} loading={saving}>
          Salvar configurações
        </PrimaryButton>
      </ModalFooter>
    </div>
  );
}

// ─── Templates Tab (dentro de Documentos Livres) ──────────────────────────────

function TemplatesTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [presets, setPresets] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    name: "",
    category: "DECLARACAO",
    description: "",
    headerHtml: "",
    footerHtml: "",
    bodyTemplate: "",
    showLogo: true,
    requiresSignature: false,
    active: true,
    signatureLines: [],
  });
  const insertRef = useRef<((t: string) => void) | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.fetchJson("/document-templates?templateType=FREE");
      setItems(res?.data ?? []);
    } catch {
      toast("Erro ao carregar templates", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    loadPresets();
  }, [load]);

  async function loadPresets() {
    try {
      const res = await api.fetchJson("/document-signature-presets");
      setPresets(res?.data ?? []);
    } catch {}
  }

  function setF(patch: any) {
    setForm((f: any) => ({ ...f, ...patch }));
  }

  function openCreate() {
    setForm({
      name: "",
      category: "DECLARACAO",
      description: "",
      headerHtml: "",
      footerHtml: "",
      bodyTemplate: "",
      showLogo: true,
      requiresSignature: false,
      active: true,
      signatureLines: [],
    });
    setError("");
    setModal("create");
  }

  function openEdit(item: any) {
    setForm({
      name: item.name,
      category: item.category,
      description: item.description ?? "",
      headerHtml: item.headerHtml ?? "",
      footerHtml: item.footerHtml ?? "",
      bodyTemplate: item.bodyTemplate ?? "",
      showLogo: item.showLogo,
      requiresSignature: item.requiresSignature,
      active: item.active,
      signatureLines: item.signatureLines ?? [],
    });
    setError("");
    setSelected(item);
    setModal("edit");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) {
      setError("Nome é obrigatório.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = { ...form, templateType: "FREE" };
      if (modal === "create") {
        await api.fetchJson("/document-templates", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast("Template criado!");
      } else {
        await api.fetchJson(`/document-templates/${selected.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast("Template atualizado!");
      }
      setModal(null);
      load();
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar.");
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

  async function handleDuplicate(id: string) {
    try {
      await api.fetchJson(`/document-templates/${id}/duplicate`, {
        method: "POST",
      });
      toast("Template duplicado!");
      load();
    } catch (err: any) {
      toast(err?.message || "Erro.", "error");
    }
  }

  const columns = [
    { key: "name", label: "Nome" },
    { key: "cat", label: "Categoria" },
    { key: "status", label: "Status" },
    { key: "actions", label: "" },
  ];
  const rows = items.map((item) => [
    <span style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</span>,
    <span style={{ fontSize: 12, color: "#6b7280" }}>
      {CATEGORY_LABELS[item.category] ?? item.category}
    </span>,
    <StatusBadge
      status={item.active ? "active" : "inactive"}
      label={item.active ? "Ativo" : "Inativo"}
      color={item.active ? "green" : "gray"}
    />,
    <div style={{ display: "flex", gap: 4 }}>
      <IconButton
        icon="edit"
        title="Editar"
        onClick={() => openEdit(item)}
      />
      <IconButton
        icon="copy"
        title="Duplicar"
        onClick={() => handleDuplicate(item.id)}
      />
      <IconButton
        icon="delete"
        title="Remover"
        onClick={() => {
          setSelected(item);
          setModal("delete");
        }}
      />
    </div>,
  ]);

  const isOpen = modal === "create" || modal === "edit";

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 12,
        }}
      >
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
          modal === "create"
            ? "Novo template livre"
            : `Editar — ${selected?.name}`
        }
        width={960}
      >
        <form onSubmit={handleSave}>
          {error && (
            <div style={{ marginBottom: 12 }}>
              <InlineAlert message={error} type="error" />
            </div>
          )}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
          >
            <div style={{ overflowY: "auto", maxHeight: "70vh" }}>
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
                  />
                </FormField>
                <FormField label="Categoria">
                  <select
                    value={form.category}
                    onChange={(e) => setF({ category: e.target.value })}
                    style={inputStyle}
                  >
                    {CATEGORY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
              <FormField label="Descrição">
                <input
                  value={form.description}
                  onChange={(e) => setF({ description: e.target.value })}
                  style={inputStyle}
                  placeholder="Uso interno..."
                />
              </FormField>
              <FormField label="Corpo do documento">
                <VariableChips onInsert={(v) => insertRef.current?.(v)} />
                <RichEditor
                  value={form.bodyTemplate}
                  onChange={(v) => setF({ bodyTemplate: v })}
                  placeholder="Texto do template..."
                  minHeight={200}
                  onInsert={(fn) => {
                    insertRef.current = fn;
                  }}
                />
              </FormField>
              <SignatureBuilder
                lines={form.signatureLines ?? []}
                presets={presets}
                onChange={(lines) => setF({ signatureLines: lines })}
              />
              <details>
                <summary
                  style={{ fontSize: 12, color: "#6b7280", cursor: "pointer" }}
                >
                  Cabeçalho / Rodapé
                </summary>
                <div style={{ marginTop: 8 }}>
                  <FormField label="Cabeçalho">
                    <RichEditor
                      value={form.headerHtml}
                      onChange={(v) => setF({ headerHtml: v })}
                      minHeight={60}
                    />
                  </FormField>
                  <FormField label="Rodapé">
                    <RichEditor
                      value={form.footerHtml}
                      onChange={(v) => setF({ footerHtml: v })}
                      minHeight={60}
                    />
                  </FormField>
                </div>
              </details>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Preview
              </div>
              <DocumentPreview
                title={form.name}
                body={form.bodyTemplate}
                header={form.headerHtml}
                footer={form.footerHtml}
                signatures={form.signatureLines}
              />
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
          Remover <strong>{selected?.name}</strong>? Esta ação não pode ser
          desfeita.
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

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function EditIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
