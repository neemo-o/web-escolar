import React, { useEffect, useState, useCallback, useMemo } from "react";
import api from "../../../../utils/api";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  PageShell,
  Card,
  PrimaryButton,
  SecondaryButton,
  SelectFilter,
  Modal,
  FormField,
  ModalFooter,
  toast,
} from "../../../../components/ui";

// Types
type TimeBlock = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  order: number;
  active: boolean;
};

type Room = {
  id: string;
  name: string;
  capacity: number | null;
  active: boolean;
};

type Schedule = {
  id: string;
  classroomId: string;
  subjectId: string;
  teacherId: string | null;
  roomId: string | null;
  timeBlockId: string | null;
  dayOfWeek: number;
  subject: { id: string; name: string; code: string };
  classroom: {
    id: string;
    name: string;
    gradeLevel: { id: string; name: string; code: string };
  };
  teacher: { id: string; name: string } | null;
  room: { id: string; name: string } | null;
  timeBlock: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    order: number;
  } | null;
};

type Classroom = {
  id: string;
  name: string;
  gradeLevelId: string;
  shift?: string;
};
type GradeLevel = { id: string; name: string; code: string };
type Subject = { id: string; name: string; code: string };
type Teacher = { id: string; userId: string; name: string };

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DAYS_TO_SHOW = [1, 2, 3, 4, 5, 6];
const ROW_HEIGHT = 64;

const headerCellStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontWeight: 700,
  color: "#6b7280",
  fontSize: 11,
  letterSpacing: "0.4px",
  textTransform: "uppercase",
  borderBottom: "1px solid #e9ebf0",
  background: "#f8fafc",
};

const SUBJECT_COLORS = [
  "linear-gradient(135deg, #0891b2, #0e7490)",
  "linear-gradient(135deg, #7c3aed, #6d28d9)",
  "linear-gradient(135deg, #059669, #047857)",
  "linear-gradient(135deg, #dc2626, #b91c1c)",
  "linear-gradient(135deg, #ea580c, #c2410c)",
  "linear-gradient(135deg, #2563eb, #1d4ed8)",
  "linear-gradient(135deg, #db2777, #be185d)",
  "linear-gradient(135deg, #4f46e5, #4338ca)",
  "linear-gradient(135deg, #ca8a04, #a16207)",
  "linear-gradient(135deg, #65a30d, #4d7c0f)",
];

function getSubjectColor(subjectId: string): string {
  const hash = subjectId.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const index = Math.abs(hash) % SUBJECT_COLORS.length;
  return SUBJECT_COLORS[index];
}

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
  const { user } = useAuth();
  const isSecretary = user?.role === "SECRETARY";
  const isTeacher = user?.role === "TEACHER";
  const isReadOnly = isTeacher;

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [selectedGradeLevel, setSelectedGradeLevel] = useState("");
  const [shiftFilter, setShiftFilter] = useState<
    "all" | "morning" | "afternoon" | "evening"
  >("all");

  const [modal, setModal] = useState<
    "create" | "edit" | "manageTimeBlocks" | "manageRooms" | null
  >(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null,
  );
  const [formData, setFormData] = useState({
    subjectId: "",
    teacherId: "",
    roomId: "",
    timeBlockId: "",
    dayOfWeek: "1",
  });

  const [editingTimeBlock, setEditingTimeBlock] = useState<TimeBlock | null>(
    null,
  );
  const [timeBlockForm, setTimeBlockForm] = useState({
    name: "",
    startTime: "07:00",
    endTime: "07:50",
  });

  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState({
    name: "",
    capacity: "",
  });

  const filteredClassrooms = useMemo(() => {
    if (!selectedGradeLevel) return classrooms;
    return classrooms.filter((c) => c.gradeLevelId === selectedGradeLevel);
  }, [classrooms, selectedGradeLevel]);

  useEffect(() => {
    async function loadRefs() {
      try {
        const [cRes, gRes, sRes, tbRes, rRes] = await Promise.all([
          api.fetchJson("/classrooms?limit=200"),
          api.fetchJson("/grade-levels?limit=50"),
          api.fetchJson("/subjects?limit=100"),
          api.fetchJson("/time-blocks"),
          api.fetchJson("/rooms"),
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
        setTimeBlocks(tbRes ?? []);
        setRooms(rRes ?? []);
      } catch (e) {
        console.error("Error loading references:", e);
      }
    }
    loadRefs();
  }, []);

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
      const schedulesData = res?.data ?? res ?? [];

      const schedulesWithoutBlock = schedulesData.filter(
        (s: Schedule) => !s.timeBlockId,
      );
      if (schedulesWithoutBlock.length > 0) {
        console.warn(
          `Found ${schedulesWithoutBlock.length} schedule(s) without timeBlockId`,
        );
        toast(
          `${schedulesWithoutBlock.length} aula(s) não aparecem na grade por não ter bloco de horário vinculado`,
          "warning",
        );
      }

      setSchedules(schedulesData);
    } catch (e: any) {
      toast(e?.message || "Erro ao carregar horários", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedClassroom, selectedGradeLevel]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  function handleClassroomChange(value: string) {
    setSelectedClassroom(value);
  }

  function handleGradeLevelChange(value: string) {
    setSelectedGradeLevel(value);
    setSelectedClassroom("");
  }

  const scheduleGrid = useMemo(() => {
    const grid: Record<string, Schedule[]> = {};
    DAYS_TO_SHOW.forEach((day) => {
      timeBlocks.forEach((block) => {
        grid[`${day}-${block.id}`] = [];
      });
    });
    schedules.forEach((schedule) => {
      const dayIndex = schedule.dayOfWeek;
      if (dayIndex >= 1 && dayIndex <= 6 && schedule.timeBlockId) {
        const key = `${dayIndex}-${schedule.timeBlockId}`;
        if (grid[key]) {
          grid[key].push(schedule);
        }
      }
    });
    return grid;
  }, [schedules, timeBlocks]);

  function openCreateModal(day: number, timeBlockId: string) {
    setFormData({
      subjectId: "",
      teacherId: "",
      roomId: "",
      timeBlockId,
      dayOfWeek: String(day),
    });
    setSelectedSchedule(null);
    setModal("create");
  }

  function openEditModal(schedule: Schedule) {
    setFormData({
      subjectId: schedule.subjectId,
      teacherId: schedule.teacherId || "",
      roomId: schedule.roomId || "",
      timeBlockId: schedule.timeBlockId || "",
      dayOfWeek: String(schedule.dayOfWeek),
    });
    setSelectedSchedule(schedule);
    setModal("edit");
  }

  function openManageTimeBlocks() {
    setModal("manageTimeBlocks");
  }

  function openManageRooms() {
    setModal("manageRooms");
  }

  async function handleCreate() {
    if (!selectedClassroom && !selectedGradeLevel) {
      toast("Selecione uma turma ou série primeiro", "error");
      return;
    }
    if (!selectedClassroom) {
      toast("Selecione uma turma explicitamente", "error");
      return;
    }
    if (!formData.subjectId || !formData.timeBlockId) {
      toast("Preencha todos os campos obrigatórios", "error");
      return;
    }

    setSaving(true);
    try {
      await api.postJson("/schedules", {
        classroomId: selectedClassroom,
        subjectId: formData.subjectId,
        teacherId: formData.teacherId || null,
        roomId: formData.roomId || null,
        timeBlockId: formData.timeBlockId,
        dayOfWeek: parseInt(formData.dayOfWeek),
      });
      toast("Aula criada com sucesso!", "success");
      setModal(null);
      loadSchedules();
    } catch (e: any) {
      toast(e?.message || "Erro ao criar aula", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!selectedSchedule) return;
    if (!formData.subjectId || !formData.timeBlockId) {
      toast("Preencha todos os campos obrigatórios", "error");
      return;
    }

    setSaving(true);
    try {
      await api.patchJson(`/schedules/${selectedSchedule.id}`, {
        subjectId: formData.subjectId,
        teacherId: formData.teacherId || null,
        roomId: formData.roomId || null,
        timeBlockId: formData.timeBlockId,
        dayOfWeek: parseInt(formData.dayOfWeek),
      });
      toast("Aula atualizada com sucesso!", "success");
      setModal(null);
      loadSchedules();
    } catch (e: any) {
      toast(e?.message || "Erro ao atualizar aula", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedSchedule) return;
    if (!confirm("Tem certeza que deseja excluir esta aula?")) return;

    setSaving(true);
    try {
      await api.deleteJson(`/schedules/${selectedSchedule.id}`);
      toast("Aula excluída com sucesso!", "success");
      setModal(null);
      loadSchedules();
    } catch (e: any) {
      toast(e?.message || "Erro ao excluir aula", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateTimeBlock() {
    if (!timeBlockForm.name) {
      toast("Nome é obrigatório", "error");
      return;
    }
    setSaving(true);
    try {
      await api.postJson("/time-blocks", {
        name: timeBlockForm.name,
        startTime: timeBlockForm.startTime,
        endTime: timeBlockForm.endTime,
      });
      toast("Bloco de horário criado com sucesso!", "success");
      const res = await api.fetchJson("/time-blocks");
      setTimeBlocks(res ?? []);
      setTimeBlockForm({ name: "", startTime: "07:00", endTime: "07:50" });
    } catch (e: any) {
      toast(e?.message || "Erro ao criar bloco", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateTimeBlock() {
    if (!editingTimeBlock || !timeBlockForm.name) {
      toast("Nome é obrigatório", "error");
      return;
    }
    setSaving(true);
    try {
      await api.patchJson(`/time-blocks/${editingTimeBlock.id}`, {
        name: timeBlockForm.name,
        startTime: timeBlockForm.startTime,
        endTime: timeBlockForm.endTime,
      });
      toast("Bloco de horário atualizado com sucesso!", "success");
      const res = await api.fetchJson("/time-blocks");
      setTimeBlocks(res ?? []);
      setEditingTimeBlock(null);
      setTimeBlockForm({ name: "", startTime: "07:00", endTime: "07:50" });
    } catch (e: any) {
      toast(e?.message || "Erro ao atualizar bloco", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTimeBlock(id: string) {
    if (!confirm("Tem certeza que deseja desativar este bloco de horário?"))
      return;
    setSaving(true);
    try {
      await api.deleteJson(`/time-blocks/${id}`);
      toast("Bloco de horário desativado com sucesso!", "success");
      const res = await api.fetchJson("/time-blocks");
      setTimeBlocks(res ?? []);
    } catch (e: any) {
      toast(e?.message || "Erro ao desativar bloco", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateRoom() {
    if (!roomForm.name) {
      toast("Nome é obrigatório", "error");
      return;
    }
    setSaving(true);
    try {
      await api.postJson("/rooms", {
        name: roomForm.name,
        capacity: roomForm.capacity ? parseInt(roomForm.capacity) : null,
      });
      toast("Sala criada com sucesso!", "success");
      const res = await api.fetchJson("/rooms");
      setRooms(res ?? []);
      setRoomForm({ name: "", capacity: "" });
    } catch (e: any) {
      toast(e?.message || "Erro ao criar sala", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateRoom() {
    if (!editingRoom || !roomForm.name) {
      toast("Nome é obrigatório", "error");
      return;
    }
    setSaving(true);
    try {
      await api.patchJson(`/rooms/${editingRoom.id}`, {
        name: roomForm.name,
        capacity: roomForm.capacity ? parseInt(roomForm.capacity) : null,
      });
      toast("Sala atualizada com sucesso!", "success");
      const res = await api.fetchJson("/rooms");
      setRooms(res ?? []);
      setEditingRoom(null);
      setRoomForm({ name: "", capacity: "" });
    } catch (e: any) {
      toast(e?.message || "Erro ao atualizar sala", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRoom(id: string) {
    if (!confirm("Tem certeza que deseja desativar esta sala?")) return;
    setSaving(true);
    try {
      await api.deleteJson(`/rooms/${id}`);
      toast("Sala desativada com sucesso!", "success");
      const res = await api.fetchJson("/rooms");
      setRooms(res ?? []);
    } catch (e: any) {
      toast(e?.message || "Erro ao desativar sala", "error");
    } finally {
      setSaving(false);
    }
  }

  function formatTime(time: string): string {
    if (!time) return "";
    if (time.includes("T")) {
      const date = new Date(time);
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
    return time.substring(0, 5);
  }

  function getBlockShift(
    startTime: string,
  ): "morning" | "afternoon" | "evening" {
    const t = formatTime(startTime);
    if (t < "12:30") return "morning";
    if (t < "18:30") return "afternoon";
    return "evening";
  }

  const activeTimeBlocks = useMemo(
    () =>
      timeBlocks
        .filter((tb) => tb.active)
        .filter(
          (tb) =>
            shiftFilter === "all" ||
            getBlockShift(tb.startTime) === shiftFilter,
        )
        .sort((a, b) => a.order - b.order),
    [timeBlocks, shiftFilter],
  );

  // FIX #10: Only show write buttons for SECRETARY role
  const canWrite = isSecretary;

  // Render function for day column using CSS Grid
  function renderDayColumn(day: number) {
    const cells: React.ReactNode[] = [];
    let i = 0;

    while (i < activeTimeBlocks.length) {
      const block = activeTimeBlocks[i];
      const key = `${day}-${block.id}`;
      const cellSchedules = scheduleGrid[key] || [];

      // Detectar quantos blocos consecutivos têm a mesma aula
      let span = 1;
      if (cellSchedules.length === 1) {
        while (i + span < activeTimeBlocks.length) {
          const nextBlock = activeTimeBlocks[i + span];
          // Verificar se é consecutivo por order
          if (nextBlock.order !== block.order + span) break;
          const nextKey = `${day}-${nextBlock.id}`;
          const nextSchedules = scheduleGrid[nextKey] || [];
          if (
            nextSchedules.length === 1 &&
            nextSchedules[0].subjectId === cellSchedules[0].subjectId &&
            nextSchedules[0].teacherId === cellSchedules[0].teacherId
          ) {
            span++;
          } else {
            break;
          }
        }
      }

      const heightPx = span * ROW_HEIGHT;

      cells.push(
        <div
          key={key}
          style={{
            gridRow: `span ${span}`,
            height: heightPx,
            borderBottom: "1px solid #f1f5f9",
            padding: 4,
            boxSizing: "border-box",
            cursor:
              canWrite && (selectedClassroom || selectedGradeLevel)
                ? "pointer"
                : "default",
          }}
          onClick={() => {
            if (!canWrite || (!selectedClassroom && !selectedGradeLevel))
              return;
            if (cellSchedules.length > 0) {
              openEditModal(cellSchedules[0]);
            } else {
              openCreateModal(day, block.id);
            }
          }}
        >
          {cellSchedules.length > 0 ? (
            cellSchedules.map((s) => (
              <div
                key={s.id}
                style={{
                  background: getSubjectColor(s.subjectId),
                  borderRadius: 7,
                  padding: "6px 8px",
                  height: "100%",
                  boxSizing: "border-box",
                  color: "white",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  gap: 2,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 12 }}>
                  {s.subject.name}
                </div>
                {s.teacher && (
                  <div style={{ fontSize: 10, opacity: 0.9 }}>
                    {s.teacher.name}
                  </div>
                )}
                {s.room && (
                  <div style={{ fontSize: 10, opacity: 0.85 }}>
                    {s.room.name}
                  </div>
                )}
                {span > 1 && (
                  <div
                    style={{
                      fontSize: 9,
                      opacity: 0.8,
                      marginTop: "auto",
                      borderTop: "1px solid rgba(255,255,255,0.3)",
                      paddingTop: 2,
                    }}
                  >
                    {span} blocos consecutivos
                  </div>
                )}
              </div>
            ))
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
        </div>
      );

      i += span;
    }

    return cells;
  }

  return (
    <PageShell
      title="Horário"
      description="Gerencie o calendário semanal de aulas por turma ou série."
    >
      {canWrite && (
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <PrimaryButton
            onClick={() => openCreateModal(1, activeTimeBlocks[0]?.id || "")}
          >
            + Criar Aula
          </PrimaryButton>
          <SecondaryButton onClick={openManageTimeBlocks}>
            Gerenciar Horários
          </SecondaryButton>
          <SecondaryButton onClick={openManageRooms}>
            Gerenciar Salas
          </SecondaryButton>
        </div>
      )}

      <Card>
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
              placeholder="Selecione a turma"
            />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              Turno:
            </label>
            <div style={{ display: "flex", gap: 4 }}>
              {[
                { value: "all", label: "Todos" },
                { value: "morning", label: "Matutino" },
                { value: "afternoon", label: "Vespertino" },
                { value: "evening", label: "Noturno" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setShiftFilter(
                      option.value as
                        | "all"
                        | "morning"
                        | "afternoon"
                        | "evening",
                    )
                  }
                  style={{
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "5px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    background:
                      shiftFilter === option.value ? "#0891b2" : "white",
                    color: shiftFilter === option.value ? "white" : "#374151",
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div
              style={{
                padding: "48px 14px",
                textAlign: "center",
                color: "#9ca3af",
              }}
            >
              Carregando...
            </div>
          ) : !selectedClassroom && !selectedGradeLevel ? (
            <div
              style={{
                padding: "48px 14px",
                textAlign: "center",
                color: "#9ca3af",
              }}
            >
              Selecione uma série ou turma para visualizar os horários.
            </div>
          ) : activeTimeBlocks.length === 0 ? (
            <div
              style={{
                padding: "48px 14px",
                textAlign: "center",
                color: "#9ca3af",
              }}
            >
              Nenhum bloco de horário configurado.
              {canWrite && ' Clique em "Gerenciar Horários" para configurar.'}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `90px repeat(${DAYS_TO_SHOW.length}, 1fr)`,
                minWidth: 800,
              }}
            >
              {/* Header row */}
              <div style={headerCellStyle} />
              {DAYS_TO_SHOW.map((day) => (
                <div
                  key={day}
                  style={{
                    ...headerCellStyle,
                    textAlign: "center",
                    borderLeft: "1px solid #e9ebf0",
                  }}
                >
                  {DAY_LABELS[day]}
                </div>
              ))}

              {/* Time column */}
              <div
                style={{
                  display: "grid",
                  gridTemplateRows: `repeat(${activeTimeBlocks.length}, ${ROW_HEIGHT}px)`,
                }}
              >
                {activeTimeBlocks.map((block) => (
                  <div
                    key={block.id}
                    style={{
                      height: ROW_HEIGHT,
                      padding: "8px 10px",
                      borderBottom: "1px solid #f1f5f9",
                      background: "#fafbfc",
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: "#6b7280",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {formatTime(block.startTime)} – {formatTime(block.endTime)}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {DAYS_TO_SHOW.map((day) => (
                <div
                  key={day}
                  style={{
                    borderLeft: "1px solid #e9ebf0",
                    position: "relative",
                    display: "grid",
                    gridTemplateRows: `repeat(${activeTimeBlocks.length}, ${ROW_HEIGHT}px)`,
                  }}
                >
                  {renderDayColumn(day)}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {canWrite && (
        <>
          <Modal
            open={modal === "create" || modal === "edit"}
            onClose={() => setModal(null)}
            title={modal === "create" ? "Criar Aula" : "Editar Aula"}
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

            <FormField label="Professor">
              <select
                value={formData.teacherId}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, teacherId: e.target.value }))
                }
                style={selectStyle}
              >
                <option value="">Selecione...</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Sala">
              <select
                value={formData.roomId}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, roomId: e.target.value }))
                }
                style={selectStyle}
              >
                <option value="">Selecione...</option>
                {rooms
                  .filter((r) => r.active)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.capacity ? `(${r.capacity})` : ""}
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

            <FormField label="Bloco de Horário" required>
              <select
                value={formData.timeBlockId}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, timeBlockId: e.target.value }))
                }
                style={selectStyle}
              >
                <option value="">Selecione...</option>
                {activeTimeBlocks.map((tb) => (
                  <option key={tb.id} value={tb.id}>
                    {tb.name} ({formatTime(tb.startTime)} -{" "}
                    {formatTime(tb.endTime)})
                  </option>
                ))}
              </select>
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

          <Modal
            open={modal === "manageTimeBlocks"}
            onClose={() => setModal(null)}
            title="Gerenciar Horários"
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="Nome (ex: 1º horário)"
                  value={
                    editingTimeBlock ? timeBlockForm.name : timeBlockForm.name
                  }
                  onChange={(e) =>
                    setTimeBlockForm((f) => ({ ...f, name: e.target.value }))
                  }
                  style={{ ...inputStyle, flex: 1 }}
                />
                <input
                  type="time"
                  value={timeBlockForm.startTime}
                  onChange={(e) =>
                    setTimeBlockForm((f) => ({
                      ...f,
                      startTime: e.target.value,
                    }))
                  }
                  style={{ width: 100 }}
                />
                <input
                  type="time"
                  value={timeBlockForm.endTime}
                  onChange={(e) =>
                    setTimeBlockForm((f) => ({ ...f, endTime: e.target.value }))
                  }
                  style={{ width: 100 }}
                />
                <PrimaryButton
                  onClick={
                    editingTimeBlock
                      ? handleUpdateTimeBlock
                      : handleCreateTimeBlock
                  }
                  loading={saving}
                >
                  {editingTimeBlock ? "Salvar" : "Adicionar"}
                </PrimaryButton>
              </div>
            </div>

            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ padding: 8, textAlign: "left", fontSize: 12 }}>
                      Ordem
                    </th>
                    <th style={{ padding: 8, textAlign: "left", fontSize: 12 }}>
                      Nome
                    </th>
                    <th style={{ padding: 8, textAlign: "left", fontSize: 12 }}>
                      Horário
                    </th>
                    <th
                      style={{ padding: 8, textAlign: "right", fontSize: 12 }}
                    >
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {timeBlocks
                    .sort((a, b) => a.order - b.order)
                    .map((block) => (
                      <tr
                        key={block.id}
                        style={{ borderBottom: "1px solid #f1f5f9" }}
                      >
                        <td style={{ padding: 8, fontSize: 12 }}>
                          {block.order + 1}
                        </td>
                        <td style={{ padding: 8, fontSize: 12 }}>
                          {block.name}
                        </td>
                        <td style={{ padding: 8, fontSize: 12 }}>
                          {formatTime(block.startTime)} -{" "}
                          {formatTime(block.endTime)}
                        </td>
                        <td style={{ padding: 8, textAlign: "right" }}>
                          <PrimaryButton
                            variant="ghost"
                            onClick={() => {
                              setEditingTimeBlock(block);
                              setTimeBlockForm({
                                name: block.name,
                                startTime: formatTime(block.startTime),
                                endTime: formatTime(block.endTime),
                              });
                            }}
                            style={{ marginRight: 4, padding: "4px 8px" }}
                          >
                            Editar
                          </PrimaryButton>
                          <PrimaryButton
                            variant="danger"
                            onClick={() => handleDeleteTimeBlock(block.id)}
                            loading={saving}
                            style={{ padding: "4px 8px" }}
                          >
                            Desativar
                          </PrimaryButton>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <ModalFooter>
              <PrimaryButton onClick={() => setModal(null)}>
                Fechar
              </PrimaryButton>
            </ModalFooter>
          </Modal>

          <Modal
            open={modal === "manageRooms"}
            onClose={() => setModal(null)}
            title="Gerenciar Salas"
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="Nome da sala"
                  value={editingRoom ? roomForm.name : roomForm.name}
                  onChange={(e) =>
                    setRoomForm((f) => ({ ...f, name: e.target.value }))
                  }
                  style={{ ...inputStyle, flex: 1 }}
                />
                <input
                  type="number"
                  placeholder="Capacidade"
                  value={roomForm.capacity}
                  onChange={(e) =>
                    setRoomForm((f) => ({ ...f, capacity: e.target.value }))
                  }
                  style={{ width: 100 }}
                />
                <PrimaryButton
                  onClick={editingRoom ? handleUpdateRoom : handleCreateRoom}
                  loading={saving}
                >
                  {editingRoom ? "Salvar" : "Adicionar"}
                </PrimaryButton>
              </div>
            </div>

            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ padding: 8, textAlign: "left", fontSize: 12 }}>
                      Nome
                    </th>
                    <th style={{ padding: 8, textAlign: "left", fontSize: 12 }}>
                      Capacidade
                    </th>
                    <th style={{ padding: 8, textAlign: "left", fontSize: 12 }}>
                      Status
                    </th>
                    <th
                      style={{ padding: 8, textAlign: "right", fontSize: 12 }}
                    >
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr
                      key={room.id}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                    >
                      <td style={{ padding: 8, fontSize: 12 }}>{room.name}</td>
                      <td style={{ padding: 8, fontSize: 12 }}>
                        {room.capacity || "-"}
                      </td>
                      <td style={{ padding: 8, fontSize: 12 }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            background: room.active ? "#d1fae5" : "#fee2e2",
                            color: room.active ? "#065f46" : "#991b1b",
                          }}
                        >
                          {room.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td style={{ padding: 8, textAlign: "right" }}>
                        <PrimaryButton
                          variant="ghost"
                          onClick={() => {
                            setEditingRoom(room);
                            setRoomForm({
                              name: room.name,
                              capacity: room.capacity?.toString() || "",
                            });
                          }}
                          style={{ marginRight: 4, padding: "4px 8px" }}
                        >
                          Editar
                        </PrimaryButton>
                        <PrimaryButton
                          variant="danger"
                          onClick={() => handleDeleteRoom(room.id)}
                          loading={saving}
                          style={{ padding: "4px 8px" }}
                        >
                          Desativar
                        </PrimaryButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ModalFooter>
              <PrimaryButton onClick={() => setModal(null)}>
                Fechar
              </PrimaryButton>
            </ModalFooter>
          </Modal>
        </>
      )}
    </PageShell>
  );
}
