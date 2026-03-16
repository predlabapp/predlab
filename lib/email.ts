import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? "noreply@predlab.app"
const BASE_URL = process.env.NEXTAUTH_URL ?? "https://predlab.app"

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${BASE_URL}/api/auth/verify-email?token=${token}`
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Confirm your PredLab account",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0a0a0f;color:#e8e8f0">
        <img src="${BASE_URL}/logo-horizontal.svg" alt="PredLab" style="height:36px;margin-bottom:32px" />
        <h1 style="font-size:22px;font-weight:700;margin:0 0 12px">Confirm your email</h1>
        <p style="color:#8888aa;margin:0 0 28px">Click the button below to verify your email and activate your account.</p>
        <a href="${url}" style="display:inline-block;background:#7c6af7;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px">Confirm email</a>
        <p style="color:#555570;font-size:12px;margin-top:28px">Link expires in 24 hours. If you didn't create an account, ignore this email.</p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${BASE_URL}/auth/reset-password?token=${token}`
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Reset your PredLab password",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0a0a0f;color:#e8e8f0">
        <img src="${BASE_URL}/logo-horizontal.svg" alt="PredLab" style="height:36px;margin-bottom:32px" />
        <h1 style="font-size:22px;font-weight:700;margin:0 0 12px">Reset your password</h1>
        <p style="color:#8888aa;margin:0 0 28px">Click below to set a new password for your account.</p>
        <a href="${url}" style="display:inline-block;background:#7c6af7;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px">Reset password</a>
        <p style="color:#555570;font-size:12px;margin-top:28px">Link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `,
  })
}
