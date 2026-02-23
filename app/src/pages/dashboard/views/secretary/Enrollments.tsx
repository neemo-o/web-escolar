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
};
type Student = { id: string; name: string; cpf?: string };
type Classroom = { id: string; name: string };
type AcademicYear = { id: string; year: number };

export default function Enrollments() {
  const [items, setItems] = useState<Enrollment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ATIVA");
  const [modal, setModal] = useState<"create" | "status" | null>(null);
  const [selected, setSelected] = useState<Enrollment | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [form, setForm] = useState({
    studentId: "",
    classroomId: "",
    academicYearId: "",
  });
  const LIMIT = 20;

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: String(LIMIT),
          ...(statusFilter ? { status: statusFilter } : {}),
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
    [statusFilter],
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
            cpf: x.cpf,
          })),
        );
        setClassrooms(
          (c?.data ?? c ?? []).map((x: any) => ({ id: x.id, name: x.name })),
        );
        setYears(
          (y?.data ?? y ?? []).map((x: any) => ({ id: x.id, year: x.year })),
        );
      } catch {}
    }
    loadRefs();
  }, []);

  const filtered = items.filter(
    (e) =>
      !search ||
      (e.student?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.enrollmentNumber || "").toLowerCase().includes(search.toLowerCase()),
  );

  function openCreate() {
    setForm({ studentId: "", classroomId: "", academicYearId: "" });
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
    if (!form.studentId || !form.classroomId || !form.academicYearId) {
      setFormError("Todos os campos são obrigatórios.");
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
    { key: "actions", label: "", width: 60 },
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
    </IconButton>,
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
        <ModalFooter>
          <PrimaryButton variant="ghost" onClick={() => setModal(null)}>
            Cancelar
          </PrimaryButton>
          <PrimaryButton onClick={handleStatusUpdate} loading={saving}>
            Salvar
          </PrimaryButton>
        </ModalFooter>
      </Modal>
    </PageShell>
  );
}
