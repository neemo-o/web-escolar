import { useEffect, useState } from "react";

type Toast = { id: number; type?: string; message: string };

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    function onToast(e: Event) {
      try {
        const detail = (e as CustomEvent).detail as
          | { type?: string; message?: string }
          | undefined;
        if (!detail || !detail.message) return;
        const t: Toast = {
          id: Date.now(),
          type: detail.type,
          message: detail.message,
        };
        setToasts((s) => [...s, t]);
        setTimeout(
          () => setToasts((s) => s.filter((x) => x.id !== t.id)),
          4000,
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
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          aria-live="polite"
          style={{
            minWidth: 240,
            padding: "10px 12px",
            borderRadius: 8,
            background: t.type === "error" ? "#fee2e2" : "#ecfccb",
            color: t.type === "error" ? "#991b1b" : "#365314",
            fontWeight: 700,
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
