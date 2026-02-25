let moduleToken: string | null = null;

export function setAuthToken(t: string | null) {
  moduleToken = t;
}

export async function fetchJson(input: string, init?: RequestInit) {
  const base = (import.meta.env.VITE_API_BASE as string) || "/api";
  const url = input.startsWith("http")
    ? input
    : `${base}${input.startsWith("/") ? "" : "/"}${input}`;

  // prefer module-level token (set by AuthContext), fallback to localStorage
  const token =
    moduleToken ??
    (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init && (init.headers as Record<string, string>)),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...(init || {}), headers });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    if (res.status === 401) {
      // notify listeners (AuthContext) that logout should happen
      try {
        window.dispatchEvent(new Event("auth:logout"));
      } catch {}
    }
    const message =
      data && (data.error || data.message)
        ? data.error || data.message
        : res.statusText;
    throw new Error(message || "Erro na requisição");
  }

  return data;
}

export async function fetchBlob(input: string, init?: RequestInit) {
  const base = (import.meta.env.VITE_API_BASE as string) || "/api";
  const url = input.startsWith("http")
    ? input
    : `${base}${input.startsWith("/") ? "" : "/"}${input}`;

  const token =
    moduleToken ??
    (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  const headers: Record<string, string> = {
    ...(init && (init.headers as Record<string, string>)),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...(init || {}), headers });
  if (!res.ok) {
    if (res.status === 401) {
      try {
        window.dispatchEvent(new Event("auth:logout"));
      } catch {}
    }
    let message = res.statusText;
    try {
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      message = data?.error || data?.message || message;
    } catch {}
    throw new Error(message || "Erro na requisição");
  }
  return await res.blob();
}

export default { fetchJson, fetchBlob, setAuthToken };
