import React, { useEffect, useState } from "react";
import api from "../../../../utils/api";
import { useAuth } from "../../../../contexts/AuthContext";

type UserRow = { id: string; name: string; email: string; role: string };

export default function ResetPassword() {
  const { user } = useAuth();
  const [items, setItems] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<null | {
    user: UserRow;
    tempPassword: string;
  }>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.fetchJson(`/users?limit=200`);
        if (!mounted) return;
        const data = res?.data ?? [];
        // only roles secretary can reset
        const allowed = ["STUDENT", "TEACHER", "GUARDIAN"];
        const mapped = data
          .filter((u: any) => allowed.includes(u.role))
          .map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
          }));
        setItems(mapped);
      } catch (err: any) {
        setError(err?.message || "Falha ao carregar usuários");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = items.filter((it) =>
    `${it.name} ${it.email}`.toLowerCase().includes(query.toLowerCase()),
  );

  async function handleReset(u: UserRow) {
    if (!confirm(`Gerar senha temporária para ${u.name}?`)) return;
    try {
      const res = await api.fetchJson(`/users/${u.id}/reset-password`, {
        method: "PATCH",
      });
      const temp = res?.temporaryPassword;
      setModal({ user: u, tempPassword: temp });
    } catch (err: any) {
      alert(err?.message || "Erro ao resetar senha");
    }
  }

  function handlePrint() {
    if (!modal) return;
    const content = `
      <html>
      <head><title>Credenciais temporárias</title></head>
      <body>
        <h2>Credenciais temporárias</h2>
        <p><strong>Nome:</strong> ${modal.user.name}</p>
        <p><strong>E-mail:</strong> ${modal.user.email}</p>
        <p><strong>Senha temporária:</strong> ${modal.tempPassword}</p>
        <hr />
        <h3>Como alterar a senha</h3>
        <ol>
          <li>Entrar no sistema com e-mail e senha temporária.</li>
          <li>Acessar Perfil &gt; Alterar senha.</li>
          <li>Informar a senha atual e escolher uma nova senha com mínimo 8 caracteres.</li>
        </ol>
      </body>
      </html>
    `;
    const w = window.open("", "_blank", "width=700,height=900");
    if (!w) return;
    w.document.write(content);
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Redefinir senha</h1>
      <p style={{ color: "#6b7280" }}>
        Gere senhas temporárias para alunos, professores ou responsáveis.
      </p>
      <div style={{ margin: "12px 0 18px", display: "flex", gap: 8 }}>
        <input
          placeholder="Buscar por nome ou e-mail"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
          }}
        />
      </div>
      {loading ? (
        <div>Carregando usuários...</div>
      ) : error ? (
        <div style={{ color: "#dc2626" }}>{error}</div>
      ) : (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", background: "#f9fafb" }}>
                <th style={{ padding: 12 }}>Nome</th>
                <th style={{ padding: 12 }}>E-mail</th>
                <th style={{ padding: 12 }}>Papel</th>
                <th style={{ padding: 12 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 12 }}>{u.name}</td>
                  <td style={{ padding: 12 }}>{u.email}</td>
                  <td style={{ padding: 12 }}>{u.role}</td>
                  <td style={{ padding: 12 }}>
                    <button
                      onClick={() => handleReset(u)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "none",
                        background: "#4f46e5",
                        color: "#fff",
                      }}
                    >
                      Gerar senha temporária
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: 560,
              background: "#fff",
              borderRadius: 10,
              padding: 20,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Senha temporária gerada</h3>
            <p>
              <strong>Usuário:</strong> {modal.user.name} ({modal.user.email})
            </p>
            <p>
              <strong>Senha temporária:</strong>{" "}
              <span
                style={{
                  fontFamily: "monospace",
                  background: "#f3f4f6",
                  padding: "4px 6px",
                  borderRadius: 6,
                }}
              >
                {modal.tempPassword}
              </span>
            </p>
            <div style={{ marginTop: 12 }}>
              <h4>Tutorial rápido</h4>
              <ol>
                <li>Entrar com o e-mail e a senha temporária.</li>
                <li>Acessar Perfil &gt; Alterar senha.</li>
                <li>Escolher uma nova senha com no mínimo 8 caracteres.</li>
              </ol>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                onClick={handlePrint}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: "#111827",
                  color: "#fff",
                }}
              >
                Imprimir (PDF)
              </button>
              <button
                onClick={() => setModal(null)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
