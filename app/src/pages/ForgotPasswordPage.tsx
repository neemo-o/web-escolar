import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // UI-only: do not call backend. Show a friendly message instructing users to contact school secretary.
    setSubmitted(true);
  };

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 560,
        margin: "48px auto",
        fontFamily: "Plus Jakarta Sans, system-ui, sans-serif",
      }}
    >
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: 12,
          background: "none",
          border: "none",
          color: "#6b7280",
          cursor: "pointer",
        }}
      >
        ← Voltar
      </button>
      <h2 style={{ margin: "6px 0 8px", fontSize: 22 }}>Esqueci minha senha</h2>
      <p style={{ color: "#6b7280", marginBottom: 18 }}>
        Se você é aluno, responsável ou professor, entre em contato com a
        secretaria da sua escola para recuperar a senha. Ainda assim, você pode
        solicitar um e-mail de recuperação abaixo (apenas interface por
        enquanto).
      </p>

      {submitted ? (
        <div
          style={{
            padding: 14,
            borderRadius: 10,
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#065f46",
          }}
        >
          Solicitação recebida. Por favor, contate a secretaria da escola para
          finalizar a recuperação.
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>
            E-mail
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              marginBottom: 12,
            }}
          />

          <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>
            Instituição (opcional)
          </label>
          <input
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="Nome da escola"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              marginBottom: 12,
            }}
          />

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="submit"
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "none",
                background: "#5b5ef4",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Enviar e-mail
            </button>
            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Voltar ao login
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
