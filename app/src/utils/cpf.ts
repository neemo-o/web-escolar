export function cleanCpf(raw: string | null | undefined): string {
  if (!raw) return "";
  return String(raw).replace(/\D/g, "");
}

export function formatCpf(raw: string | null | undefined): string {
  const cpf = cleanCpf(raw);
  // Don't return empty string - return formatted value as user types
  if (cpf.length === 0) return "";
  if (cpf.length <= 3) return cpf;
  if (cpf.length <= 6) return `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
  if (cpf.length <= 9)
    return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
}

export function isValidCpf(raw: string | null | undefined): boolean {
  const cpf = cleanCpf(raw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calcCheckDigit = (base: string, factorStart: number): number => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) {
      sum += parseInt(base.charAt(i), 10) * (factorStart - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  const baseNine = cpf.substring(0, 9);
  const d1 = calcCheckDigit(baseNine, 10);
  if (d1 !== parseInt(cpf.charAt(9), 10)) return false;

  const baseTen = cpf.substring(0, 10);
  const d2 = calcCheckDigit(baseTen, 11);
  if (d2 !== parseInt(cpf.charAt(10), 10)) return false;

  return true;
}

export function maskCpf(raw: string | null | undefined): string {
  const cpf = cleanCpf(raw);
  if (cpf.length !== 11) return "";
  const p1 = cpf.substring(0, 3);
  const p4 = cpf.substring(9, 11);
  return `${p1}.***.***-${p4}`;
}
