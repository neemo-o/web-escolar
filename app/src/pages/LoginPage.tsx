import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

interface School {
  id: string;
  name: string;
  color: string;
}

const MOCK_SCHOOLS: School[] = [
  { id: "1", name: "Colégio Alpha", color: "#6366f1" },
  { id: "2", name: "Escola Beta", color: "#f59e0b" },
  { id: "3", name: "Instituto Gama", color: "#10b981" },
];

function SchoolAvatar({
  school,
  size = 28,
}: {
  school: School;
  size?: number;
}) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        background: school.color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: size * 0.36,
        flexShrink: 0,
        fontFamily: "inherit",
      }}
    >
      {school.name.charAt(0)}
    </span>
  );
}

function useWindowSize() {
  const [size, setSize] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });
  useEffect(() => {
    const handler = () =>
      setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return size;
}

export default function LoginPage() {
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const [schools, setSchools] = useState<School[]>(MOCK_SCHOOLS);
  const [schoolsLoading, setSchoolsLoading] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const { w, h } = useWindowSize();
  const auth = useAuth();

  const isMobile = w < 640;
  const isTablet = w >= 640 && w < 900;
  const isShortMobile = isMobile && h < 680;

  const filtered = schools.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );
  const isFormValid = !!selectedSchool && !!email && !!password;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  // Fetch real schools from API; fallback to MOCK_SCHOOLS on error
  useEffect(() => {
    let mounted = true;
    async function loadSchools() {
      setSchoolsLoading(true);
      try {
        const data = await api.fetchJson("/public/schools");
        if (mounted && Array.isArray(data) && data.length > 0) {
          // Map to School interface conservatively
          const mapped = data.map((s: any) => ({
            id: String(s.id ?? s.uuid ?? s.code ?? s.name),
            name: s.name ?? s.title ?? String(s.id),
            color: s.color ?? "#6b7280",
          }));
          setSchools(mapped);
        }
      } catch (err) {
        console.warn("Could not fetch schools, using fallback", err);
      } finally {
        if (mounted) setSchoolsLoading(false);
      }
    }
    loadSchools();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (dropdownOpen && searchRef.current) searchRef.current.focus();
  }, [dropdownOpen]);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      const clickedTrigger = triggerRef.current?.contains(target);
      const clickedDropdown = dropdownRef.current?.contains(target);
      if (!clickedTrigger && !clickedDropdown) {
        setDropdownOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  // Recalculate trigger position when dropdown opens or window resizes
  useEffect(() => {
    if (dropdownOpen && triggerRef.current) {
      setTriggerRect(triggerRef.current.getBoundingClientRect());
    }
  }, [dropdownOpen, w, h]);

  const openDropdown = () => {
    if (triggerRef.current) {
      setTriggerRect(triggerRef.current.getBoundingClientRect());
    }
    setDropdownOpen((o) => !o);
    setSearch("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setError("");
    setLoading(true);
    try {
      const data = await api.fetchJson("/auth/login", {
        method: "POST",
        body: JSON.stringify({ schoolId: selectedSchool!.id, email, password }),
      });
      if (!data || !data.token)
        throw new Error("Resposta inválida do servidor");
      const { login } = auth;
      login(data.token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const inputH = isShortMobile ? 38 : isMobile ? 41 : 44;
  const fieldGap = isShortMobile ? 10 : isMobile ? 13 : isTablet ? 15 : 17;
  const formTitleSize = isShortMobile ? 19 : isMobile ? 22 : isTablet ? 24 : 26;
  const subtitleSize = isShortMobile ? 12 : isMobile ? 12.5 : 13.5;
  const subtitleMargin = isShortMobile ? 12 : isMobile ? 14 : 20;

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
                marginBottom: isTablet ? 20 : 32,
                position: "relative",
                zIndex: 1,
              }}
            >
              <h1
                style={{
                  color: "#fff",
                  fontSize: isTablet ? 19 : 23,
                  fontWeight: 800,
                  lineHeight: 1.28,
                  margin: "0 0 11px",
                  letterSpacing: "-0.4px",
                }}
              >
                O futuro da <span style={{ color: "#a5b4fc" }}>educação</span>{" "}
                começa aqui.
              </h1>
              <p
                style={{
                  color: "rgba(255,255,255,0.62)",
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Plataforma integrada para gestão escolar. Conectando alunos,
                professores e coordenação em um único ambiente.
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
              Acesse sua conta
            </h2>

            <p
              style={{
                fontSize: subtitleSize,
                color: "#6b7280",
                margin: `0 0 ${subtitleMargin}px`,
                lineHeight: 1.5,
                display: isShortMobile ? "none" : "block",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(12px)",
                transition:
                  "opacity 0.4s ease 0.15s, transform 0.4s ease 0.15s",
              }}
            >
              Bem-vindo de volta! Por favor, insira seus dados para entrar no
              sistema.
            </p>

            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  borderRadius: 9,
                  padding: "8px 12px",
                  fontSize: 12.5,
                  marginBottom: 12,
                  animation: "slideIn 0.22s ease",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* ── SCHOOL DROPDOWN ── */}
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
                  Instituição
                </label>

                {/* Trigger button — measured for portal positioning */}
                <button
                  ref={triggerRef}
                  type="button"
                  onClick={openDropdown}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 12px",
                    height: inputH,
                    border: `1.5px solid ${dropdownOpen ? "#5b5ef4" : "#e2e5ea"}`,
                    borderRadius: 10,
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: 13.5,
                    boxShadow: dropdownOpen
                      ? "0 0 0 3px rgba(91,94,244,0.11)"
                      : "none",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                >
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {selectedSchool ? (
                      <>
                        <SchoolAvatar school={selectedSchool} size={22} />
                        <span
                          style={{
                            color: "#111827",
                            fontSize: 13.5,
                            fontWeight: 500,
                          }}
                        >
                          {selectedSchool.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#9ca3af"
                          strokeWidth="1.8"
                        >
                          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <span style={{ color: "#9ca3af", fontSize: 13.5 }}>
                          Selecione sua escola
                        </span>
                      </>
                    )}
                  </span>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    style={{
                      transform: dropdownOpen
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.2s",
                      flexShrink: 0,
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Portal dropdown — rendered at document.body, positioned via fixed */}
                {dropdownOpen &&
                  triggerRect &&
                  createPortal(
                    <div
                      ref={dropdownRef}
                      style={{
                        position: "fixed",
                        top: triggerRect.bottom + 5,
                        left: triggerRect.left,
                        width: triggerRect.width,
                        background: "#fff",
                        borderRadius: 12,
                        border: "1.5px solid #e5e7eb",
                        boxShadow: "0 8px 28px rgba(0,0,0,0.13)",
                        zIndex: 9999,
                        overflow: "hidden",
                        animation: "dropIn 0.18s cubic-bezier(.16,1,.3,1)",
                        fontFamily:
                          "'Plus Jakarta Sans', system-ui, sans-serif",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          padding: "8px 12px",
                          borderBottom: "1px solid #f3f4f6",
                        }}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#9ca3af"
                          strokeWidth="2"
                          style={{ flexShrink: 0 }}
                        >
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                          ref={searchRef}
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Buscar escola..."
                          style={{
                            border: "none",
                            outline: "none",
                            flex: 1,
                            fontSize: 13,
                            color: "#111827",
                            fontFamily: "inherit",
                            background: "transparent",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          maxHeight: 160,
                          overflowY: "auto",
                          padding: "4px 0",
                        }}
                      >
                        {filtered.length === 0 ? (
                          <div
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              color: "#9ca3af",
                              fontSize: 12.5,
                            }}
                          >
                            Nenhuma escola encontrada
                          </div>
                        ) : (
                          filtered.map((school) => (
                            <button
                              key={school.id}
                              type="button"
                              onClick={() => {
                                setSelectedSchool(school);
                                setDropdownOpen(false);
                                setSearch("");
                              }}
                              style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                gap: 9,
                                padding: "8px 12px",
                                border: "none",
                                cursor: "pointer",
                                textAlign: "left",
                                fontFamily: "inherit",
                                fontSize: 13.5,
                                fontWeight: 500,
                                background:
                                  selectedSchool?.id === school.id
                                    ? "#f5f5ff"
                                    : "transparent",
                                transition: "background 0.1s",
                              }}
                            >
                              <SchoolAvatar school={school} size={26} />
                              <span
                                style={{
                                  color:
                                    selectedSchool?.id === school.id
                                      ? "#5b5ef4"
                                      : "#111827",
                                }}
                              >
                                {school.name}
                              </span>
                              {selectedSchool?.id === school.id && (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#5b5ef4"
                                  strokeWidth="2.5"
                                  style={{ marginLeft: "auto" }}
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>,
                    document.body,
                  )}
              </div>

              {/* ── EMAIL ── */}
              <div
                style={{
                  marginBottom: fieldGap,
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(10px)",
                  transition:
                    "opacity 0.4s ease 0.25s, transform 0.4s ease 0.25s",
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
                      padding: "0 13px 0 38px",
                      border: "1.5px solid #e2e5ea",
                      borderRadius: 10,
                      fontSize: 13.5,
                      color: "#111827",
                      fontFamily: "inherit",
                      outline: "none",
                      background: "#fff",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                    }}
                  />
                </div>
              </div>

              {/* ── PASSWORD ── */}
              <div
                style={{
                  marginBottom: 0,
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(10px)",
                  transition:
                    "opacity 0.4s ease 0.3s, transform 0.4s ease 0.3s",
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
                  Senha
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
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="edu-input"
                    style={{
                      width: "100%",
                      height: inputH,
                      padding: "0 42px 0 38px",
                      border: "1.5px solid #e2e5ea",
                      borderRadius: 10,
                      fontSize: 13.5,
                      color: "#111827",
                      fontFamily: "inherit",
                      outline: "none",
                      background: "#fff",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 2,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showPassword ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#9ca3af"
                        strokeWidth="1.8"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#9ca3af"
                        strokeWidth="1.8"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                <div style={{ textAlign: "right", marginTop: 5 }}>
                  <Link
                    to="/esqueci-senha"
                    style={{
                      fontSize: 12,
                      color: "#5b5ef4",
                      textDecoration: "none",
                      fontWeight: 500,
                    }}
                  >
                    Esqueci minha senha
                  </Link>
                </div>
              </div>

              {/* ── SUBMIT ── */}
              <div
                style={{
                  marginTop: isShortMobile ? 10 : fieldGap,
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(10px)",
                  transition:
                    "opacity 0.4s ease 0.35s, transform 0.4s ease 0.35s",
                }}
              >
                <button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className={isFormValid && !loading ? "edu-btn-active" : ""}
                  style={{
                    width: "100%",
                    height: isShortMobile ? 40 : isMobile ? 42 : 46,
                    borderRadius: 10,
                    border: "none",
                    fontFamily: "inherit",
                    fontSize: isMobile ? 14 : 15,
                    fontWeight: 700,
                    letterSpacing: "-0.2px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: isFormValid && !loading ? "pointer" : "default",
                    background:
                      isFormValid && !loading
                        ? "linear-gradient(135deg, #5b5ef4 0%, #7c3aed 100%)"
                        : "#e9eaf0",
                    color: isFormValid && !loading ? "#fff" : "#9ca3af",
                    transition:
                      "background 0.3s, opacity 0.2s, transform 0.15s",
                  }}
                >
                  {loading ? (
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ animation: "spin 0.75s linear infinite" }}
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  ) : (
                    "Entrar"
                  )}
                </button>
              </div>
            </form>

            {isMobile && (
              <p
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  color: "#b0b7c3",
                  marginTop: 14,
                }}
              >
                © 2026 EduSys
              </p>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .edu-input:focus {
          border-color: #5b5ef4 !important;
          box-shadow: 0 0 0 3px rgba(91,94,244,0.11) !important;
        }
        .edu-btn-active:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }
        .edu-btn-active:active {
          transform: translateY(0) scale(0.98);
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
