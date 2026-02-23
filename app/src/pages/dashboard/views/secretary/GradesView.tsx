import React, { useEffect, useState } from "react";
import api from "../../../../utils/api";
import {
  PageShell,
  Card,
  PrimaryButton,
  SelectFilter,
  DataTable,
  StatusBadge,
  toast,
} from "../../../../components/ui";

type Classroom = { id: string; name: string; gradeLevel?: { name: string } };
type Assessment = {
  id: string;
  title: string;
  type: string;
  maxScore: number;
  date: string;
};
type Grade = {
  enrollmentId: string;
  score: number | null;
  enrollment?: { student?: { name: string } };
};
type Enrollment = { id: string; student?: { name: string } };

export default function GradesView() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadClassrooms() {
      try {
        const res = await api.fetchJson("/classrooms?limit=100");
        setClassrooms(res?.data ?? res ?? []);
      } catch {}
    }
    loadClassrooms();
  }, []);

  useEffect(() => {
    if (!selectedClassroom) {
      setAssessments([]);
      setEnrollments([]);
      setGrades([]);
      setSelectedAssessment("");
      return;
    }
    async function load() {
      try {
        const [a, e] = await Promise.all([
          api.fetchJson(
            `/assessments?classroomId=${selectedClassroom}&limit=100`,
          ),
          api.fetchJson(
            `/enrollments?classroomId=${selectedClassroom}&limit=100`,
          ),
        ]);
        setAssessments(a?.data ?? a ?? []);
        setEnrollments(e?.data ?? e ?? []);
        setSelectedAssessment("");
        setGrades([]);
      } catch (err: any) {
        toast(err?.message || "Erro ao carregar dados da turma.", "error");
      }
    }
    load();
  }, [selectedClassroom]);

  useEffect(() => {
    if (!selectedAssessment) {
      setGrades([]);
      return;
    }
    setLoading(true);
    async function load() {
      try {
        const res = await api.fetchJson(
          `/assessments/${selectedAssessment}/grades?limit=200`,
        );
        setGrades(res?.data ?? res ?? []);
      } catch (err: any) {
        toast(err?.message || "Erro ao carregar notas.", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedAssessment]);

  const assessment = assessments.find((a) => a.id === selectedAssessment);
  const gradeMap = new Map(grades.map((g) => [g.enrollmentId, g.score]));
  const passing = assessment
    ? enrollments.filter(
        (e) => (gradeMap.get(e.id) ?? -1) >= assessment.maxScore * 0.6,
      ).length
    : 0;
  const failing = assessment
    ? enrollments.filter(
        (e) =>
          (gradeMap.get(e.id) ?? -1) >= 0 &&
          (gradeMap.get(e.id) ?? -1) < assessment.maxScore * 0.6,
      ).length
    : 0;
  const notGraded = assessment
    ? enrollments.filter((e) => gradeMap.get(e.id) == null).length
    : 0;

  const columns = [
    { key: "student", label: "Aluno" },
    { key: "score", label: "Nota", width: 80 },
    { key: "max", label: "Máx", width: 60 },
    { key: "pct", label: "%", width: 60 },
    { key: "status", label: "Situação", width: 100 },
  ];

  const rows = enrollments.map((e) => {
    const score = gradeMap.get(e.id);
    const max = assessment?.maxScore ?? 10;
    const pct = score != null ? Math.round((score / max) * 100) : null;
    const status =
      score == null ? "—" : score >= max * 0.6 ? "Aprovado" : "Reprovado";
    const statusColor =
      score == null ? "gray" : score >= max * 0.6 ? "green" : "red";
    return [
      <span style={{ fontWeight: 600, color: "#111827" }}>
        {e.student?.name || "—"}
      </span>,
      <span
        style={{
          fontWeight: 700,
          color: "#374151",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {score != null ? (
          Number(score).toFixed(1)
        ) : (
          <span style={{ color: "#d1d5db" }}>—</span>
        )}
      </span>,
      <span style={{ color: "#6b7280" }}>{max}</span>,
      <span
        style={{
          color: pct != null ? (pct >= 60 ? "#16a34a" : "#dc2626") : "#9ca3af",
          fontWeight: 600,
        }}
      >
        {pct != null ? `${pct}%` : "—"}
      </span>,
      score == null ? (
        <span style={{ color: "#9ca3af", fontSize: 12 }}>Sem nota</span>
      ) : (
        <StatusBadge label={status} color={statusColor as any} />
      ),
    ];
  });

  return (
    <PageShell
      title="Notas"
      description="Visualize as notas por turma e avaliação. Edição disponível apenas para professores."
    >
      <Card>
        <div
          style={{
            padding: "16px 16px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.4px",
              }}
            >
              Turma
            </label>
            <SelectFilter
              value={selectedClassroom}
              onChange={setSelectedClassroom}
              options={classrooms.map((c) => ({
                value: c.id,
                label: `${c.name}${c.gradeLevel ? ` — ${c.gradeLevel.name}` : ""}`,
              }))}
              placeholder="Selecione a turma..."
            />
          </div>
          {selectedClassroom && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                }}
              >
                Avaliação
              </label>
              <SelectFilter
                value={selectedAssessment}
                onChange={setSelectedAssessment}
                options={assessments.map((a) => ({
                  value: a.id,
                  label: `${a.title} (${new Date(a.date).toLocaleDateString("pt-BR")})`,
                }))}
                placeholder="Selecione a avaliação..."
              />
            </div>
          )}
        </div>

        {selectedAssessment && assessment && (
          <div
            style={{
              padding: "12px 16px",
              background: "#f8fafc",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 12.5 }}>
              <span style={{ color: "#6b7280" }}>Avaliação: </span>
              <span style={{ fontWeight: 700, color: "#111827" }}>
                {assessment.title}
              </span>
            </div>
            <div style={{ fontSize: 12.5 }}>
              <span style={{ color: "#6b7280" }}>Tipo: </span>
              <span style={{ fontWeight: 600 }}>{assessment.type}</span>
            </div>
            <div style={{ fontSize: 12.5 }}>
              <span style={{ color: "#16a34a", fontWeight: 700 }}>
                ✓ {passing} aprovados
              </span>
            </div>
            <div style={{ fontSize: 12.5 }}>
              <span style={{ color: "#dc2626", fontWeight: 700 }}>
                ✗ {failing} reprovados
              </span>
            </div>
            {notGraded > 0 && (
              <div style={{ fontSize: 12.5 }}>
                <span style={{ color: "#9ca3af", fontWeight: 700 }}>
                  ○ {notGraded} sem nota
                </span>
              </div>
            )}
          </div>
        )}

        {!selectedClassroom ? (
          <div
            style={{
              padding: "60px 16px",
              textAlign: "center",
              color: "#9ca3af",
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ margin: "0 auto 10px", display: "block" }}
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Selecione uma turma para visualizar as notas.
          </div>
        ) : !selectedAssessment ? (
          <div
            style={{
              padding: "60px 16px",
              textAlign: "center",
              color: "#9ca3af",
            }}
          >
            Selecione uma avaliação para ver as notas dos alunos.
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            loading={loading}
            emptyMessage="Nenhum aluno matriculado nesta turma."
          />
        )}
      </Card>
    </PageShell>
  );
}
