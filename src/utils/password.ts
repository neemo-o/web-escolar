import crypto from "crypto";

export function generateTempPassword(): string {
  return crypto.randomBytes(6).toString("hex");
}
