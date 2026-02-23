import React, { useEffect, useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../../../utils/api";
import { Card, StatCard, toast } from "../../../../components/ui";

const accent = "#0891b2";

// ─── NAV SHORTCUTS POR ROLE ──────────────────────────────────────────────────
const SHORTCUTS: Record<
  string,
  { label: string; icon: React.ReactNode; path: string; color: string }[]
> = {
  TEACHER: [
    {
      label: "Minhas Turmas",
      path: "my-classrooms",
      color: "#10b981",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      label: "Avaliações",
      path: "assessments",
      color: "#f59e0b",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
    {
      label: "Lançar Notas",
      path: "grades",
      color: "#6366f1",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      label: "Meus Alunos",
      path: "my-students",
      color: "#0891b2",
      icon: (
        <svg
          width="18"
          height="18"
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
      ),
    },
  ],
  STUDENT: [
    {
      label: "Minhas Notas",
      path: "my-grades",
      color: "#6366f1",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      label: "Avaliações",
      path: "my-assessments",
      color: "#f59e0b",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      label: "Meu Progresso",
      path: "my-progress",
      color: "#10b981",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      label: "Minhas Turmas",
      path: "student-classrooms",
      color: "#0891b2",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
  ],
  GUARDIAN: [
    {
      label: "Notas",
      path: "student-grades",
      color: "#6366f1",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      label: "Progresso",
      path: "student-progress",
      color: "#10b981",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      label: "Frequência",
      path: "student-health",
      color: "#f59e0b",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      label: "Avaliações",
      path: "student-assessments",
      color: "#0891b2",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
  ],
  ADMIN_GLOBAL: [
    {
      label: "Escolas",
      path: "schools",
      color: "#7c3aed",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      label: "Usuários",
      path: "global-users",
      color: "#0891b2",
      icon: (
        <svg
          width="18"
          height="18"
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
      ),
    },
    {
      label: "Relatórios",
      path: "reports",
      color: "#10b981",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      label: "Auditoria",
      path: "audit",
      color: "#f59e0b",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  SECRETARY: "Secretaria",
  TEACHER: "Professor",
  STUDENT: "Aluno",
  GUARDIAN: "Responsável",
  ADMIN_GLOBAL: "Administrador Global",
};

// ─── SECRETARY / ADMIN STATS ──────────────────────────────────────────────────
function SecretaryPanel({ school }: { school: any }) {
  const [data, setData] = useState({
    students: 0,
    teachers: 0,
    classrooms: 0,
    enrollments: 0,
    guardians: 0,
  });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [usersRes, classRes, enrollRes] = await Promise.all([
          api.fetchJson("/users?limit=200"),
          api.fetchJson("/classrooms?limit=1"),
          api.fetchJson("/enrollments?status=ATIVA&limit=5"),
        ]);
        const users: any[] = usersRes?.data ?? usersRes ?? [];
        setData({
          students: users.filter((u) => u.role === "STUDENT").length,
          teachers: users.filter((u) => u.role === "TEACHER").length,
          guardians: users.filter((u) => u.role === "GUARDIAN").length,
          classrooms:
            classRes?.meta?.total ?? (classRes?.data ?? classRes ?? []).length,
          enrollments:
            enrollRes?.meta?.total ??
            (enrollRes?.data ?? enrollRes ?? []).length,
        });
        setRecent(enrollRes?.data ?? enrollRes ?? []);
      } catch (e: any) {
        toast(e?.message || "Erro ao carregar dados", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
        Carregando...
      </div>
    );

  return (
    <>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          {
            label: "Alunos",
            value: data.students,
            color: "#f59e0b",
            icon: (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            ),
          },
          {
            label: "Professores",
            value: data.teachers,
            color: "#10b981",
            icon: (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            ),
          },
          {
            label: "Responsáveis",
            value: data.guardians,
            color: "#8b5cf6",
            icon: (
              <svg
                width="18"
                height="18"
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
            ),
          },
          {
            label: "Turmas",
            value: data.classrooms,
            color: accent,
            icon: (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            ),
          },
          {
            label: "Matrículas ativas",
            value: data.enrollments,
            color: "#6366f1",
            icon: (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            ),
          },
        ].map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            color={s.color}
            icon={s.icon}
          />
        ))}
      </div>

      {recent.length > 0 && (
        <Card>
          <div
            style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}
          >
            <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>
              Matrículas recentes
            </span>
          </div>
          {recent.map((e: any, i: number) => (
            <div
              key={e.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 18px",
                borderBottom:
                  i < recent.length - 1 ? "1px solid #f8fafc" : "none",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: `${accent}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: accent,
                  fontSize: 13,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {(e.student?.name || "?").charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: "#111827",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {e.student?.name || "—"}
                </div>
                <div style={{ fontSize: 11.5, color: "#6b7280" }}>
                  {e.classroom?.name || "—"} · {e.academicYear?.year || "—"}
                </div>
              </div>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  background: "#dcfce7",
                  color: "#166534",
                  whiteSpace: "nowrap",
                }}
              >
                Ativa
              </span>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

// ─── GENERIC PANEL (outros roles) ────────────────────────────────────────────
function GenericPanel({
  role,
  user,
  school,
}: {
  role: string;
  user: any;
  school: any;
}) {
  const navigate = useNavigate();
  const shortcuts = SHORTCUTS[role] || [];

  return (
    <>
      {shortcuts.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 12,
          }}
        >
          {shortcuts.map((s) => (
            <button
              key={s.path}
              onClick={() => navigate(`/dashboard/${s.path}`)}
              style={{
                background: "#fff",
                border: "1px solid #e9ebf0",
                borderRadius: 14,
                padding: "18px 16px",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                transition: "border-color 0.15s, box-shadow 0.15s",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  s.color;
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  `0 4px 16px ${s.color}20`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "#e9ebf0";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: `${s.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: s.color,
                }}
              >
                {s.icon}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                {s.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function Overview() {
  const { user, school } = useAuth();
  const role = user?.role || "";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = (user?.name || "Usuário").split(" ")[0];

  const isSecretaryOrAdmin = role === "SECRETARY" || role === "ADMIN_GLOBAL";

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "28px 28px 40px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {/* Banner de boas-vindas */}
      <div
        style={{
          borderRadius: 16,
          background: `linear-gradient(135deg, ${accent} 0%, #0e7490 100%)`,
          padding: "24px 28px",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            right: -70,
            top: -70,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 130,
            height: 130,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            right: 90,
            bottom: -50,
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12.5, opacity: 0.7 }}>
            {school?.name || "Sistema Educacional"} ·{" "}
            {ROLE_LABELS[role] || role}
          </p>
          <h1
            style={{
              margin: "0 0 6px",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.5px",
            }}
          >
            {greeting}, {firstName}!
          </h1>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.7 }}>
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Conteúdo específico por role */}
      {isSecretaryOrAdmin ? (
        <SecretaryPanel school={school} />
      ) : (
        <GenericPanel role={role} user={user} school={school} />
      )}
    </div>
  );
}
