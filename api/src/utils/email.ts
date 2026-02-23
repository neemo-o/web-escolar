import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT
  ? parseInt(process.env.SMTP_PORT)
  : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@edusys.local";

let transporter: any = null;
if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string | null,
  tempPassword: string,
) {
  const subject = "Solicitação de redefinição de senha - EduSys";
  const text = `Olá ${name ?? "Usuário"},\n\nRecebemos uma solicitação para redefinir sua senha. Uma senha temporária foi gerada: ${tempPassword}\n\nAo entrar com essa senha, recomendamos alterá-la imediatamente em seu perfil.\n\nAtenciosamente,\nEquipe EduSys`;
  const html = `<p>Olá ${name ?? "Usuário"},</p><p>Recebemos uma solicitação para redefinir sua senha. Uma senha temporária foi gerada: <strong>${tempPassword}</strong></p><p>Ao entrar com essa senha, recomendamos alterá-la imediatamente em seu perfil.</p><p>Atenciosamente,<br/>Equipe EduSys</p>`;

  if (transporter) {
    try {
      await transporter.sendMail({ from: FROM_EMAIL, to, subject, text, html });
      return true;
    } catch (err) {
      console.warn("Failed to send password reset email", err);
      // fallthrough to console log
    }
  }

  // fallback: log to server console
  console.log(`Password reset email to ${to}: ${tempPassword}`);
  return false;
}

export default { sendPasswordResetEmail };
