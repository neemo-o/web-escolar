import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "warning" | "info";
type Toast = { id: number; type: ToastType; message: string; leaving?: boolean };

const DURATION_MS = 4500;
const LEAVE_MS = 220;

function colors(type: ToastType) {
  const primary = "var(--school-primary, #0891b2)";
  const map: Record<ToastType, { border: string; tint: string; text: string }> =
    {
      success: { border: "#16a34a", tint: "#f0fdf4", text: "#14532d" },
      error: { border: "#ef4444", tint: "#fef2f2", text: "#7f1d1d" },
      warning: { border: "#f59e0b", tint: "#fffbeb", text: "#7c2d12" },
      info: { border: primary, tint: "#eff6ff", text: "#0f172a" },
    };
  return map[type];
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    function onToast(e: Event) {
      try {
        const detail = (e as CustomEvent).detail as
          | { type?: ToastType; message?: string }
          | undefined;
        if (!detail || !detail.message) return;
        const type: ToastType = detail.type ?? "success";
        const t: Toast = {
          id: Date.now(),
          type,
          message: detail.message,
        };
        setToasts((s) => [...s, t]);
        window.setTimeout(() => {
          setToasts((s) =>
            s.map((x) => (x.id === t.id ? { ...x, leaving: true } : x)),
          );
        }, Math.max(0, DURATION_MS - LEAVE_MS));
        window.setTimeout(
          () => setToasts((s) => s.filter((x) => x.id !== t.id)),
          DURATION_MS,
        );
      } catch {}
    }
    window.addEventListener("toast", onToast as EventListener);
    return () => window.removeEventListener("toast", onToast as EventListener);
  }, []);

  if (toasts.length === 0) return null;
  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        top: 16,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          aria-live="polite"
          style={{
            minWidth: 240,
            maxWidth: 420,
            padding: "12px 12px",
            borderRadius: 14,
            background: "#fff",
            border: `1px solid #e9ebf0`,
            borderLeft: `5px solid ${colors(t.type).border}`,
            boxShadow: "0 18px 50px rgba(17,24,39,0.16)",
            color: "#111827",
            fontWeight: 650,
            fontSize: 13,
            lineHeight: 1.35,
            transform: t.leaving ? "translateY(-8px)" : "translateY(0)",
            opacity: t.leaving ? 0 : 1,
            transition: `opacity ${LEAVE_MS}ms ease, transform ${LEAVE_MS}ms cubic-bezier(.16,1,.3,1)`,
            pointerEvents: "auto",
          }}
          onClick={() =>
            setToasts((s) => s.filter((x) => x.id !== t.id))
          }
        >
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                marginTop: 3,
                background: colors(t.type).border,
                boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: colors(t.type).tint,
                  color: colors(t.type).text,
                  fontSize: 11.5,
                  fontWeight: 800,
                  letterSpacing: "0.2px",
                  marginBottom: 6,
                  textTransform: "uppercase",
                }}
              >
                {t.type}
              </div>
              <div style={{ color: "#111827" }}>{t.message}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
