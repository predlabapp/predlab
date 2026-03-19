"use client"

import { useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Link } from "@/navigation"
import { Loader2 } from "lucide-react"

export default function SignInPage() {
  const { login, authenticated, getAccessToken, ready } = usePrivy()
  const { data: session } = useSession()
  const router = useRouter()

  // Already has NextAuth session → go to dashboard
  useEffect(() => {
    if (session) router.replace("/dashboard")
  }, [session])

  // Privy authenticated → create NextAuth session
  useEffect(() => {
    if (!authenticated) return

    getAccessToken().then(async (token) => {
      if (!token) return
      const result = await signIn("privy", { token, redirect: false })
      if (result?.ok) router.replace("/dashboard")
    })
  }, [authenticated])

  if (!ready) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--text-muted)" }} />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="flex justify-center">
            <img src="/logo-horizontal.svg" alt="PredLab" style={{ height: 40 }} />
          </Link>
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
            O teu laboratório de previsões
          </p>
        </div>

        <div className="card text-center py-8 space-y-4">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Entra com Google, email ou carteira
          </p>

          <button
            onClick={login}
            className="btn-primary w-full text-base py-3"
          >
            🔮 Entrar no PredLab
          </button>

          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Ao entrar, uma wallet Base é criada automaticamente para ti.
          </p>
        </div>
      </div>
    </main>
  )
}
