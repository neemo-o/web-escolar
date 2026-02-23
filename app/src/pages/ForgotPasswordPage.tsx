import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWindowSize } from "./dashboard/useWindowSize";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const { w, h } = useWindowSize();

  const isMobile = w < 640;
  const isTablet = w >= 640 && w < 900;
  const isShortMobile = isMobile && h < 680;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  const inputH = isShortMobile ? 38 : isMobile ? 41 : 44;
  const fieldGap = isShortMobile ? 10 : isMobile ? 13 : 17;
  const formTitleSize = isShortMobile ? 19 : isMobile ? 22 : isTablet ? 24 : 26;
  const subtitleSize = isShortMobile ? 12 : isMobile ? 12.5 : 13.5;

  return (
    <div
      style={{
        width: "100vw",
        height: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #e8eaf6 0%, #f0f0fb 50%, #e8ecf8 100%)",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        padding: isMobile ? "12px" : "20px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          width: "100%",
          maxWidth: isMobile ? 440 : isTablet ? 700 : 840,
          height: isMobile ? "100%" : "auto",
          maxHeight: isMobile ? "100%" : "calc(100dvh - 40px)",
          borderRadius: isMobile ? 14 : 20,
          overflow: "hidden",
          boxShadow:
            "0 20px 70px rgba(80,80,180,0.15), 0 4px 16px rgba(0,0,0,0.06)",
          opacity: mounted ? 1 : 0,
          transform: mounted
            ? "translateY(0) scale(1)"
            : "translateY(20px) scale(0.97)",
          transition:
            "opacity 0.45s cubic-bezier(.16,1,.3,1), transform 0.45s cubic-bezier(.16,1,.3,1)",
        }}
      >
        {/* ─── LEFT / TOP BANNER ─── */}
        <div
          style={{
            flex: isMobile ? "0 0 auto" : isTablet ? "0 0 230px" : "0 0 320px",
            background:
              "linear-gradient(145deg, #4f46e5 0%, #7c3aed 60%, #6d28d9 100%)",
            padding: isShortMobile
              ? "14px 18px"
              : isMobile
                ? "18px 22px"
                : isTablet
                  ? "28px 24px"
                  : "32px 28px",
            display: "flex",
            flexDirection: isMobile ? "row" : "column",
            alignItems: isMobile ? "center" : "stretch",
            justifyContent: isMobile ? "space-between" : "flex-start",
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
              border: "1.5px solid rgba(255,255,255,0.1)",
              top: -70,
              right: -70,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 150,
              height: 150,
              borderRadius: "50%",
              border: "1.5px solid rgba(255,255,255,0.07)",
              bottom: 10,
              left: -50,
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <span
              style={{
                color: "#fff",
                fontWeight: 700,
                fontSize: 14.5,
                letterSpacing: "-0.3px",
              }}
            >
              EduSys Pro
            </span>
          </div>

          {!isMobile && (
            <div
              style={{
                marginTop: "auto",
                marginBottom: isTablet ? 0 : 8,
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h1
                style={{
                  color: "#fff",
                  fontSize: isTablet ? 17 : 20,
                  fontWeight: 800,
                  margin: "0 0 8px",
                  letterSpacing: "-0.4px",
                  lineHeight: 1.2,
                }}
              >
                Recuperar acesso
              </h1>
              <p
                style={{
                  color: "rgba(255,255,255,0.62)",
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Informe seu e-mail e a secretaria da escola poderá redefinir sua
                senha com segurança.
              </p>
            </div>
          )}

          {!isMobile && (
            <div
              style={{
                display: "flex",
                gap: 5,
                alignItems: "center",
                color: "rgba(255,255,255,0.38)",
                fontSize: 11,
                position: "relative",
                zIndex: 1,
                flexWrap: "wrap",
                marginTop: 24,
              }}
            >
              <span>© 2026 EduSys</span>
              <span>•</span>
              <a
                href="#"
                style={{
                  color: "rgba(255,255,255,0.44)",
                  textDecoration: "none",
                }}
              >
                Suporte
              </a>
              <span>•</span>
              <a
                href="#"
                style={{
                  color: "rgba(255,255,255,0.44)",
                  textDecoration: "none",
                }}
              >
                Termos
              </a>
            </div>
          )}

          {isMobile && (
            <div
              style={{
                display: "flex",
                gap: 5,
                alignItems: "center",
                color: "rgba(255,255,255,0.42)",
                fontSize: 11,
                position: "relative",
                zIndex: 1,
              }}
            >
              <a
                href="#"
                style={{
                  color: "rgba(255,255,255,0.5)",
                  textDecoration: "none",
                }}
              >
                Suporte
              </a>
              <span>•</span>
              <a
                href="#"
                style={{
                  color: "rgba(255,255,255,0.5)",
                  textDecoration: "none",
                }}
              >
                Termos
              </a>
            </div>
          )}
        </div>

        {/* ─── RIGHT / FORM PANEL ─── */}
        <div
          style={{
            flex: 1,
            background: "#fff",
            padding: isShortMobile
              ? "18px 20px"
              : isMobile
                ? "24px 22px"
                : isTablet
                  ? "32px 32px"
                  : "40px 44px",
            display: "flex",
            alignItems: isMobile ? "flex-start" : "center",
            overflowY: "auto",
          }}
        >
          <div style={{ width: "100%", maxWidth: 360 }}>
            <h2
              style={{
                fontSize: formTitleSize,
                fontWeight: 800,
                color: "#111827",
                margin: `0 0 ${isShortMobile ? 3 : 5}px`,
                letterSpacing: "-0.5px",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(12px)",
                transition: "opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s",
              }}
            >
              Esqueci minha senha
            </h2>

            <p
              style={{
                fontSize: subtitleSize,
                color: "#6b7280",
                margin: `0 0 ${isShortMobile ? 14 : 20}px`,
                lineHeight: 1.5,
                display: isShortMobile ? "none" : "block",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(12px)",
                transition:
                  "opacity 0.4s ease 0.15s, transform 0.4s ease 0.15s",
              }}
            >
              Informe seu e-mail cadastrado. A secretaria da escola será
              responsável por redefinir sua senha.
            </p>

            {submitted ? (
              <div
                style={{
                  opacity: mounted ? 1 : 0,
                  transition: "opacity 0.3s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 12,
                    padding: "14px 16px",
                    marginBottom: fieldGap,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="2.2"
                    style={{ flexShrink: 0, marginTop: 1 }}
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        fontSize: 13,
                        color: "#065f46",
                      }}
                    >
                      Solicitação recebida
                    </p>
                    <p
                      style={{
                        margin: "3px 0 0",
                        fontSize: 12.5,
                        color: "#047857",
                        lineHeight: 1.5,
                      }}
                    >
                      Entre em contato com a secretaria da sua escola para
                      finalizar a recuperação de acesso.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/login")}
                  style={{
                    width: "100%",
                    height: inputH,
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    color: "#fff",
                    fontFamily: "inherit",
                    fontSize: isMobile ? 14 : 15,
                    fontWeight: 700,
                    letterSpacing: "-0.2px",
                    cursor: "pointer",
                  }}
                >
                  Voltar ao login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div
                  style={{
                    marginBottom: fieldGap,
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(10px)",
                    transition:
                      "opacity 0.4s ease 0.2s, transform 0.4s ease 0.2s",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: 5,
                    }}
                  >
                    E-mail
                  </label>
                  <div style={{ position: "relative" }}>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#9ca3af"
                      strokeWidth="1.8"
                      style={{
                        position: "absolute",
                        left: 13,
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                      }}
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      autoComplete="email"
                      className="edu-input"
                      style={{
                        width: "100%",
                        height: inputH,
                        padding: "0 14px 0 38px",
                        border: "1.5px solid #e2e5ea",
                        borderRadius: 10,
                        fontSize: 13.5,
                        color: "#111827",
                        fontFamily: "inherit",
                        outline: "none",
                        background: "#fff",
                        transition: "border-color 0.15s, box-shadow 0.15s",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    background: "#f8f9fc",
                    border: "1px solid #e9ebf0",
                    borderRadius: 10,
                    padding: "10px 13px",
                    marginBottom: fieldGap,
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(10px)",
                    transition:
                      "opacity 0.4s ease 0.25s, transform 0.4s ease 0.25s",
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6b7280"
                    strokeWidth="2"
                    style={{ flexShrink: 0, marginTop: 1 }}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11.5,
                      color: "#6b7280",
                      lineHeight: 1.5,
                    }}
                  >
                    A redefinição de senha é feita pela secretaria da escola.
                    Este formulário registra sua solicitação.
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(10px)",
                    transition:
                      "opacity 0.4s ease 0.3s, transform 0.4s ease 0.3s",
                  }}
                >
                  <button
                    type="submit"
                    disabled={!email}
                    style={{
                      width: "100%",
                      height: inputH,
                      borderRadius: 10,
                      border: "none",
                      fontFamily: "inherit",
                      fontSize: isMobile ? 14 : 15,
                      fontWeight: 700,
                      letterSpacing: "-0.2px",
                      cursor: email ? "pointer" : "default",
                      background: email
                        ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                        : "#e5e7eb",
                      color: email ? "#fff" : "#9ca3af",
                      transition:
                        "background 0.2s, color 0.2s, box-shadow 0.2s",
                      boxShadow: email
                        ? "0 4px 14px rgba(99,102,241,0.35)"
                        : "none",
                    }}
                  >
                    Enviar solicitação
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    style={{
                      width: "100%",
                      height: inputH,
                      borderRadius: 10,
                      border: "1.5px solid #e2e5ea",
                      background: "#fff",
                      fontFamily: "inherit",
                      fontSize: isMobile ? 13.5 : 14,
                      fontWeight: 600,
                      color: "#6b7280",
                      cursor: "pointer",
                      transition: "border-color 0.15s, color 0.15s",
                    }}
                  >
                    ← Voltar ao login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
