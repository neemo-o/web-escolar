import React, { useEffect, useState, useCallback, useMemo } from "react";
import api from "../../../../utils/api";
import {
  PageShell,
  Card,
  PrimaryButton,
  SelectFilter,
  Modal,
  FormField,
  ModalFooter,
  toast,
} from "../../../../components/ui";

// Types
type Schedule = {
  id: string;
  classroomId: string;
  subjectId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  subject: { id: string; name: string; code: string };
  classroom: {
    id: string;
    name: string;
    gradeLevel: { id: string; name: string; code: string };
  };
  teacher: { id: string; name: string } | null;
};

type Classroom = { id: string; name: string; gradeLevelId: string };
type GradeLevel = { id: string; name: string; code: string };
type Subject = { id: string; name: string; code: string };
type Teacher = { id: string; userId: string; name: string };

// Day labels
const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DAYS_TO_SHOW = [1, 2, 3, 4, 5]; // Monday to Friday

// Time slots
const TIME_SLOTS = [
  "07:00",
  "07:50",
  "08:40",
  "09:30",
  "10:20",
  "11:10",
  "13:00",
  "13:50",
  "14:40",
  "15:30",
  "16:20",
  "17:10",
];

// Input styles
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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

export default function Schedule() {
  // Data states
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Filter states
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [selectedGradeLevel, setSelectedGradeLevel] = useState("");

  // Modal states
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null,
  );
  const [formData, setFormData] = useState({
    subjectId: "",
    dayOfWeek: "1",
    startTime: "07:00",
    endTime: "07:50",
    room: "",
    teacherId: "",
  });

  // Filter classrooms by selected grade level
  const filteredClassrooms = useMemo(() => {
    if (!selectedGradeLevel) return classrooms;
    return classrooms.filter((c) => c.gradeLevelId === selectedGradeLevel);
  }, [classrooms, selectedGradeLevel]);

  // Load initial data
  useEffect(() => {
    async function loadRefs() {
      try {
        const [cRes, gRes, sRes] = await Promise.all([
          api.fetchJson("/classrooms?limit=200"),
          api.fetchJson("/grade-levels?limit=50"),
          api.fetchJson("/subjects?limit=100"),
        ]);
        setClassrooms(
          (cRes?.data ?? cRes ?? []).map((x: any) => ({
            id: x.id,
            name: x.name,
            gradeLevelId: x.gradeLevel?.id,
          })),
        );
        setGradeLevels(
          (gRes?.data ?? gRes ?? []).map((x: any) => ({
            id: x.id,
            name: x.name,
            code: x.code,
          })),
        );
        setSubjects(
          (sRes?.data ?? sRes ?? []).map((x: any) => ({
            id: x.id,
            name: x.name,
            code: x.code,
          })),
        );
      } catch (e) {
        console.error("Error loading references:", e);
      }
    }
    loadRefs();
  }, []);

  // Load teachers for the school
  useEffect(() => {
    async function loadTeachers() {
      try {
        const res = await api.fetchJson("/users?role=TEACHER&limit=200");
        const users = (res?.data ?? res ?? []) as any[];
        setTeachers(
          users.map((u) => ({ id: u.id, userId: u.id, name: u.name })),
        );
      } catch (e) {
        console.error("Error loading teachers:", e);
      }
    }
    loadTeachers();
  }, []);

  // Load schedules
  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedClassroom) {
        params.append("classroomId", selectedClassroom);
      } else if (selectedGradeLevel) {
        params.append("gradeLevelId", selectedGradeLevel);
      }
      const res = await api.fetchJson(`/schedules?${params}`);
      setSchedules(res?.data ?? res ?? []);
    } catch (e: any) {
      toast(e?.message || "Erro ao carregar horários", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedClassroom, selectedGradeLevel]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // Handle filter changes
  function handleClassroomChange(value: string) {
    setSelectedClassroom(value);
    setSelectedGradeLevel("");
  }

  function handleGradeLevelChange(value: string) {
    setSelectedGradeLevel(value);
    setSelectedClassroom("");
  }

  // Organize schedules into grid
  const scheduleGrid = useMemo(() => {
    const grid: Record<string, Schedule[]> = {};
    DAYS_TO_SHOW.forEach((day) => {
      TIME_SLOTS.forEach((time) => {
        grid[`${day}-${time}`] = [];
      });
    });
    schedules.forEach((schedule) => {
      const dayIndex = schedule.dayOfWeek;
      if (dayIndex >= 1 && dayIndex <= 5) {
        const time = schedule.startTime.substring(0, 5);
        const key = `${dayIndex}-${time}`;
        if (grid[key]) {
          grid[key].push(schedule);
        }
      }
    });
    return grid;
  }, [schedules]);

  // Modal handlers
  function openCreateModal(day: number, time: string) {
    setFormData({
      subjectId: "",
      dayOfWeek: String(day),
      startTime: time,
      endTime: getEndTime(time),
      room: "",
      teacherId: "",
    });
    setSelectedSchedule(null);
    setModal("create");
  }

  function openEditModal(schedule: Schedule) {
    setFormData({
      subjectId: schedule.subjectId,
      dayOfWeek: String(schedule.dayOfWeek),
      startTime: schedule.startTime.substring(0, 5),
      endTime: schedule.endTime.substring(0, 5),
      room: schedule.room || "",
      teacherId: schedule.teacher?.id || "",
    });
    setSelectedSchedule(schedule);
    setModal("edit");
  }

  function getEndTime(startTime: string): string {
    const idx = TIME_SLOTS.indexOf(startTime);
    return idx < TIME_SLOTS.length - 1 ? TIME_SLOTS[idx + 1] : "17:10";
  }

  // CRUD handlers
  async function handleCreate() {
    if (!selectedClassroom && !selectedGradeLevel) {
      toast("Selecione uma turma ou série primeiro", "error");
      return;
    }
    if (!formData.subjectId) {
      toast("Selecione uma disciplina", "error");
      return;
    }

    setSaving(true);
    try {
      const classroomId = selectedClassroom || filteredClassrooms[0]?.id;
      await api.postJson("/schedules", {
        classroomId,
        subjectId: formData.subjectId,
        dayOfWeek: parseInt(formData.dayOfWeek),
        startTime: formData.startTime,
        endTime: formData.endTime,
        room: formData.room || null,
      });
      toast("Horário criado com sucesso!", "success");
      setModal(null);
      loadSchedules();
    } catch (e: any) {
      toast(e?.message || "Erro ao criar horário", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!selectedSchedule) return;
    if (!formData.subjectId) {
      toast("Selecione uma disciplina", "error");
      return;
    }

    setSaving(true);
    try {
      await api.patchJson(`/schedules/${selectedSchedule.id}`, {
        subjectId: formData.subjectId,
        dayOfWeek: parseInt(formData.dayOfWeek),
        startTime: formData.startTime,
        endTime: formData.endTime,
        room: formData.room || null,
      });
      toast("Horário atualizado com sucesso!", "success");
      setModal(null);
      loadSchedules();
    } catch (e: any) {
      toast(e?.message || "Erro ao atualizar horário", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedSchedule) return;
    if (!confirm("Tem certeza que deseja excluir este horário?")) return;

    setSaving(true);
    try {
      await api.deleteJson(`/schedules/${selectedSchedule.id}`);
      toast("Horário excluído com sucesso!", "success");
      setModal(null);
      loadSchedules();
    } catch (e: any) {
      toast(e?.message || "Erro ao excluir horário", "error");
    } finally {
      setSaving(false);
    }
  }

  function formatTime(time: string): string {
    return time.substring(0, 5);
  }

  return (
    <PageShell
      title="Horário"
      description="Gerencie o calendário semanal de aulas por turma ou série."
      action={
        (selectedClassroom || selectedGradeLevel) && (
          <PrimaryButton onClick={() => openCreateModal(1, "07:00")}>
            + Adicionar Aula
          </PrimaryButton>
        )
      }
    >
      <Card>
        {/* Filters */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              Série:
            </label>
            <SelectFilter
              value={selectedGradeLevel}
              onChange={handleGradeLevelChange}
              options={gradeLevels.map((g) => ({ value: g.id, label: g.name }))}
              placeholder="Todas as séries"
            />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              Turma:
            </label>
            <SelectFilter
              value={selectedClassroom}
              onChange={handleClassroomChange}
              options={filteredClassrooms.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
              placeholder="Todas as turmas"
            />
          </div>
        </div>

        {/* Schedule Grid */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 12.5,
              minWidth: 800,
            }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th
                  style={{
                    padding: "10px 12px",
                    textAlign: "left",
                    fontWeight: 700,
                    color: "#6b7280",
                    fontSize: 11,
                    letterSpacing: "0.4px",
                    textTransform: "uppercase",
                    borderBottom: "1px solid #e9ebf0",
                    width: 70,
                  }}
                >
                  Horário
                </th>
                {DAYS_TO_SHOW.map((day) => (
                  <th
                    key={day}
                    style={{
                      padding: "10px 12px",
                      textAlign: "center",
                      fontWeight: 700,
                      color: "#6b7280",
                      fontSize: 11,
                      letterSpacing: "0.4px",
                      textTransform: "uppercase",
                      borderBottom: "1px solid #e9ebf0",
                      borderLeft: "1px solid #e9ebf0",
                    }}
                  >
                    {DAY_LABELS[day]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={DAYS_TO_SHOW.length + 1}
                    style={{
                      padding: "48px 14px",
                      textAlign: "center",
                      color: "#9ca3af",
                    }}
                  >
                    Carregando...
                  </td>
                </tr>
              ) : !selectedClassroom && !selectedGradeLevel ? (
                <tr>
                  <td
                    colSpan={DAYS_TO_SHOW.length + 1}
                    style={{
                      padding: "48px 14px",
                      textAlign: "center",
                      color: "#9ca3af",
                    }}
                  >
                    Selecione uma série ou turma para visualizar os horários.
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td
                    colSpan={DAYS_TO_SHOW.length + 1}
                    style={{
                      padding: "48px 14px",
                      textAlign: "center",
                      color: "#9ca3af",
                    }}
                  >
                    Nenhum horário encontrado. Clique em "Adicionar Aula" para
                    criar o primeiro.
                  </td>
                </tr>
              ) : (
                TIME_SLOTS.map((time) => (
                  <tr key={time} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td
                      style={{
                        padding: "8px 10px",
                        color: "#6b7280",
                        fontWeight: 600,
                        fontSize: 11.5,
                        background: "#fafbfc",
                      }}
                    >
                      {time}
                    </td>
                    {DAYS_TO_SHOW.map((day) => {
                      const cellSchedules =
                        scheduleGrid[`${day}-${time}`] || [];
                      return (
                        <td
                          key={`${day}-${time}`}
                          style={{
                            padding: 4,
                            borderLeft: "1px solid #e9ebf0",
                            verticalAlign: "top",
                            minHeight: 50,
                            cursor:
                              selectedClassroom || selectedGradeLevel
                                ? "pointer"
                                : "default",
                          }}
                          onClick={() => {
                            if (
                              cellSchedules.length === 0 &&
                              (selectedClassroom || selectedGradeLevel)
                            ) {
                              openCreateModal(day, time);
                            }
                          }}
                        >
                          {cellSchedules.length > 0 ? (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                              }}
                            >
                              {cellSchedules.map((s) => (
                                <div
                                  key={s.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(s);
                                  }}
                                  style={{
                                    padding: "6px 8px",
                                    borderRadius: 8,
                                    background:
                                      "linear-gradient(135deg, #0891b2, #0e7490)",
                                    color: "#fff",
                                    fontSize: 11,
                                    cursor: "pointer",
                                  }}
                                >
                                  <div
                                    style={{ fontWeight: 700, marginBottom: 2 }}
                                  >
                                    {s.subject.name}
                                  </div>
                                  {s.teacher && (
                                    <div
                                      style={{
                                        fontSize: 10,
                                        opacity: 0.9,
                                        marginBottom: 2,
                                      }}
                                    >
                                      {s.teacher.name}
                                    </div>
                                  )}
                                  <div style={{ fontSize: 10, opacity: 0.85 }}>
                                    {formatTime(s.startTime)} -{" "}
                                    {formatTime(s.endTime)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div
                              style={{
                                padding: "6px 8px",
                                color: "#9ca3af",
                                fontSize: 10.5,
                                fontStyle: "italic",
                              }}
                            >
                              Livre
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={modal === "create" || modal === "edit"}
        onClose={() => setModal(null)}
        title={modal === "create" ? "Adicionar Aula" : "Editar Aula"}
      >
        <FormField label="Disciplina" required>
          <select
            value={formData.subjectId}
            onChange={(e) =>
              setFormData((f) => ({ ...f, subjectId: e.target.value }))
            }
            style={selectStyle}
          >
            <option value="">Selecione...</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Dia da Semana" required>
          <select
            value={formData.dayOfWeek}
            onChange={(e) =>
              setFormData((f) => ({ ...f, dayOfWeek: e.target.value }))
            }
            style={selectStyle}
          >
            {DAYS_TO_SHOW.map((d) => (
              <option key={d} value={d}>
                {DAY_LABELS[d]}
              </option>
            ))}
          </select>
        </FormField>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <FormField label="Início" required>
            <select
              value={formData.startTime}
              onChange={(e) =>
                setFormData((f) => ({
                  ...f,
                  startTime: e.target.value,
                  endTime: getEndTime(e.target.value),
                }))
              }
              style={selectStyle}
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Término" required>
            <select
              value={formData.endTime}
              onChange={(e) =>
                setFormData((f) => ({ ...f, endTime: e.target.value }))
              }
              style={selectStyle}
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Sala">
          <input
            type="text"
            value={formData.room}
            onChange={(e) =>
              setFormData((f) => ({ ...f, room: e.target.value }))
            }
            placeholder="Ex: Sala 101"
            style={inputStyle}
          />
        </FormField>

        <ModalFooter>
          {modal === "edit" && (
            <div style={{ marginRight: "auto" }}>
              <PrimaryButton
                variant="danger"
                onClick={handleDelete}
                loading={saving}
              >
                Excluir
              </PrimaryButton>
            </div>
          )}
          <PrimaryButton variant="ghost" onClick={() => setModal(null)}>
            Cancelar
          </PrimaryButton>
          <PrimaryButton
            onClick={modal === "create" ? handleCreate : handleUpdate}
            loading={saving}
          >
            {modal === "create" ? "Criar" : "Salvar"}
          </PrimaryButton>
        </ModalFooter>
      </Modal>
    </PageShell>
  );
}
