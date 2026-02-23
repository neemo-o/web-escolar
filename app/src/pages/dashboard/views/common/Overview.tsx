import React, { useEffect, useState } from "react";
import PagePlaceholder from "../../PagePlaceholder";
import { useAuth } from "../../../../contexts/AuthContext";
import { useLocation } from "react-router-dom";

function ToastBanner({ message }: { message: string }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 3500);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div style={{ marginBottom: 12 }} role="status" aria-live="polite">
      <div
        style={{
          padding: "10px 12px",
          borderRadius: 8,
          background: "#fee2e2",
          color: "#991b1b",
          fontWeight: 700,
        }}
      >
        {message}
      </div>
    </div>
  );
}

export default function Overview() {
  const { user } = useAuth();
  const loc = useLocation();
  const toast = (loc.state as any)?.toast as
    | { type?: string; message?: string }
    | undefined;
  return (
    <>
      {toast?.message && <ToastBanner message={toast.message} />}
      <PagePlaceholder pageId="overview" user={user} />
    </>
  );
}
