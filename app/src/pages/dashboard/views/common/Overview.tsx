import React, { useEffect, useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../../../utils/api";
import { PageShell, Card, StatCard, toast } from "../../../../components/ui";

const SHORTCUTS: Record<string, { label: string; icon: React.ReactNode; path: string; color: string }[]> = {
  TEACHER: [
    { label: "Minhas Turmas", path: "my-classrooms", color: "#10b981", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg> },
    { label: "Avaliações", path: "assessments", color: "#f59e0b", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg> },
    { label: "Lançar Notas", path: "grades", color: "#6366f1", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg> },
    { label: "Meus Alunos", path: "my-students", color: "#ec4899", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
  ],
  STUDENT: [
    { label: "Minhas Notas", path: "my-grades", color: "#6366f1", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg> },
    { label: "Avaliações", path: "my-assessments", color: "#f59e0b", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg> },
    { label: "Meu Progresso", path: "my-progress", color: "#10b981", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg> },
    { label: "Minhas Turmas", path: "student-classrooms", color: "#0891b2", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg> },
  ],
  GUARDIAN: [
    { label: "Notas", path: "student-grades", color: "#6366f1", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg> },
    { label: "Progresso", path: "student-progress", color: "#10b981", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg> },
    { label: "Frequência", path: "student-health", color: "#f59e0b", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
    { label: "Avaliações", path: "student-assessments", color: "#ec4899", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /></svg> },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  SECRETARY: "Secretaria", TEACHER: "Professor", STUDENT: "Aluno",
  GUARDIAN: "Responsável", ADMIN_GLOBAL: "Administrador",
};

// ── SECRETARY / ADMIN panel — FIX #4: uses /users/stats, not limit=200 ──────
function SecretaryPanel() {
  const [stats, setStats] = useState({ students: 0, teachers: 0, guardians: 0, secretaries: 0 });
  const [classroomsTotal, setClassroomsTotal] = useState(0);
  const [enrollmentsTotal, setEnrollmentsTotal] = useState(0);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [statsRes, classRes, enrollRes] = await Promise.all([
          api.fetchJson("/users/stats"),         // FIX #4: dedicated stats endpoint
          api.fetchJson("/classrooms?limit=1"),
          api.fetchJson("/enrollments?status=ATIVA&limit=5"),
        ]);
        setStats(statsRes);
        setClassroomsTotal(classRes?.meta?.total ?? 0);
        setEnrollmentsTotal(enrollRes?.meta?.total ?? 0);
        setRecent(enrollRes?.data ?? []);
      } catch (e: any) {
        toast(e?.message || "Erro ao carregar painel", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="Alunos" value={loading ? "..." : stats.students} color="#6366f1" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>} />
        <StatCard label="Professores" value={loading ? "..." : stats.teachers} color="#10b981" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>} />
        <StatCard label="Responsáveis" value={loading ? "..." : stats.guardians} color="#f59e0b" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>} />
        <StatCard label="Turmas" value={loading ? "..." : classroomsTotal} color="#0891b2" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>} />
        <StatCard label="Matrículas ativas" value={loading ? "..." : enrollmentsTotal} color="#ec4899" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>} />
      </div>

      <Card>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>Últimas matrículas</span>
        </div>
        {loading ? (
          <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Carregando...</div>
        ) : recent.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Nenhuma matrícula recente.</div>
        ) : (
          recent.map((e: any) => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid #f8fafc" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{e.student?.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{e.classroom?.name} · {e.academicYear?.year}</div>
              </div>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{e.enrollmentNumber}</span>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

// ── Generic role panel ────────────────────────────────────────────────────────
function GenericPanel({ role, user }: { role: string; user: any }) {
  const navigate = useNavigate();
  const shortcuts = SHORTCUTS[role] || [];
  const now = new Date();
  const hours = now.getHours();
  const greeting = hours < 12 ? "Bom dia" : hours < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div>
      <Card style={{ marginBottom: 20, padding: "24px 28px" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>
          {greeting}, {user?.name?.split(" ")[0] || "bem-vindo"}!
        </div>
        <div style={{ fontSize: 14, color: "#6b7280" }}>
          {ROLE_LABELS[role]} · {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </Card>

      {shortcuts.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
          {shortcuts.map(s => (
            <button key={s.path} onClick={() => navigate(`/dashboard/${s.path}`)}
              style={{ background: "#fff", border: `2px solid ${s.color}20`, borderRadius: 14, padding: "20px 18px", cursor: "pointer", textAlign: "left", transition: "all 0.15s", fontFamily: "inherit" }}
              onMouseEnter={e => (e.currentTarget.style.background = `${s.color}08`)}
              onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
            >
              <div style={{ color: s.color, marginBottom: 10 }}>{s.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{s.label}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Overview() {
  const { user } = useAuth();
  const role = user?.role || "";
  const isSecretaryOrAdmin = role === "SECRETARY" || role === "ADMIN_GLOBAL";

  return (
    <PageShell title="Painel" description="Visão geral do sistema.">
      <div style={{ maxWidth: 900 }}>
        {isSecretaryOrAdmin ? <SecretaryPanel /> : <GenericPanel role={role} user={user} />}
      </div>
    </PageShell>
  );
}
