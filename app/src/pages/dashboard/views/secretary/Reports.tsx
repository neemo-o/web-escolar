import React, { useEffect, useState } from "react";
import api from "../../../../utils/api";
import {
  PageShell,
  Card,
  StatCard,
  SelectFilter,
  toast,
} from "../../../../components/ui";

const accent = "#0891b2";

function MiniBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div
      style={{
        flex: 1,
        height: 8,
        background: "#f1f5f9",
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: 4,
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}

type EnrollmentByClassroom = { classroomName: string; count: number };
type GradeDistItem = { range: string; count: number; color: string };

export default function Reports() {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [yearFilter, setYearFilter] = useState("");
  const [years, setYears] = useState<{ id: string; year: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [c, e, u, y] = await Promise.all([
          api.fetchJson("/classrooms?limit=100"),
          api.fetchJson(`/enrollments?status=ATIVA&limit=200`),
          api.fetchJson("/users?limit=200"),
          api.fetchJson("/academic-years?limit=10"),
        ]);
        setClassrooms(c?.data ?? c ?? []);
        setEnrollments(e?.data ?? e ?? []);
        setUsers(u?.data ?? u ?? []);
        setYears(
          (y?.data ?? y ?? []).map((x: any) => ({ id: x.id, year: x.year })),
        );
      } catch (err: any) {
        toast(err?.message || "Erro ao carregar dados", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalStudents = users.filter((u) => u.role === "STUDENT").length;
  const totalTeachers = users.filter((u) => u.role === "TEACHER").length;
  const totalGuardians = users.filter((u) => u.role === "GUARDIAN").length;
  const totalEnrollments = enrollments.length;
  const totalClassrooms = classrooms.length;

  const enrollmentsByClassroom: EnrollmentByClassroom[] = classrooms
    .map((c) => ({
      classroomName: c.name,
      count: enrollments.filter(
        (e) => e.classroomId === c.id || e.classroom?.id === c.id,
      ).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const maxEnrollment = Math.max(
    ...enrollmentsByClassroom.map((e) => e.count),
    1,
  );

  const byRole = [
    { label: "Alunos", count: totalStudents, color: "#f59e0b" },
    { label: "Professores", count: totalTeachers, color: "#10b981" },
    { label: "Responsáveis", count: totalGuardians, color: "#8b5cf6" },
    {
      label: "Secretaria",
      count: users.filter((u) => u.role === "SECRETARY").length,
      color: accent,
    },
  ];
  const maxRole = Math.max(...byRole.map((r) => r.count), 1);

  const shiftCounts: Record<string, number> = {};
  classrooms.forEach((c) => {
    shiftCounts[c.shift] = (shiftCounts[c.shift] || 0) + 1;
  });
  const SHIFT_LABELS: Record<string, string> = {
    MANHA: "Manhã",
    TARDE: "Tarde",
    NOTURNO: "Noturno",
    INTEGRAL: "Integral",
  };
  const SHIFT_COLORS: Record<string, string> = {
    MANHA: "#3b82f6",
    TARDE: "#f59e0b",
    NOTURNO: "#8b5cf6",
    INTEGRAL: "#10b981",
  };
  const shiftData = Object.entries(shiftCounts)
    .map(([shift, count]) => ({
      shift: SHIFT_LABELS[shift] || shift,
      count,
      color: SHIFT_COLORS[shift] || "#6b7280",
    }))
    .sort((a, b) => b.count - a.count);
  const maxShift = Math.max(...shiftData.map((s) => s.count), 1);

  return (
    <PageShell
      title="Relatórios"
      description="Visão consolidada das métricas da escola."
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>
          Carregando dados...
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <StatCard
              label="Alunos"
              value={totalStudents}
              color="#f59e0b"
              icon={
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              }
            />
            <StatCard
              label="Professores"
              value={totalTeachers}
              color="#10b981"
              icon={
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
            />
            <StatCard
              label="Turmas ativas"
              value={totalClassrooms}
              color={accent}
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
            <StatCard
              label="Matrículas ativas"
              value={totalEnrollments}
              color="#6366f1"
              icon={
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              }
            />
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <Card>
              <div
                style={{
                  padding: "16px 18px",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <span
                  style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}
                >
                  Alunos por turma
                </span>
              </div>
              <div
                style={{
                  padding: "14px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {enrollmentsByClassroom.length === 0 ? (
                  <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>
                    Sem dados disponíveis.
                  </p>
                ) : (
                  enrollmentsByClassroom.map((row) => (
                    <div
                      key={row.classroomName}
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <span
                        style={{
                          width: 90,
                          fontSize: 12.5,
                          color: "#374151",
                          fontWeight: 600,
                          flexShrink: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.classroomName}
                      </span>
                      <MiniBar
                        value={row.count}
                        max={maxEnrollment}
                        color={accent}
                      />
                      <span
                        style={{
                          width: 28,
                          textAlign: "right",
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "#374151",
                          flexShrink: 0,
                        }}
                      >
                        {row.count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <div
                style={{
                  padding: "16px 18px",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <span
                  style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}
                >
                  Usuários por perfil
                </span>
              </div>
              <div
                style={{
                  padding: "14px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {byRole.map((r) => (
                  <div
                    key={r.label}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: r.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        width: 90,
                        fontSize: 12.5,
                        color: "#374151",
                        fontWeight: 600,
                      }}
                    >
                      {r.label}
                    </span>
                    <MiniBar value={r.count} max={maxRole} color={r.color} />
                    <span
                      style={{
                        width: 28,
                        textAlign: "right",
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "#374151",
                        flexShrink: 0,
                      }}
                    >
                      {r.count}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}
          >
            <Card>
              <div
                style={{
                  padding: "16px 18px",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <span
                  style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}
                >
                  Turmas por turno
                </span>
              </div>
              <div
                style={{
                  padding: "14px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {shiftData.length === 0 ? (
                  <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>
                    Sem turmas cadastradas.
                  </p>
                ) : (
                  shiftData.map((s) => (
                    <div
                      key={s.shift}
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 3,
                          background: s.color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          width: 70,
                          fontSize: 12.5,
                          color: "#374151",
                          fontWeight: 600,
                        }}
                      >
                        {s.shift}
                      </span>
                      <MiniBar value={s.count} max={maxShift} color={s.color} />
                      <span
                        style={{
                          width: 24,
                          textAlign: "right",
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "#374151",
                          flexShrink: 0,
                        }}
                      >
                        {s.count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <div
                style={{
                  padding: "16px 18px",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <span
                  style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}
                >
                  Resumo geral
                </span>
              </div>
              <div style={{ padding: "16px 18px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  {[
                    {
                      label: "Total de usuários",
                      value: users.length,
                      color: "#111827",
                    },
                    {
                      label: "Média alunos/turma",
                      value:
                        totalClassrooms > 0
                          ? (totalEnrollments / totalClassrooms).toFixed(1)
                          : "—",
                      color: accent,
                    },
                    {
                      label: "Responsáveis",
                      value: totalGuardians,
                      color: "#8b5cf6",
                    },
                    {
                      label: "Matrículas ativas",
                      value: totalEnrollments,
                      color: "#16a34a",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        padding: "14px",
                        background: "#f8fafc",
                        borderRadius: 10,
                        border: "1px solid #f1f5f9",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 22,
                          fontWeight: 800,
                          color: item.color,
                          letterSpacing: "-0.5px",
                        }}
                      >
                        {item.value}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "#6b7280",
                          marginTop: 3,
                        }}
                      >
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </PageShell>
  );
}
