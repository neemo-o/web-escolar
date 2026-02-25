import { useEffect, useState, useCallback } from "react";
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
  academicYear?: { id: string; year: number };
  gradeLevel?: { id: string; name: string };
  _count?: { enrollments: number };
};
type AcademicYear = { id: string; year: number; status: string };
type GradeLevel = { id: string; name: string };
type Subject = { id: string; name: string; code: string };
type TeacherLink = {
  id: string;
  teacher: { id: string; name: string; email: string };
  subject: { id: string; name: string };
};
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

export default function Classrooms() {
  const [items, setItems] = useState<Classroom[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
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
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classroomSubjects, setClassroomSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classroomTeachers, setClassroomTeachers] = useState<TeacherLink[]>([]);
  // FIX #6: teacher link now requires subjectId
  const [addTeacherId, setAddTeacherId] = useState("");
  const [addSubjectId, setAddSubjectId] = useState("");
  const LIMIT = 20;

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: String(LIMIT),
        });
        if (yearFilter) params.set("academicYearId", yearFilter);
        const res = await api.fetchJson(`/classrooms?${params}`);
        setItems(res?.data ?? res ?? []);
        setTotal(res?.meta?.total ?? 0);
        setPage(p);
      } catch {
        toast("Erro ao carregar turmas", "error");
      } finally {
        setLoading(false);
      }
    },
    [yearFilter],
  );

  useEffect(() => {
    load(1);
  }, [yearFilter]);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [yRes, gRes, tRes, sRes] = await Promise.all([
          api.fetchJson("/academic-years?limit=50"),
          api.fetchJson("/grade-levels?limit=100"),
          api.fetchJson("/users?role=TEACHER&limit=200"),
          api.fetchJson("/subjects?limit=200"),
        ]);
        setYears(yRes?.data ?? yRes ?? []);
        setGrades(gRes?.data ?? gRes ?? []);
        setTeachers(tRes?.data ?? tRes ?? []);
        setSubjects(sRes?.data ?? sRes ?? []);
      } catch {}
    }
    loadMeta();
  }, []);

  async function loadClassroomTeachers(classroomId: string) {
    try {
      const [tRes, sRes] = await Promise.all([
        api.fetchJson(`/classrooms/${classroomId}/teachers`),
        api.fetchJson(`/classrooms/${classroomId}/subjects`),
      ]);
      setClassroomTeachers(tRes?.data ?? tRes ?? []);
      setClassroomSubjects(sRes?.data ?? sRes ?? []);
    } catch {
      toast("Erro ao carregar vínculos.", "error");
    }
  }

  // FIX #7: only show years that can still receive classrooms
  const activeYearOptions = years
    .filter((y) => y.status !== "ENCERRADO" && y.status !== "ARQUIVADO")
    .map((y) => ({ value: y.id, label: String(y.year) }));

  const yearFilterOptions = years.map((y) => ({
    value: y.id,
    label: String(y.year),
  }));

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
      await api.fetchJson(`/classrooms/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          shift: form.shift,
          capacity: Number(form.capacity),
          academicYearId: form.academicYearId,
          gradeLevelId: form.gradeLevelId,
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

  async function handleDelete() {
    if (!selected) return;
    setSaving(true);
    try {
      await api.fetchJson(`/classrooms/${selected.id}`, { method: "DELETE" });
      toast("Turma removida!");
      setModal(null);
      load(page);
    } catch (e: any) {
      toast(e?.message || "Erro ao remover.", "error");
    } finally {
      setSaving(false);
    }
  }

  // FIX #6: send subjectId when linking teacher
  async function handleAddTeacher() {
    if (!selected || !addTeacherId || !addSubjectId) {
      toast("Selecione o professor e a disciplina.", "error");
      return;
    }
    setSaving(true);
    try {
      await api.fetchJson(`/classrooms/${selected.id}/teachers`, {
        method: "POST",
        body: JSON.stringify({
          teacherId: addTeacherId,
          subjectId: addSubjectId,
          dateFrom: new Date().toISOString().slice(0, 10),
        }),
      });
      setAddTeacherId("");
      setAddSubjectId("");
      loadClassroomTeachers(selected.id);
      toast("Professor vinculado!");
    } catch (e: any) {
      toast(e?.message || "Erro ao vincular.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveTeacher(linkId: string) {
    if (!selected) return;
    try {
      await api.fetchJson(
        `/classrooms/${selected.id}/teachers/${linkId}/remove`,
        { method: "PATCH" },
      );
      loadClassroomTeachers(selected.id);
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
      academicYearId: c.academicYear?.id || "",
      gradeLevelId: c.gradeLevel?.id || "",
    });
    setFormError("");
    setSelected(c);
    setModal("edit");
  }

  const columns = [
    { key: "name", label: "Turma", width: 200 },
    { key: "gradeLevel", label: "Série", width: 120 },
    { key: "academicYear", label: "Ano", width: 80 },
    { key: "shift", label: "Turno", width: 100 },
    { key: "capacity", label: "Vagas", width: 100 },
    { key: "actions", label: "Ações", width: 200 },
  ];
  const rows = items.map((c) => [
    <span style={{ fontWeight: 700 }}>{c.name}</span>,
    c.gradeLevel?.name || <span style={{ color: "#9ca3af" }}>—</span>,
    c.academicYear?.year || "—",
    <StatusBadge
      label={SHIFT_LABELS[c.shift] || c.shift}
      color={SHIFT_COLORS[c.shift] || "gray"}
    />,
    `${c._count?.enrollments ?? 0} / ${c.capacity}`,
    <div style={{ display: "flex", gap: 4 }}>
      <IconButton
        onClick={() => {
          setSelected(c);
          loadClassroomTeachers(c.id);
          setAddTeacherId("");
          setAddSubjectId("");
          setModal("teachers");
        }}
        title="Professores"
      >
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
      <IconButton
        onClick={() => {
          setSelected(c);
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
    <PageShell
      title="Turmas"
      description="Gerencie as turmas, vínculos de professores e disciplinas."
      action={<PrimaryButton onClick={openCreate}>+ Nova turma</PrimaryButton>}
    >
      <Card>
        <div
          style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}
        >
          <SelectFilter
            value={yearFilter}
            onChange={setYearFilter}
            options={yearFilterOptions}
            placeholder="Todos os anos letivos"
          />
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          emptyMessage="Nenhuma turma encontrada."
        />
        <Pagination page={page} total={total} limit={LIMIT} onPage={load} />
      </Card>

      {/* CREATE */}
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
              placeholder="Ex: 7º Ano A"
              style={inputStyle}
            />
          </FormField>
          <FormField label="Ano letivo" required>
            <Select
              value={form.academicYearId}
              onChange={(v) => setForm((f) => ({ ...f, academicYearId: v }))}
              options={activeYearOptions}
              placeholder="Selecione..."
            />
          </FormField>
          <FormField label="Série / Nível" required>
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
              max={200}
              style={inputStyle}
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

      {/* EDIT */}
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
              style={inputStyle}
            />
          </FormField>
          <FormField label="Ano letivo" required>
            <Select
              value={form.academicYearId}
              onChange={(v) => setForm((f) => ({ ...f, academicYearId: v }))}
              options={activeYearOptions}
              placeholder="Selecione..."
            />
          </FormField>
          <FormField label="Série / Nível" required>
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
              max={200}
              style={inputStyle}
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

      {/* DELETE */}
      <Modal
        open={modal === "delete"}
        onClose={() => setModal(null)}
        title="Remover turma"
      >
        <p style={{ margin: "0 0 20px", color: "#374151" }}>
          Remover a turma <strong>{selected?.name}</strong>? Matrículas
          vinculadas também serão afetadas.
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

      {/* TEACHERS — FIX #6: now includes subject selector */}
      <Modal
        open={modal === "teachers"}
        onClose={() => setModal(null)}
        title={`Professores — ${selected?.name}`}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 12,
              fontWeight: 700,
              color: "#6b7280",
              textTransform: "uppercase",
            }}
          >
            Vincular professor
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <Select
                value={addTeacherId}
                onChange={setAddTeacherId}
                options={teachers.map((t) => ({ value: t.id, label: t.name }))}
                placeholder="Selecione o professor..."
              />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              {/* FIX #6: disciplina obrigatória no vínculo */}
              <Select
                value={addSubjectId}
                onChange={setAddSubjectId}
                options={subjects.map((s) => ({ value: s.id, label: s.name }))}
                placeholder="Selecione a disciplina..."
              />
            </div>
            <PrimaryButton
              onClick={handleAddTeacher}
              loading={saving}
              disabled={!addTeacherId || !addSubjectId}
            >
              Vincular
            </PrimaryButton>
          </div>
        </div>
        <div>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 12,
              fontWeight: 700,
              color: "#6b7280",
              textTransform: "uppercase",
            }}
          >
            Professores vinculados
          </p>
          {classroomTeachers.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: 13, padding: "12px 0" }}>
              Nenhum professor vinculado.
            </p>
          ) : (
            classroomTeachers.map((link) => (
              <div
                key={link.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: "#f8fafc",
                  borderRadius: 8,
                  marginBottom: 6,
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>
                    {link.teacher?.name}
                  </span>
                  {link.subject && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 12,
                        color: "#6b7280",
                        background: "#e2e8f0",
                        padding: "2px 8px",
                        borderRadius: 6,
                      }}
                    >
                      {link.subject.name}
                    </span>
                  )}
                </div>
                <IconButton
                  onClick={() => handleRemoveTeacher(link.id)}
                  title="Desvincular"
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
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </IconButton>
              </div>
            ))
          )}
        </div>
      </Modal>
    </PageShell>
  );
}
