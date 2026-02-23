import React, { useEffect, useState } from "react";
import api from "../../../../utils/api";
import {
  PageShell,
  Card,
  SearchBar,
  DataTable,
  StatusBadge,
  IconButton,
  Modal,
  ModalFooter,
  PrimaryButton,
  InlineAlert,
  toast,
} from "../../../../components/ui";

const ROLE_LABELS: Record<string, string> = {
  TEACHER: "Professor",
  STUDENT: "Aluno",
  GUARDIAN: "Responsável",
};
const ROLE_COLORS: Record<string, "green" | "yellow" | "purple"> = {
  TEACHER: "green",
  STUDENT: "yellow",
  GUARDIAN: "purple",
};

type UserRow = { id: string; name: string; email: string; role: string };

export default function ResetPassword() {
  const [items, setItems] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"confirm" | "result" | null>(null);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [tempPassword, setTempPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.fetchJson("/users?limit=200");
        if (!mounted) return;
        const data = res?.data ?? res ?? [];
        const allowed = ["STUDENT", "TEACHER", "GUARDIAN"];
        setItems(
          data
            .filter((u: any) => allowed.includes(u.role))
            .map((u: any) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
            })),
        );
      } catch (e: any) {
        toast(e?.message || "Erro ao carregar usuários", "error");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = items.filter(
    (u) =>
      !search ||
      `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase()),
  );

  function openConfirm(u: UserRow) {
    setSelected(u);
    setModal("confirm");
  }

  async function handleReset() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await api.fetchJson(`/users/${selected.id}/reset-password`, {
        method: "PATCH",
      });
      setTempPassword(res?.temporaryPassword || "");
      setCopied(false);
      setModal("result");
    } catch (e: any) {
      toast(e?.message || "Erro ao redefinir senha.", "error");
      setModal(null);
    } finally {
      setSaving(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(tempPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handlePrint() {
    if (!selected) return;
    const w = window.open("", "_blank", "width=600,height=700");
    if (!w) return;
    w.document.write(`
      <html><head><title>Credenciais temporárias</title>
      <style>body{font-family:sans-serif;padding:32px;max-width:500px}h2{margin-top:0}p{line-height:1.6}.pwd{font-size:22px;font-weight:bold;letter-spacing:2px;padding:12px;background:#f3f4f6;border-radius:8px;margin:12px 0}hr{margin:24px 0;border:none;border-top:1px solid #e5e7eb}ol li{margin-bottom:8px}</style>
      </head><body>
      <h2>Credenciais temporárias</h2>
      <p><strong>Nome:</strong> ${selected.name}<br>
      <strong>E-mail:</strong> ${selected.email}</p>
      <div class="pwd">${tempPassword}</div>
      <hr>
      <h3>Como alterar a senha</h3>
      <ol>
        <li>Acesse o sistema com este e-mail e senha temporária.</li>
        <li>Vá em Perfil → Alterar senha.</li>
        <li>Informe a senha atual e escolha uma nova senha com mínimo 8 caracteres.</li>
      </ol>
      </body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
  }

  const columns = [
    { key: "name", label: "Nome" },
    { key: "email", label: "E-mail" },
    { key: "role", label: "Perfil", width: 130 },
    { key: "actions", label: "", width: 60 },
  ];

  const rows = filtered.map((u) => [
    <span style={{ fontWeight: 600, color: "#111827" }}>{u.name}</span>,
    <span style={{ color: "#6b7280" }}>{u.email}</span>,
    <StatusBadge
      label={ROLE_LABELS[u.role] || u.role}
      color={ROLE_COLORS[u.role] || "gray"}
    />,
    <IconButton onClick={() => openConfirm(u)} title="Redefinir senha">
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </IconButton>,
  ]);

  return (
    <PageShell
      title="Redefinir senhas"
      description="Gere senhas temporárias para professores, alunos e responsáveis."
    >
      <Card>
        <div
          style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}
        >
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nome ou e-mail..."
          />
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          emptyMessage="Nenhum usuário encontrado."
        />
      </Card>

      <Modal
        open={modal === "confirm"}
        onClose={() => setModal(null)}
        title="Redefinir senha"
      >
        <p style={{ margin: "0 0 16px", color: "#374151", fontSize: 14 }}>
          Gerar uma nova senha temporária para <strong>{selected?.name}</strong>
          ? A senha atual será invalidada imediatamente.
        </p>
        <InlineAlert
          message="O usuário deverá alterar a senha no próximo acesso."
          type="info"
        />
        <ModalFooter>
          <PrimaryButton variant="ghost" onClick={() => setModal(null)}>
            Cancelar
          </PrimaryButton>
          <PrimaryButton onClick={handleReset} loading={saving}>
            Gerar senha
          </PrimaryButton>
        </ModalFooter>
      </Modal>

      <Modal
        open={modal === "result"}
        onClose={() => setModal(null)}
        title="Senha gerada com sucesso"
      >
        <p style={{ margin: "0 0 10px", fontSize: 13, color: "#6b7280" }}>
          Senha temporária para <strong>{selected?.name}</strong>:
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            background: "#f8fafc",
            borderRadius: 10,
            border: "1.5px solid #e2e8f0",
            marginBottom: 14,
          }}
        >
          <code
            style={{
              flex: 1,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "2px",
              color: "#111827",
              fontFamily: "monospace",
            }}
          >
            {tempPassword}
          </code>
          <button
            onClick={handleCopy}
            style={{
              padding: "5px 12px",
              borderRadius: 7,
              border: "1.5px solid #e2e8f0",
              background: copied ? "#dcfce7" : "#fff",
              color: copied ? "#16a34a" : "#6b7280",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
        <InlineAlert
          message="Anote ou imprima esta senha. Ela não poderá ser visualizada novamente."
          type="info"
        />
        <ModalFooter>
          <PrimaryButton variant="ghost" onClick={handlePrint}>
            Imprimir
          </PrimaryButton>
          <PrimaryButton onClick={() => setModal(null)}>Concluir</PrimaryButton>
        </ModalFooter>
      </Modal>
    </PageShell>
  );
}
