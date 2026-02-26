import React, { useEffect, useState, useCallback } from "react";
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

const STATUS_LABELS: Record<string, string> = {
  ATIVA: "Ativa",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
  TRANSFERIDA: "Transferida",
  SUSPENSA: "Suspensa",
  TRANCADA: "Trancada",
};
const STATUS_COLORS: Record<
  string,
  "green" | "blue" | "red" | "yellow" | "gray" | "purple"
> = {
  ATIVA: "green",
  CONCLUIDA: "blue",
  CANCELADA: "red",
  TRANSFERIDA: "yellow",
  SUSPENSA: "yellow",
  TRANCADA: "gray",
};
const STATUS_UPDATE_OPTIONS = [
  { value: "ATIVA", label: "Ativa" },
  { value: "CANCELADA", label: "Cancelada" },
  { value: "SUSPENSA", label: "Suspensa" },
  { value: "TRANCADA", label: "Trancada" },
  { value: "TRANSFERIDA", label: "Transferida" },
  { value: "CONCLUIDA", label: "Concluída" },
];

type Enrollment = {
  id: string;
  enrollmentNumber: string;
  status: string;
  enrolledAt: string;
  student?: { name: string; cpf?: string };
  classroom?: { name: string };
  academicYear?: { year: number };
  financialResponsibleGuardian?: { id: string; name: string; phone?: string };
};
type Student = { id: string; name: string; cpf?: string };
type Classroom = { id: string; name: string };
type AcademicYear = { id: string; year: number };

const DOC_TYPE_OPTIONS = [
  { value: "RG", label: "RG" },
  { value: "CPF", label: "CPF" },
  { value: "CERTIDAO_NASCIMENTO", label: "Certidão de Nascimento" },
  { value: "COMPROVANTE_RESIDENCIA", label: "Comprovante de Residência" },
  { value: "HISTORICO_ESCOLAR", label: "Histórico Escolar" },
  { value: "LAUDO_MEDICO", label: "Laudo Médico" },
  { value: "FOTO", label: "Foto" },
  { value: "OUTRO", label: "Outro" },
];

export default function Enrollments() {
  const [items, setItems] = useState<Enrollment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ATIVA");
  const [modal, setModal] = useState<"create" | "status" | "details" | null>(
    null,
  );
  const [selected, setSelected] = useState<Enrollment | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [financialOptions, setFinancialOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [loadingFinancial, setLoadingFinancial] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [docForm, setDocForm] = useState({
    type: "",
    name: "",
    delivered: false,
    notes: "",
  });
  const [form, setForm] = useState({
    studentId: "",
    classroomId: "",
    academicYearId: "",
    financialResponsibleGuardianId: "",
  });
  const LIMIT = 20;

  const load = useCallback(
    async (p = 1, searchTerm = search) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: String(LIMIT),
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(searchTerm ? { search: searchTerm } : {}),
        });
        const res = await api.fetchJson(`/enrollments?${params}`);
        const data = res?.data ?? res ?? [];
        setItems(data);
        setTotal(res?.meta?.total ?? data.length);
        setPage(p);
      } catch (e: any) {
        toast(e?.message || "Erro ao carregar matrículas", "error");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, search],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  useEffect(() => {
    async function loadRefs() {
      try {
        const [s, c, y] = await Promise.all([
          api.fetchJson("/students?limit=200"),
          api.fetchJson("/classrooms?limit=100"),
          api.fetchJson("/academic-years?limit=20"),
        ]);
        setStudents(
          (s?.data ?? s ?? []).map((x: any) => ({
            id: x.id,
            name: x.name,
          })),
        );
        setClassrooms(
          (c?.data ?? c ?? []).map((x: any) => ({ id: x.id, name: x.name })),
        );
        // BUG-12: Filter years to show only EM_ANDAMENTO or PLANEJAMENTO
        const filteredYears = (y?.data ?? y ?? []).filter(
          (x: any) =>
            x.status === "EM_ANDAMENTO" || x.status === "PLANEJAMENTO",
        );
        setYears(filteredYears.map((x: any) => ({ id: x.id, year: x.year })));
      } catch {}
    }
    loadRefs();
  }, []);

  useEffect(() => {
    async function loadFinancialGuardians() {
      if (modal !== "create" || !form.studentId) {
        setFinancialOptions([]);
        return;
      }
      setLoadingFinancial(true);
      try {
        const res = await api.fetchJson(
          `/students/${form.studentId}/guardians`,
        );
        const links = res?.data ?? [];
        const opts = (links as any[])
          .filter((l) => l?.isFinancialResponsible)
          .map((l) => ({
            value: l.guardian?.id,
            label: l.guardian?.name ?? "—",
          }))
          .filter((o) => o.value);
        setFinancialOptions(opts);
        setForm((f) => ({
          ...f,
          financialResponsibleGuardianId:
            f.financialResponsibleGuardianId &&
            opts.some((o) => o.value === f.financialResponsibleGuardianId)
              ? f.financialResponsibleGuardianId
              : opts.length === 1
                ? opts[0].value
                : "",
        }));
      } catch {
        setFinancialOptions([]);
      } finally {
        setLoadingFinancial(false);
      }
    }
    loadFinancialGuardians();
  }, [modal, form.studentId]);

  const filtered = items.filter(
    (e) =>
      !search ||
      (e.student?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.enrollmentNumber || "").toLowerCase().includes(search.toLowerCase()),
  );

  function openCreate() {
    setForm({
      studentId: "",
      classroomId: "",
      academicYearId: "",
      financialResponsibleGuardianId: "",
    });
    setFormError("");
    setModal("create");
  }

  function openStatus(e: Enrollment) {
    setSelected(e);
    setNewStatus(e.status);
    setModal("status");
  }

  async function handleCreate(ev: React.FormEvent) {
    ev.preventDefault();
    if (
      !form.studentId ||
      !form.classroomId ||
      !form.academicYearId ||
      !form.financialResponsibleGuardianId
    ) {
      setFormError("Todos os campos são obrigatórios.");
      return;
    }
    if (financialOptions.length === 0) {
      setFormError(
        "Nenhum responsável financeiro disponível. Marque um responsável como financeiro no aluno antes de matricular.",
      );
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await api.fetchJson("/enrollments", {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast("Matrícula criada!");
      setModal(null);
      load(1);
    } catch (e: any) {
      setFormError(e?.message || "Erro ao matricular.");
    } finally {
      setSaving(false);
    }
  }

  async function openDetails(e: Enrollment) {
    setSelected(e);
    setModal("details");
    setFormError("");
    setDocs([]);
    setHistory([]);
    setDetailsLoading(true);
    try {
      const [dRes, hRes] = await Promise.all([
        api.fetchJson(`/enrollments/${e.id}/documents`),
        api.fetchJson(`/enrollments/${e.id}/history`),
      ]);
      setDocs(dRes?.data ?? []);
      setHistory(hRes?.data ?? []);
    } catch (err: any) {
      toast(err?.message || "Erro ao carregar detalhes", "error");
    } finally {
      setDetailsLoading(false);
    }
  }

  async function toggleDocDelivered(docId: string, delivered: boolean) {
    if (!selected) return;
    try {
      const updated = await api.fetchJson(
        `/enrollments/${selected.id}/documents/${docId}`,
        { method: "PATCH", body: JSON.stringify({ delivered }) },
      );
      setDocs((s) => s.map((d) => (d.id === docId ? updated : d)));
    } catch (e: any) {
      toast(e?.message || "Erro ao atualizar documento", "error");
    }
  }

  async function addDocument() {
    if (!selected) return;
    if (!docForm.type || !docForm.name) {
      toast("Tipo e nome do documento são obrigatórios.", "error");
      return;
    }
    setSaving(true);
    try {
      const created = await api.fetchJson(
        `/enrollments/${selected.id}/documents`,
        {
          method: "POST",
          body: JSON.stringify(docForm),
        },
      );
      setDocs((s) => [...s, created]);
      setDocForm({ type: "", name: "", delivered: false, notes: "" });
      toast("Documento adicionado!");
    } catch (e: any) {
      toast(e?.message || "Erro ao adicionar documento", "error");
    } finally {
      setSaving(false);
    }
  }

  async function downloadPdf(path: string, filename: string) {
    try {
      const blob = await (api as any).fetchBlob(path);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e: any) {
      toast(e?.message || "Erro ao baixar PDF", "error");
    }
  }

  async function handleStatusUpdate() {
    if (!selected || !newStatus) return;
    setSaving(true);
    try {
      await api.fetchJson(`/enrollments/${selected.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      toast("Status atualizado!");
      setModal(null);
      load(page);
    } catch (e: any) {
      toast(e?.message || "Erro ao atualizar.", "error");
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: "number", label: "Nº Matrícula", width: 120 },
    { key: "student", label: "Aluno" },
    { key: "classroom", label: "Turma", width: 130 },
    { key: "year", label: "Ano", width: 80 },
    { key: "status", label: "Status", width: 110 },
    { key: "actions", label: "", width: 110 },
  ];

  const rows = filtered.map((e) => [
    <span
      style={{
        fontFamily: "monospace",
        fontSize: 12,
        color: "#6b7280",
        background: "#f3f4f6",
        padding: "2px 6px",
        borderRadius: 5,
      }}
    >
      {e.enrollmentNumber}
    </span>,
    <span style={{ fontWeight: 600, color: "#111827" }}>
      {e.student?.name || "—"}
    </span>,
    <span style={{ color: "#6b7280" }}>{e.classroom?.name || "—"}</span>,
    <span style={{ color: "#6b7280" }}>{e.academicYear?.year || "—"}</span>,
    <StatusBadge
      label={STATUS_LABELS[e.status] || e.status}
      color={STATUS_COLORS[e.status] || "gray"}
    />,
    <div style={{ display: "flex", gap: 4 }}>
      <IconButton onClick={() => openStatus(e)} title="Alterar status">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      </IconButton>
      <IconButton onClick={() => openDetails(e)} title="Documentos / Histórico">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </IconButton>
    </div>,
  ]);

  return (
    <PageShell
      title="Matrículas"
      description="Gerencie matrículas de alunos nas turmas da escola."
      action={
        <PrimaryButton onClick={openCreate}>+ Nova matrícula</PrimaryButton>
      }
    >
      <Card>
        <div
          style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}
        >
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por aluno ou número..."
          >
            <SelectFilter
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                load(1);
              }}
              options={STATUS_UPDATE_OPTIONS}
              placeholder="Todos os status"
            />
          </SearchBar>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          emptyMessage="Nenhuma matrícula encontrada."
        />
        <Pagination page={page} total={total} limit={LIMIT} onPage={load} />
      </Card>

      <Modal
        open={modal === "create"}
        onClose={() => setModal(null)}
        title="Nova matrícula"
      >
        <form onSubmit={handleCreate}>
          {formError && (
            <div style={{ marginBottom: 14 }}>
              <InlineAlert message={formError} type="error" />
            </div>
          )}
          <FormField label="Aluno" required>
            <Select
              value={form.studentId}
              onChange={(v) => setForm((f) => ({ ...f, studentId: v }))}
              options={students.map((s) => ({ value: s.id, label: s.name }))}
              placeholder="Selecione o aluno..."
            />
          </FormField>
          <FormField label="Turma" required>
            <Select
              value={form.classroomId}
              onChange={(v) => setForm((f) => ({ ...f, classroomId: v }))}
              options={classrooms.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Selecione a turma..."
            />
          </FormField>
          <FormField label="Ano letivo" required>
            <Select
              value={form.academicYearId}
              onChange={(v) => setForm((f) => ({ ...f, academicYearId: v }))}
              options={years.map((y) => ({
                value: y.id,
                label: String(y.year),
              }))}
              placeholder="Selecione o ano..."
            />
          </FormField>
          <FormField label="Responsável financeiro" required>
            <Select
              value={form.financialResponsibleGuardianId}
              onChange={(v) =>
                setForm((f) => ({ ...f, financialResponsibleGuardianId: v }))
              }
              options={financialOptions}
              disabled={!form.studentId || loadingFinancial}
              placeholder={
                !form.studentId
                  ? "Selecione o aluno primeiro..."
                  : loadingFinancial
                    ? "Carregando responsáveis..."
                    : financialOptions.length === 0
                      ? "Nenhum responsável financeiro disponível"
                      : "Selecione..."
              }
            />
          </FormField>
          <ModalFooter>
            <PrimaryButton variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </PrimaryButton>
            <PrimaryButton type="submit" loading={saving}>
              Matricular
            </PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>

      <Modal
        open={modal === "status"}
        onClose={() => setModal(null)}
        title="Alterar status da matrícula"
      >
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#374151" }}>
          Matrícula <strong>{selected?.enrollmentNumber}</strong> —{" "}
          {selected?.student?.name}
        </p>
        <FormField label="Novo status">
          <Select
            value={newStatus}
            onChange={setNewStatus}
            options={STATUS_UPDATE_OPTIONS}
          />
        </FormField>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <PrimaryButton
            variant="ghost"
            onClick={() => {
              if (!selected) return;
              downloadPdf(
                `/enrollments/${selected.id}/pdf/declaration`,
                `declaracao-matricula-${selected.enrollmentNumber}.pdf`,
              );
            }}
          >
            PDF: Declaração
          </PrimaryButton>
          <PrimaryButton
            variant="ghost"
            onClick={() => {
              if (!selected) return;
              downloadPdf(
                `/enrollments/${selected.id}/pdf/proof`,
                `comprovante-vinculo-${selected.enrollmentNumber}.pdf`,
              );
            }}
          >
            PDF: Vínculo
          </PrimaryButton>
          <PrimaryButton
            variant="ghost"
            onClick={() => {
              if (!selected) return;
              downloadPdf(
                `/enrollments/${selected.id}/pdf/transfer`,
                `transferencia-${selected.enrollmentNumber}.pdf`,
              );
            }}
          >
            PDF: Transferência
          </PrimaryButton>
          <PrimaryButton
            variant="ghost"
            onClick={() => {
              if (!selected) return;
              downloadPdf(
                `/enrollments/${selected.id}/pdf/history`,
                `historico-${selected.enrollmentNumber}.pdf`,
              );
            }}
          >
            PDF: Histórico
          </PrimaryButton>
        </div>
        <ModalFooter>
          <PrimaryButton variant="ghost" onClick={() => setModal(null)}>
            Cancelar
          </PrimaryButton>
          <PrimaryButton onClick={handleStatusUpdate} loading={saving}>
            Salvar
          </PrimaryButton>
        </ModalFooter>
      </Modal>

      <Modal
        open={modal === "details"}
        onClose={() => setModal(null)}
        title="Documentos e histórico"
        width={720}
      >
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#374151" }}>
          Matrícula <strong>{selected?.enrollmentNumber}</strong> —{" "}
          {selected?.student?.name}
        </p>

        {detailsLoading ? (
          <p style={{ margin: 0, color: "#6b7280" }}>Carregando...</p>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 18,
              }}
            >
              <div>
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Checklist de documentos
                </p>

                {docs.length === 0 ? (
                  <p style={{ margin: 0, color: "#9ca3af", fontSize: 13 }}>
                    Nenhum documento cadastrado.
                  </p>
                ) : (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {docs.map((d) => (
                      <div
                        key={d.id}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: "1px solid #e9ebf0",
                          background: "#fff",
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 13,
                              color: "#111827",
                            }}
                          >
                            {d.name}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#6b7280",
                              marginTop: 2,
                            }}
                          >
                            {String(d.type)}
                            {d.notes ? ` · ${d.notes}` : ""}
                          </div>
                        </div>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 12.5,
                            color: "#6b7280",
                            cursor: "pointer",
                            userSelect: "none",
                            flexShrink: 0,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!d.delivered}
                            onChange={(e) =>
                              toggleDocDelivered(d.id, e.target.checked)
                            }
                          />
                          Entregue
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 8px",
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: "#374151",
                    }}
                  >
                    Adicionar documento
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "180px 1fr",
                      gap: 10,
                    }}
                  >
                    <FormField label="Tipo" required>
                      <Select
                        value={docForm.type}
                        onChange={(v) => setDocForm((f) => ({ ...f, type: v }))}
                        options={DOC_TYPE_OPTIONS}
                        placeholder="Selecione..."
                      />
                    </FormField>
                    <FormField label="Nome" required>
                      <input
                        value={docForm.name}
                        onChange={(e) =>
                          setDocForm((f) => ({ ...f, name: e.target.value }))
                        }
                        style={{
                          width: "100%",
                          height: 40,
                          padding: "0 12px",
                          borderRadius: 9,
                          border: "1.5px solid #e2e8f0",
                          fontSize: 13,
                          fontFamily: "inherit",
                          boxSizing: "border-box",
                        }}
                      />
                    </FormField>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <PrimaryButton onClick={addDocument} loading={saving}>
                      Adicionar
                    </PrimaryButton>
                  </div>
                </div>
              </div>

              <div>
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Histórico de movimentações
                </p>
                {history.length === 0 ? (
                  <p style={{ margin: 0, color: "#9ca3af", fontSize: 13 }}>
                    Sem registros.
                  </p>
                ) : (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {history.map((h) => (
                      <div
                        key={h.id}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: "1px solid #e9ebf0",
                          background: "#fff",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: "#111827",
                          }}
                        >
                          {String(h.type)}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                            marginTop: 2,
                          }}
                        >
                          {h.description || "—"}
                        </div>
                        <div
                          style={{
                            fontSize: 11.5,
                            color: "#9ca3af",
                            marginTop: 6,
                          }}
                        >
                          {String(h.createdAt).slice(0, 19).replace("T", " ")}
                          {h.createdBy?.name ? ` · ${h.createdBy.name}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <ModalFooter>
              <PrimaryButton variant="ghost" onClick={() => setModal(null)}>
                Fechar
              </PrimaryButton>
            </ModalFooter>
          </>
        )}
      </Modal>
    </PageShell>
  );
}
