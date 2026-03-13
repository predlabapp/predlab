"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

function SignUpForm() {
  const searchParams = useSearchParams()
  const marketSlug = searchParams.get("market")
  const callbackUrl = marketSlug
    ? `/dashboard?market=${encodeURIComponent(marketSlug)}`
    : "/dashboard"

  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError("A password deve ter pelo menos 8 caracteres.")
      return
    }
    setLoading(true)
    setError("")

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Erro ao criar conta.")
      setLoading(false)
      return
    }

    await signIn("credentials", { email, password, callbackUrl })
  }

  async function handleGoogle() {
    await signIn("google", { callbackUrl })
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-2xl font-bold gradient-text">
            🔮 PredLab
          </Link>
          <p className="text-[var(--text-muted)] text-sm mt-2">
            Cria a tua conta
          </p>
          {marketSlug && (
            <p className="text-xs text-[var(--accent)] mt-1 font-mono">
              Vais prever assim que entras →
            </p>
          )}
        </div>

        <div className="card space-y-4">
          <button
            onClick={handleGoogle}
            className="btn-ghost w-full flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar com Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--text-muted)]">ou</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-base"
                placeholder="O teu nome"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base"
                placeholder="tu@exemplo.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-base"
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>

            {error && (
              <p className="text-xs text-[var(--red)] bg-[rgba(248,113,113,0.1)] px-3 py-2 rounded-md">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
              {loading ? "A criar conta..." : "Criar conta"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--text-muted)] mt-4">
          Já tens conta?{" "}
          <Link
            href={marketSlug ? `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/auth/signin"}
            className="text-[var(--accent)] hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  )
}
