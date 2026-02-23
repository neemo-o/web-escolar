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
  StatCard,
} from "../../../../components/ui";

const SHIFT_LABELS: Record<string, string> = {
  MANHA: "Manhã",
  TARDE: "Tarde",
  NOTURNO: "Noturno",
  INTEGRAL: "Integral",
};
const SHIFT_OPTIONS = Object.entries(SHIFT_LABELS).map(([v, l]) => ({
  value: v,
  label: l,
}));
const SHIFT_COLORS: Record<string, "blue" | "yellow" | "purple" | "green"> = {
  MANHA: "blue",
  TARDE: "yellow",
  NOTURNO: "purple",
  INTEGRAL: "green",
};

type Classroom = {
  id: string;
  name: string;
  shift: string;
  capacity: number;
  academicYear?: { year: number };
  gradeLevel?: { name: string };
  _count?: { enrollments: number };
};
type AcademicYear = { id: string; year: number; status: string };
type GradeLevel = { id: string; name: string };
type Teacher = { id: string; name: string; email: string };

type FormState = {
  name: string;
  shift: string;
  capacity: string;
  academicYearId: string;
  gradeLevelId: string;
};
const emptyForm = (): FormState => ({
  name: "",
  shift: "",
  capacity: "30",
  academicYearId: "",
  gradeLevelId: "",
});

export default function Classrooms() {
  const [items, setItems] = useState<Classroom[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [modal, setModal] = useState<
    "create" | "edit" | "delete" | "teachers" | null
  >(null);
  const [selected, setSelected] = useState<Classroom | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [grades, setGrades] = useState<GradeLevel[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classroomTeachers, setClassroomTeachers] = useState<Teacher[]>([]);
  const [addTeacherId, setAddTeacherId] = useState("");
  const LIMIT = 20;

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: String(LIMIT),
          ...(yearFilter ? { academicYearId: yearFilter } : {}),
        });
        const res = await api.fetchJson(`/classrooms?${params}`);
        const data = res?.data ?? res ?? [];
        setItems(data);
        setTotal(res?.meta?.total ?? data.length);
        setPage(p);
      } catch (e: any) {
        toast(e?.message || "Erro ao carregar turmas", "error");
      } finally {
        setLoading(false);
      }
    },
    [yearFilter],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  useEffect(() => {
    async function loadRefs() {
      try {
        const [y, g, t] = await Promise.all([
          api.fetchJson("/academic-years?limit=50"),
          api.fetchJson("/grade-levels?limit=50"),
          api.fetchJson("/users?role=TEACHER&limit=100"),
        ]);
        setYears(y?.data ?? y ?? []);
        setGrades(g?.data ?? g ?? []);
        setTeachers(
          (t?.data ?? t ?? []).map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
          })),
        );
      } catch {}
    }
    loadRefs();
  }, []);

  const filtered = items.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.gradeLevel?.name || "").toLowerCase().includes(search.toLowerCase()),
  );

  async function openTeachers(c: Classroom) {
    setSelected(c);
    setAddTeacherId("");
    try {
      const res = await api.fetchJson(`/classrooms/${c.id}/teachers`);
      const data = res?.data ?? res ?? [];
      setClassroomTeachers(
        data.map((r: any) => ({
          id: r.teacher?.id || r.teacherId,
          name: r.teacher?.name || "",
          email: r.teacher?.email || "",
        })),
      );
    } catch {
      setClassroomTeachers([]);
    }
    setModal("teachers");
  }

  async function handleAddTeacher() {
    if (!selected || !addTeacherId) return;
    setSaving(true);
    try {
      await api.fetchJson(`/classrooms/${selected.id}/teachers`, {
        method: "POST",
        body: JSON.stringify({ teacherId: addTeacherId }),
      });
      const t = teachers.find((t) => t.id === addTeacherId);
      if (t) setClassroomTeachers((p) => [...p, t]);
      setAddTeacherId("");
      toast("Professor vinculado!");
    } catch (e: any) {
      toast(e?.message || "Erro ao vincular.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveTeacher(teacherId: string) {
    if (!selected) return;
    try {
      await api.fetchJson(`/classrooms/${selected.id}/teachers/${teacherId}`, {
        method: "DELETE",
      });
      setClassroomTeachers((p) => p.filter((t) => t.id !== teacherId));
      toast("Professor removido.");
    } catch (e: any) {
      toast(e?.message || "Erro ao remover.", "error");
    }
  }

  function openCreate() {
    setForm(emptyForm());
    setFormError("");
    setSelected(null);
    setModal("create");
  }

  function openEdit(c: Classroom) {
    setForm({
      name: c.name,
      shift: c.shift,
      capacity: String(c.capacity),
      academicYearId: "",
      gradeLevelId: "",
    });
    setFormError("");
    setSelected(c);
    setModal("edit");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (
      !form.name ||
      !form.shift ||
      !form.academicYearId ||
      !form.gradeLevelId
    ) {
      setFormError("Todos os campos são obrigatórios.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await api.fetchJson("/classrooms", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          shift: form.shift,
          capacity: Number(form.capacity) || 30,
          academicYearId: form.academicYearId,
          gradeLevelId: form.gradeLevelId,
        }),
      });
      toast("Turma criada!");
      setModal(null);
      load(1);
    } catch (e: any) {
      setFormError(e?.message || "Erro ao criar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setFormError("");
    try {
      await api.fetchJson(`/classrooms/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          shift: form.shift,
          capacity: Number(form.capacity),
        }),
      });
      toast("Turma atualizada!");
      setModal(null);
      load(page);
    } catch (e: any) {
      setFormError(e?.message || "Erro ao atualizar.");
    } finally {
      setSaving(false);
    }
  }

  const yearOptions = years.map((y) => ({
    value: y.id,
    label: String(y.year),
  }));

  const columns = [
    { key: "name", label: "Turma" },
    { key: "grade", label: "Série" },
    { key: "shift", label: "Turno", width: 100 },
    { key: "year", label: "Ano letivo", width: 110 },
    { key: "students", label: "Alunos", width: 80 },
    { key: "actions", label: "", width: 100 },
  ];

  const rows = filtered.map((c) => [
    <span style={{ fontWeight: 600, color: "#111827" }}>{c.name}</span>,
    <span style={{ color: "#6b7280" }}>{c.gradeLevel?.name || "—"}</span>,
    <StatusBadge
      label={SHIFT_LABELS[c.shift] || c.shift}
      color={SHIFT_COLORS[c.shift] || "gray"}
    />,
    <span style={{ color: "#6b7280" }}>{c.academicYear?.year || "—"}</span>,
    <span style={{ fontWeight: 700, color: "#374151" }}>
      {c._count?.enrollments ?? "—"}
    </span>,
    <div style={{ display: "flex", gap: 4 }}>
      <IconButton onClick={() => openEdit(c)} title="Editar">
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
      <IconButton onClick={() => openTeachers(c)} title="Professores">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </IconButton>
    </div>,
  ]);

  const activeYear = years.find((y) => y.status === "EM_ANDAMENTO");

  return (
    <PageShell
      title="Turmas"
      description="Gerencie as turmas da escola, vincule professores e acompanhe matrículas."
      action={<PrimaryButton onClick={openCreate}>+ Nova turma</PrimaryButton>}
    >
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard
          label="Total de turmas"
          value={total}
          color="#0891b2"
          sub={activeYear ? `Ano ${activeYear.year}` : undefined}
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          }
        />
      </div>

      <Card>
        <div
          style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}
        >
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nome ou série..."
          >
            <SelectFilter
              value={yearFilter}
              onChange={(v) => {
                setYearFilter(v);
                load(1);
              }}
              options={yearOptions}
              placeholder="Todos os anos"
            />
          </SearchBar>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          emptyMessage="Nenhuma turma encontrada."
        />
        <Pagination page={page} total={total} limit={LIMIT} onPage={load} />
      </Card>

      <Modal
        open={modal === "create"}
        onClose={() => setModal(null)}
        title="Nova turma"
      >
        <form onSubmit={handleCreate}>
          {formError && (
            <div style={{ marginBottom: 14 }}>
              <InlineAlert message={formError} type="error" />
            </div>
          )}
          <FormField label="Nome da turma" required>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: 5º Ano A"
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
          <FormField label="Ano letivo" required>
            <Select
              value={form.academicYearId}
              onChange={(v) => setForm((f) => ({ ...f, academicYearId: v }))}
              options={yearOptions}
              placeholder="Selecione..."
            />
          </FormField>
          <FormField label="Série/Nível" required>
            <Select
              value={form.gradeLevelId}
              onChange={(v) => setForm((f) => ({ ...f, gradeLevelId: v }))}
              options={grades.map((g) => ({ value: g.id, label: g.name }))}
              placeholder="Selecione..."
            />
          </FormField>
          <FormField label="Turno" required>
            <Select
              value={form.shift}
              onChange={(v) => setForm((f) => ({ ...f, shift: v }))}
              options={SHIFT_OPTIONS}
              placeholder="Selecione..."
            />
          </FormField>
          <FormField label="Capacidade">
            <input
              type="number"
              value={form.capacity}
              onChange={(e) =>
                setForm((f) => ({ ...f, capacity: e.target.value }))
              }
              min={1}
              max={100}
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
          <ModalFooter>
            <PrimaryButton variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </PrimaryButton>
            <PrimaryButton type="submit" loading={saving}>
              Criar turma
            </PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>

      <Modal
        open={modal === "edit"}
        onClose={() => setModal(null)}
        title="Editar turma"
      >
        <form onSubmit={handleEdit}>
          {formError && (
            <div style={{ marginBottom: 14 }}>
              <InlineAlert message={formError} type="error" />
            </div>
          )}
          <FormField label="Nome da turma" required>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
          <FormField label="Turno" required>
            <Select
              value={form.shift}
              onChange={(v) => setForm((f) => ({ ...f, shift: v }))}
              options={SHIFT_OPTIONS}
              placeholder="Selecione..."
            />
          </FormField>
          <FormField label="Capacidade">
            <input
              type="number"
              value={form.capacity}
              onChange={(e) =>
                setForm((f) => ({ ...f, capacity: e.target.value }))
              }
              min={1}
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
          <ModalFooter>
            <PrimaryButton variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </PrimaryButton>
            <PrimaryButton type="submit" loading={saving}>
              Salvar
            </PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>

      <Modal
        open={modal === "teachers"}
        onClose={() => setModal(null)}
        title={`Professores — ${selected?.name || ""}`}
        width={520}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "#6b7280" }}>
            Professores vinculados a esta turma:
          </p>
          {classroomTeachers.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: 13 }}>
              Nenhum professor vinculado.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {classroomTeachers.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: "#f8fafc",
                    borderRadius: 9,
                    border: "1px solid #e9ebf0",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {t.name}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#6b7280" }}>
                      {t.email}
                    </div>
                  </div>
                  <IconButton
                    onClick={() => handleRemoveTeacher(t.id)}
                    title="Remover"
                    variant="danger"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </IconButton>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 12.5,
              fontWeight: 600,
              color: "#374151",
            }}
          >
            Adicionar professor:
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Select
                value={addTeacherId}
                onChange={setAddTeacherId}
                options={teachers
                  .filter(
                    (t) => !classroomTeachers.find((ct) => ct.id === t.id),
                  )
                  .map((t) => ({ value: t.id, label: t.name }))}
                placeholder="Selecione um professor..."
              />
            </div>
            <PrimaryButton
              onClick={handleAddTeacher}
              disabled={!addTeacherId}
              loading={saving}
            >
              Vincular
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}
