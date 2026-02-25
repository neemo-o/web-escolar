export function cleanPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  return String(raw).replace(/\D/g, "");
}

export function isValidBrPhone(raw: string | null | undefined): boolean {
  const digits = cleanPhone(raw);
  if (digits.length !== 10 && digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  return true;
}

export function formatBrPhone(raw: string | null | undefined): string {
  const digits = cleanPhone(raw);
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }
  return "";
}

