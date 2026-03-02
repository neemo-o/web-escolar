import { useRef, useState } from "react";

interface AvatarUploadProps {
  currentUrl?: string | null;
  name: string;
  uploadUrl: string;
  onSuccess: (newUrl: string) => void;
  size?: number;
  disabled?: boolean;
}

// Get initials from name (up to 2 words)
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function AvatarUpload({
  currentUrl,
  name,
  uploadUrl,
  onSuccess,
  size = 80,
  disabled = false,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hovering, setHovering] = useState(false);

  const initials = getInitials(name);
  const sizePx = `${size}px`;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Tipo de arquivo inválido. Selecione uma imagem.");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const baseUrl = import.meta.env.VITE_API_BASE || "/api";

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${baseUrl}${uploadUrl}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao fazer upload");
      }

      const data = await response.json();
      const newUrl = data.avatarUrl || data.logoUrl;
      onSuccess(newUrl);
    } catch (err: any) {
      setError(err.message || "Erro ao fazer upload");
    } finally {
      setLoading(false);
      // Clear input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function handleClick() {
    if (!disabled && !loading) {
      inputRef.current?.click();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div
        style={{
          position: "relative",
          width: sizePx,
          height: sizePx,
          cursor: disabled ? "default" : "pointer",
        }}
        onMouseEnter={() => !disabled && setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={handleClick}
      >
        {/* Avatar Image or Initials */}
        {currentUrl ? (
          <img
            src={currentUrl}
            alt={name}
            style={{
              width: sizePx,
              height: sizePx,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #e2e8f0",
            }}
          />
        ) : (
          <div
            style={{
              width: sizePx,
              height: sizePx,
              borderRadius: "50%",
              background: "#e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: size * 0.35,
              color: "#64748b",
              border: "2px solid #e2e8f0",
            }}
          >
            {initials}
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: size * 0.3,
                height: size * 0.3,
                border: "3px solid rgba(255,255,255,0.3)",
                borderTopColor: "white",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        )}

        {/* Hover Overlay */}
        {!disabled && !loading && hovering && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "4px 0",
              background: "rgba(0, 0, 0, 0.6)",
              color: "white",
              fontSize: size * 0.18,
              textAlign: "center",
              borderRadius: "0 0 50% 50%",
            }}
          >
            Alterar
          </div>
        )}
      </div>

      {/* Hidden Input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileSelect}
        disabled={disabled || loading}
      />

      {/* Error Message */}
      {error && (
        <span style={{ color: "#ef4444", fontSize: 12 }}>{error}</span>
      )}
    </div>
  );
}
