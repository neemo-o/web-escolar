import React, { useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  PageShell,
  Card,
  PrimaryButton,
  toast,
} from "../../../../components/ui";

const accent = "#0891b2";

function Toggle({
  value,
  onChange,
  label,
  description,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 0",
        borderBottom: "1px solid #f8fafc",
      }}
    >
      <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
            {description}
          </div>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          border: "none",
          cursor: "pointer",
          background: value ? accent : "#e5e7eb",
          position: "relative",
          transition: "background 0.2s",
          flexShrink: 0,
        }}
        role="switch"
        aria-checked={value}
      >
        <div
          style={{
            position: "absolute",
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            top: 3,
            left: value ? 23 : 3,
            transition: "left 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        />
      </button>
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>
        {title}
      </div>
      {description && (
        <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 2 }}>
          {description}
        </div>
      )}
    </div>
  );
}

const FONT_SIZES = [
  { value: "small", label: "Pequena" },
  { value: "medium", label: "Média (padrão)" },
  { value: "large", label: "Grande" },
];

const LANG_OPTIONS = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en-US", label: "English (US)" },
];

export default function Settings() {
  const { user, school, logout } = useAuth();
  const role = user?.role || "";

  // preferências locais (sem backend, salvas em localStorage)
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem("userPrefs");
      return saved
        ? JSON.parse(saved)
        : {
            compactMode: false,
            showAvatarInitials: true,
            fontSize: "medium",
            language: "pt-BR",
            notifyGrades: true,
            notifyEnrollments: true,
            notifyAbsences: true,
            notifyAnnouncements: true,
          };
    } catch {
      return {
        compactMode: false,
        showAvatarInitials: true,
        fontSize: "medium",
        language: "pt-BR",
        notifyGrades: true,
        notifyEnrollments: true,
        notifyAbsences: true,
        notifyAnnouncements: true,
      };
    }
  });
  const [saved, setSaved] = useState(false);

  function setPref(patch: Partial<typeof prefs>) {
    setPrefs((p: typeof prefs) => ({ ...p, ...patch }));
    setSaved(false);
  }

  function savePrefs() {
    try {
      localStorage.setItem("userPrefs", JSON.stringify(prefs));
    } catch {}
    setSaved(true);
    toast("Preferências salvas!");
    setTimeout(() => setSaved(false), 3000);
  }

  const isSecretary = role === "SECRETARY" || role === "ADMIN_GLOBAL";

  return (
    <PageShell
      title="Configurações"
      description="Personalize sua experiência no sistema."
    >
      {/* Aparência */}
      <Card>
        <SectionHeader
          title="Aparência"
          description="Ajuste como o sistema é exibido para você."
        />
        <div style={{ padding: "4px 20px 8px" }}>
          <Toggle
            value={prefs.compactMode}
            onChange={(v) => setPref({ compactMode: v })}
            label="Modo compacto"
            description="Reduz o espaçamento das tabelas e listas."
          />
          <Toggle
            value={prefs.showAvatarInitials}
            onChange={(v) => setPref({ showAvatarInitials: v })}
            label="Mostrar iniciais no avatar"
            description="Exibe as iniciais do nome quando não há foto."
          />
          <div style={{ padding: "12px 0", borderBottom: "1px solid #f8fafc" }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: "#111827",
                marginBottom: 8,
              }}
            >
              Tamanho da fonte
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {FONT_SIZES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setPref({ fontSize: f.value })}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: "1.5px solid",
                    borderColor:
                      prefs.fontSize === f.value ? accent : "#e2e8f0",
                    background:
                      prefs.fontSize === f.value ? `${accent}10` : "#fff",
                    color: prefs.fontSize === f.value ? accent : "#374151",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: "12px 0" }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: "#111827",
                marginBottom: 8,
              }}
            >
              Idioma
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {LANG_OPTIONS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setPref({ language: l.value })}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: "1.5px solid",
                    borderColor:
                      prefs.language === l.value ? accent : "#e2e8f0",
                    background:
                      prefs.language === l.value ? `${accent}10` : "#fff",
                    color: prefs.language === l.value ? accent : "#374151",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Notificações */}
      <Card>
        <SectionHeader
          title="Notificações"
          description="Escolha quais eventos geram alertas no sistema."
        />
        <div style={{ padding: "4px 20px 8px" }}>
          {role === "STUDENT" || role === "GUARDIAN" ? (
            <>
              <Toggle
                value={prefs.notifyGrades}
                onChange={(v) => setPref({ notifyGrades: v })}
                label="Novas notas"
                description="Quando uma nota é lançada ou atualizada."
              />
              <Toggle
                value={prefs.notifyAbsences}
                onChange={(v) => setPref({ notifyAbsences: v })}
                label="Faltas registradas"
                description="Quando uma falta é registrada no sistema."
              />
              <Toggle
                value={prefs.notifyAnnouncements}
                onChange={(v) => setPref({ notifyAnnouncements: v })}
                label="Comunicados"
                description="Avisos gerais da escola."
              />
            </>
          ) : role === "TEACHER" ? (
            <>
              <Toggle
                value={prefs.notifyGrades}
                onChange={(v) => setPref({ notifyGrades: v })}
                label="Alertas de avaliações"
                description="Datas de avaliações se aproximando."
              />
              <Toggle
                value={prefs.notifyAbsences}
                onChange={(v) => setPref({ notifyAbsences: v })}
                label="Alta taxa de faltas"
                description="Quando um aluno atinge o limite de faltas."
              />
              <Toggle
                value={prefs.notifyAnnouncements}
                onChange={(v) => setPref({ notifyAnnouncements: v })}
                label="Comunicados"
                description="Avisos gerais da escola."
              />
            </>
          ) : (
            <>
              <Toggle
                value={prefs.notifyGrades}
                onChange={(v) => setPref({ notifyGrades: v })}
                label="Lançamentos de notas"
                description="Quando um professor lança ou altera notas."
              />
              <Toggle
                value={prefs.notifyEnrollments}
                onChange={(v) => setPref({ notifyEnrollments: v })}
                label="Novas matrículas"
                description="Quando um aluno é matriculado em uma turma."
              />
              <Toggle
                value={prefs.notifyAbsences}
                onChange={(v) => setPref({ notifyAbsences: v })}
                label="Alertas de frequência"
                description="Quando um aluno ultrapassa o limite de faltas."
              />
              <Toggle
                value={prefs.notifyAnnouncements}
                onChange={(v) => setPref({ notifyAnnouncements: v })}
                label="Comunicados"
                description="Avisos gerais do sistema."
              />
            </>
          )}
        </div>
      </Card>

      {/* Conta */}
      <Card>
        <SectionHeader title="Conta" />
        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            {[
              { label: "Usuário", value: user?.name },
              { label: "E-mail", value: user?.email },
              {
                label: "Escola",
                value:
                  school?.name ||
                  (role === "ADMIN_GLOBAL" ? "Sistema Global" : "—"),
              },
              {
                label: "ID do usuário",
                value: user?.id ? `…${user.id.slice(-8)}` : "—",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: "10px 12px",
                  background: "#f8fafc",
                  borderRadius: 10,
                  border: "1px solid #f1f5f9",
                }}
              >
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
                  style={{
                    fontSize: 13,
                    color: "#374151",
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.value || "—"}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 4 }}
          >
            <a
              href="/dashboard/profile"
              style={{
                height: 36,
                padding: "0 14px",
                borderRadius: 9,
                border: "1.5px solid #e2e8f0",
                background: "#fff",
                color: "#374151",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                textDecoration: "none",
              }}
            >
              Editar perfil / Alterar senha
            </a>
            <button
              onClick={() => {
                if (window.confirm("Tem certeza que deseja sair?")) logout();
              }}
              style={{
                height: 36,
                padding: "0 14px",
                borderRadius: 9,
                border: "1.5px solid #fecaca",
                background: "#fff",
                color: "#dc2626",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Sair do sistema
            </button>
          </div>
        </div>
      </Card>

      {/* Salvar */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <PrimaryButton onClick={savePrefs}>
          {saved ? "✓ Salvo!" : "Salvar preferências"}
        </PrimaryButton>
      </div>
    </PageShell>
  );
}
