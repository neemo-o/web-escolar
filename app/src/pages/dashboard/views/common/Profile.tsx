import React, { useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import api from "../../../../utils/api";
import {
  PageShell,
  Card,
  FormField,
  Input,
  PrimaryButton,
  InlineAlert,
  toast,
} from "../../../../components/ui";

const ROLE_LABELS: Record<string, string> = {
  ADMIN_GLOBAL: "Administrador Global",
  SECRETARY: "Secretaria",
  TEACHER: "Professor",
  STUDENT: "Aluno",
  GUARDIAN: "Responsável",
};
const ROLE_COLORS: Record<string, string> = {
  ADMIN_GLOBAL: "#7c3aed",
  SECRETARY: "#0891b2",
  TEACHER: "#059669",
  STUDENT: "#d97706",
  GUARDIAN: "#db2777",
};

export default function Profile() {
  const { user, school } = useAuth();
  const role = user?.role || "";
  const color = ROLE_COLORS[role] || "#6366f1";

  const initials = (user?.name || "?")
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  function setF(patch: Partial<typeof pwForm>) {
    setPwForm((f) => ({ ...f, ...patch }));
    setPwError("");
    setPwSuccess(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!pwForm.current) {
      setPwError("Informe a senha atual.");
      return;
    }
    if (pwForm.next.length < 8) {
      setPwError("A nova senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError("As senhas não coincidem.");
      return;
    }
    setPwSaving(true);
    setPwError("");
    try {
      await api.fetchJson("/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword: pwForm.current,
          newPassword: pwForm.next,
        }),
      });
      setPwSuccess(true);
      setPwForm({ current: "", next: "", confirm: "" });
      toast("Senha alterada com sucesso!");
    } catch (e: any) {
      setPwError(e?.message || "Erro ao alterar senha.");
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <PageShell
      title="Meu Perfil"
      description="Visualize suas informações e altere sua senha."
    >
      {/* Avatar + info */}
      <Card>
        <div
          style={{
            padding: "24px 24px",
            display: "flex",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              flexShrink: 0,
              background: `linear-gradient(135deg, ${color}, ${color}99)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: 26,
              letterSpacing: "0.5px",
            }}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              initials
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                margin: "0 0 4px",
                fontSize: 18,
                fontWeight: 800,
                color: "#111827",
                letterSpacing: "-0.3px",
              }}
            >
              {user?.name || "—"}
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 13, color: "#6b7280" }}>
                {user?.email || "—"}
              </span>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 10px",
                  borderRadius: 20,
                  fontSize: 11.5,
                  fontWeight: 700,
                  background: `${color}15`,
                  color: color,
                }}
              >
                {ROLE_LABELS[role] || role}
              </span>
            </div>
            {school?.name && (
              <p
                style={{ margin: "6px 0 0", fontSize: 12.5, color: "#9ca3af" }}
              >
                🏫 {school.name}
              </p>
            )}
          </div>
        </div>

        <div style={{ borderTop: "1px solid #f1f5f9", padding: "16px 24px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 16,
            }}
          >
            {[
              { label: "Nome completo", value: user?.name },
              { label: "E-mail", value: user?.email },
              { label: "Telefone", value: user?.phone || "Não informado" },
              { label: "Perfil", value: ROLE_LABELS[role] || role },
              {
                label: "Escola",
                value:
                  school?.name ||
                  (role === "ADMIN_GLOBAL" ? "Sistema Global" : "—"),
              },
            ].map((item) => (
              <div key={item.label}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: 3,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{ fontSize: 13.5, color: "#111827", fontWeight: 500 }}
                >
                  {item.value || "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Alterar senha */}
      <Card>
        <div
          style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" }}
        >
          <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>
            Alterar senha
          </span>
          <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#6b7280" }}>
            Sua nova senha deve ter no mínimo 8 caracteres.
          </p>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <form onSubmit={handleChangePassword} style={{ maxWidth: 400 }}>
            {pwError && (
              <div style={{ marginBottom: 14 }}>
                <InlineAlert message={pwError} type="error" />
              </div>
            )}
            {pwSuccess && (
              <div style={{ marginBottom: 14 }}>
                <InlineAlert
                  message="Senha alterada com sucesso!"
                  type="success"
                />
              </div>
            )}

            <FormField label="Senha atual" required>
              <Input
                type="password"
                value={pwForm.current}
                onChange={(v) => setF({ current: v })}
                placeholder="••••••••"
              />
            </FormField>
            <FormField label="Nova senha" required>
              <Input
                type="password"
                value={pwForm.next}
                onChange={(v) => setF({ next: v })}
                placeholder="Mínimo 8 caracteres"
              />
            </FormField>
            <FormField label="Confirmar nova senha" required>
              <Input
                type="password"
                value={pwForm.confirm}
                onChange={(v) => setF({ confirm: v })}
                placeholder="Repita a nova senha"
              />
            </FormField>

            {/* Força da senha */}
            {pwForm.next.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {[
                    pwForm.next.length >= 8,
                    /[A-Z]/.test(pwForm.next),
                    /[0-9]/.test(pwForm.next),
                    /[^A-Za-z0-9]/.test(pwForm.next),
                  ].map((ok, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 4,
                        background: ok
                          ? pwForm.next.length >= 12
                            ? "#10b981"
                            : "#f59e0b"
                          : "#e5e7eb",
                        transition: "background 0.2s",
                      }}
                    />
                  ))}
                </div>
                <p style={{ margin: 0, fontSize: 11.5, color: "#6b7280" }}>
                  {pwForm.next.length < 8
                    ? "Muito curta"
                    : pwForm.next.length < 12
                      ? "Razoável — adicione maiúsculas, números ou símbolos"
                      : "Senha forte"}
                </p>
              </div>
            )}

            <PrimaryButton type="submit" loading={pwSaving}>
              Salvar nova senha
            </PrimaryButton>
          </form>
        </div>
      </Card>
    </PageShell>
  );
}
