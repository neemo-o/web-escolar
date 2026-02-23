import React, { useEffect, useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import api from "../../../../utils/api";
import { StatCard, Card, toast } from "../../../../components/ui";

const accent = "#0891b2";

type Activity = { label: string; sub: string; color: string; time: string };

function QuickStat({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  color: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 110,
        padding: "14px 16px",
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e9ebf0",
      }}
    >
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color,
          letterSpacing: "-0.5px",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export default function Overview() {
  const { user, school } = useAuth();
  const role = user?.role;
  const [data, setData] = useState({
    students: 0,
    teachers: 0,
    classrooms: 0,
    enrollments: 0,
    guardians: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentEnrollments, setRecentEnrollments] = useState<any[]>([]);

  useEffect(() => {
    if (role !== "SECRETARY" && role !== "ADMIN_GLOBAL") {
      setLoading(false);
      return;
    }
    async function load() {
      setLoading(true);
      try {
        const [u, c, e] = await Promise.all([
          api.fetchJson("/users?limit=1"),
          api.fetchJson("/classrooms?limit=1"),
          api.fetchJson("/enrollments?status=ATIVA&limit=5"),
        ]);
        const allUsers = await api.fetchJson("/users?limit=200");
        const usersArr = allUsers?.data ?? allUsers ?? [];
        setData({
          students: usersArr.filter((x: any) => x.role === "STUDENT").length,
          teachers: usersArr.filter((x: any) => x.role === "TEACHER").length,
          guardians: usersArr.filter((x: any) => x.role === "GUARDIAN").length,
          classrooms: c?.meta?.total ?? (c?.data ?? c ?? []).length,
          enrollments: e?.meta?.total ?? (e?.data ?? e ?? []).length,
        });
        setRecentEnrollments(e?.data ?? e ?? []);
      } catch (err: any) {
        toast(err?.message || "Erro ao carregar dados", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [role]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = user?.name?.split(" ")[0] || "Usuário";

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
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            right: -60,
            top: -60,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            right: 80,
            bottom: -40,
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, opacity: 0.75 }}>
            {school?.name || "Escola"}
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

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
          Carregando...
        </div>
      ) : role === "SECRETARY" || role === "ADMIN_GLOBAL" ? (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <QuickStat label="Alunos" value={data.students} color="#f59e0b" />
            <QuickStat
              label="Professores"
              value={data.teachers}
              color="#10b981"
            />
            <QuickStat
              label="Responsáveis"
              value={data.guardians}
              color="#8b5cf6"
            />
            <QuickStat label="Turmas" value={data.classrooms} color={accent} />
            <QuickStat
              label="Matrículas ativas"
              value={data.enrollments}
              color="#6366f1"
            />
          </div>

          {recentEnrollments.length > 0 && (
            <Card>
              <div
                style={{
                  padding: "14px 18px",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <span
                  style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}
                >
                  Matrículas recentes
                </span>
              </div>
              <div style={{ padding: "0" }}>
                {recentEnrollments.map((e, i) => (
                  <div
                    key={e.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "11px 18px",
                      borderBottom:
                        i < recentEnrollments.length - 1
                          ? "1px solid #f8fafc"
                          : "none",
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
                        fontSize: 11,
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
                        {e.classroom?.name || "—"} ·{" "}
                        {e.academicYear?.year || "—"}
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
                      }}
                    >
                      Ativa
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "48px 20px",
            color: "#9ca3af",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ margin: "0 auto 12px", display: "block" }}
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Use o menu lateral para navegar pelas suas funcionalidades.
        </div>
      )}
    </div>
  );
}
