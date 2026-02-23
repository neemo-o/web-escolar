import React, { useRef, useEffect } from "react";

const accent = "#0891b2";

export function PageShell({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
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
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              color: "#111827",
              letterSpacing: "-0.5px",
            }}
          >
            {title}
          </h1>
          {description && (
            <p
              style={{
                margin: "3px 0 0",
                fontSize: 13,
                color: "#6b7280",
                lineHeight: 1.5,
              }}
            >
              {description}
            </p>
          )}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
      {children}
    </div>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #e9ebf0",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function PrimaryButton({
  onClick,
  disabled,
  loading,
  children,
  type = "button",
  variant = "primary",
}: {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  type?: "button" | "submit";
  variant?: "primary" | "danger" | "ghost";
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background:
        disabled || loading
          ? "#e5e7eb"
          : `linear-gradient(135deg, ${accent}, #0e7490)`,
      color: disabled || loading ? "#9ca3af" : "#fff",
      border: "none",
      boxShadow:
        disabled || loading ? "none" : "0 2px 8px rgba(8,145,178,0.28)",
    },
    danger: {
      background:
        disabled || loading
          ? "#e5e7eb"
          : "linear-gradient(135deg,#ef4444,#dc2626)",
      color: disabled || loading ? "#9ca3af" : "#fff",
      border: "none",
      boxShadow:
        disabled || loading ? "none" : "0 2px 8px rgba(239,68,68,0.25)",
    },
    ghost: {
      background: "#fff",
      color: "#374151",
      border: "1.5px solid #e2e8f0",
      boxShadow: "none",
    },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        height: 38,
        padding: "0 16px",
        borderRadius: 9,
        fontSize: 13,
        fontWeight: 700,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        transition: "opacity 0.15s",
        whiteSpace: "nowrap",
        ...styles[variant],
      }}
    >
      {loading ? "Aguarde..." : children}
    </button>
  );
}

export function SearchBar({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <div
        style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 340 }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ca3af"
          strokeWidth="2"
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Buscar..."}
          style={{
            width: "100%",
            height: 38,
            padding: "0 12px 0 34px",
            borderRadius: 9,
            border: "1.5px solid #e2e8f0",
            background: "#fff",
            fontSize: 13,
            fontFamily: "inherit",
            color: "#111827",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>
      {children}
    </div>
  );
}

export function SelectFilter({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        height: 38,
        padding: "0 30px 0 10px",
        borderRadius: 9,
        border: "1.5px solid #e2e8f0",
        background: "#fff",
        fontSize: 13,
        fontFamily: "inherit",
        color: "#374151",
        cursor: "pointer",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function DataTable({
  columns,
  rows,
  loading,
  emptyMessage,
}: {
  columns: { key: string; label: string; width?: number | string }[];
  rows: React.ReactNode[][];
  loading?: boolean;
  emptyMessage?: string;
}) {
  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          tableLayout: "auto",
          minWidth: 540,
        }}
      >
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  fontWeight: 700,
                  color: "#6b7280",
                  fontSize: 11.5,
                  letterSpacing: "0.4px",
                  textTransform: "uppercase",
                  borderBottom: "1px solid #e9ebf0",
                  whiteSpace: "nowrap",
                  width: col.width,
                  minWidth: col.width,
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: "48px 14px",
                  textAlign: "center",
                  color: "#9ca3af",
                }}
              >
                Carregando...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: "48px 14px",
                  textAlign: "center",
                  color: "#9ca3af",
                }}
              >
                {emptyMessage || "Nenhum registro encontrado."}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                {row.map((cell, j) => (
                  <td
                    key={j}
                    style={{
                      padding: "11px 14px",
                      color: "#374151",
                      verticalAlign: "middle",
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({
  page,
  total,
  limit,
  onPage,
}: {
  page: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.ceil(total / limit);
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Build visible page numbers with ellipsis
  function getPageNumbers(): (number | "...")[] {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const result: (number | "...")[] = [];
    if (page <= 4) {
      result.push(1, 2, 3, 4, 5, "...", pages);
    } else if (page >= pages - 3) {
      result.push(1, "...", pages - 4, pages - 3, pages - 2, pages - 1, pages);
    } else {
      result.push(1, "...", page - 1, page, page + 1, "...", pages);
    }
    return result;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderTop: "1px solid #f1f5f9",
        fontSize: 12.5,
        color: "#6b7280",
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      <span style={{ whiteSpace: "nowrap" }}>
        Mostrando{" "}
        <strong style={{ color: "#374151" }}>
          {from}–{to}
        </strong>{" "}
        de <strong style={{ color: "#374151" }}>{total}</strong>
      </span>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          style={paginBtn(page === 1)}
          title="Anterior"
        >
          ‹
        </button>
        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span
              key={`e${i}`}
              style={{ padding: "0 2px", color: "#9ca3af", fontSize: 13 }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              style={paginBtn(false, p === page)}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === pages}
          style={paginBtn(page === pages)}
          title="Próxima"
        >
          ›
        </button>
      </div>
    </div>
  );
}

function paginBtn(disabled: boolean, active = false): React.CSSProperties {
  return {
    minWidth: 30,
    height: 30,
    padding: "0 6px",
    borderRadius: 7,
    border: active ? `1.5px solid ${accent}` : "1.5px solid #e2e8f0",
    background: active ? `${accent}12` : disabled ? "#f9fafb" : "#fff",
    color: active ? accent : disabled ? "#d1d5db" : "#374151",
    fontSize: 13,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    fontWeight: active ? 700 : 500,
    transition: "all 0.15s",
  };
}

export function StatusBadge({
  label,
  color,
}: {
  label: string;
  color: "green" | "red" | "yellow" | "blue" | "gray" | "purple";
}) {
  const map: Record<string, { bg: string; text: string }> = {
    green: { bg: "#dcfce7", text: "#166534" },
    red: { bg: "#fee2e2", text: "#991b1b" },
    yellow: { bg: "#fef9c3", text: "#854d0e" },
    blue: { bg: "#dbeafe", text: "#1e40af" },
    gray: { bg: "#f3f4f6", text: "#4b5563" },
    purple: { bg: "#f3e8ff", text: "#6b21a8" },
  };
  const c = map[color] || map.gray;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 9px",
        borderRadius: 20,
        fontSize: 11.5,
        fontWeight: 700,
        background: c.bg,
        color: c.text,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

export function IconButton({
  onClick,
  title,
  variant = "default",
  children,
}: {
  onClick: () => void;
  title?: string;
  variant?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 30,
        height: 30,
        borderRadius: 7,
        border: "1.5px solid #e2e8f0",
        background: "#fff",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: variant === "danger" ? "#ef4444" : "#6b7280",
        transition: "border-color 0.15s, color 0.15s",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  width,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "100%",
          maxWidth: width || 480,
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            padding: "18px 20px 16px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 15, color: "#111827" }}>
            {title}
          </span>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: "none",
              background: "#f3f4f6",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6b7280",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: "block",
          fontSize: 12.5,
          fontWeight: 600,
          color: "#374151",
          marginBottom: 5,
        }}
      >
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#ef4444" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  type,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type || "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: "100%",
        height: 40,
        padding: "0 12px",
        borderRadius: 9,
        border: "1.5px solid #e2e8f0",
        background: disabled ? "#f9fafb" : "#fff",
        fontSize: 13,
        fontFamily: "inherit",
        color: "#111827",
        boxSizing: "border-box",
        outline: "none",
      }}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        width: "100%",
        height: 40,
        padding: "0 30px 0 12px",
        borderRadius: 9,
        border: "1.5px solid #e2e8f0",
        background: disabled ? "#f9fafb" : "#fff",
        fontSize: 13,
        fontFamily: "inherit",
        color: value ? "#111827" : "#9ca3af",
        cursor: disabled ? "not-allowed" : "pointer",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
        boxSizing: "border-box",
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        justifyContent: "flex-end",
        paddingTop: 16,
        marginTop: 4,
        borderTop: "1px solid #f1f5f9",
      }}
    >
      {children}
    </div>
  );
}

export function InlineAlert({
  message,
  type,
}: {
  message: string;
  type: "error" | "success" | "info";
}) {
  const map = {
    error: { bg: "#fef2f2", border: "#fecaca", color: "#dc2626" },
    success: { bg: "#f0fdf4", border: "#bbf7d0", color: "#16a34a" },
    info: { bg: "#eff6ff", border: "#bfdbfe", color: "#2563eb" },
  };
  const c = map[type];
  return (
    <div
      style={{
        padding: "9px 12px",
        borderRadius: 9,
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color,
        fontSize: 12.5,
        fontWeight: 600,
      }}
    >
      {message}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #e9ebf0",
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        flex: 1,
        minWidth: 160,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#111827",
            lineHeight: 1.1,
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
    </div>
  );
}

export function toast(
  message: string,
  type: "success" | "error" | "info" = "success",
) {
  try {
    window.dispatchEvent(
      new CustomEvent("toast", { detail: { type, message } }),
    );
  } catch {}
}
