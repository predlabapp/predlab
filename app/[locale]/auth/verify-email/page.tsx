import { Link } from "@/navigation"

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in text-center">
        <div className="text-5xl mb-6">📬</div>
        <h1 className="font-display text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
          Check your email
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          We sent a confirmation link to your email address. Click it to activate your account.
        </p>
        <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
          Didn't receive it? Check your spam folder.
        </p>
        <Link href="/auth/signin" className="btn-ghost text-sm">
          Back to sign in
        </Link>
      </div>
    </main>
  )
}
