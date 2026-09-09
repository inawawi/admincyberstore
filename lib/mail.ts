import nodemailer from "nodemailer";
import { env } from "@/lib/env";

export async function sendOtpEmail(
  email: string,
  name: string,
  otp: string,
  purpose: "verify" | "reset" = "verify",
) {
  if (!env.mail.host) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[mail disabled] OTP ${purpose} for ${email}: ${otp}`);
    }
    return false;
  }
  const transporter = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.port === 465,
    auth: env.mail.user
      ? { user: env.mail.user, pass: env.mail.password }
      : undefined,
  });
  const title = purpose === "verify" ? "Verifikasi akun" : "Reset password";
  await transporter.sendMail({
    from: `"${env.mail.fromName}" <${env.mail.fromAddress}>`,
    to: email,
    subject: `${title} Cyber Store`,
    html: `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:auto;padding:28px;border:1px solid #e5e7eb;border-radius:16px">
      <h2 style="color:#005fb8">${title}</h2>
      <p>Halo <strong>${name}</strong>, gunakan kode berikut:</p>
      <div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:18px;background:#f3f6fb;border-radius:12px;text-align:center">${otp}</div>
      <p style="color:#64748b">Kode berlaku selama 10 menit. Abaikan email ini jika Anda tidak meminta kode.</p>
    </div>`,
  });
  return true;
}
