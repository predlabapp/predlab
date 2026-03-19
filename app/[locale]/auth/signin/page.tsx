"use client"

import { useEffect, useState } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "@/navigation"
import { Link } from "@/navigation"
import { Loader2 } from "lucide-react"

export default function SignInPage() {
  const { login, authenticated, getAccessToken, ready } = usePrivy()
  const { data: session, status } = useSession()
  const router = useRouter()
  const [authError, setAuthError] = useState("")
  const [loading, setLoading] = useState(false)

  // Already has NextAuth session → go to dashboard
  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard")
  }, [status])

  // Privy authenticated → create NextAuth session
  useEffect(() => {
    if (!authenticated) return

    setLoading(true)
    setAuthError("")

    getAccessToken().then(async (token) => {
      if (!token) {
        setAuthError("Não foi possível obter o token. Tenta novamente.")
        setLoading(false)
        return
      }

      const result = await signIn("privy", { token, redirect: false })

      if (result?.ok) {
        router.replace("/dashboard")
      } else {
        setAuthError(`Erro ao criar sessão: ${result?.error ?? "desconhecido"}`)
        setLoading(false)
      }
    }).catch((err) => {
      setAuthError(`Erro: ${err?.message ?? "desconhecido"}`)
      setLoading(false)
    })
  }, [authenticated])

  if (!ready || status === "loading") {
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
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>A criar sessão...</p>
            </div>
          ) : (
            <>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Entra com Google, email ou carteira
              </p>

              <button onClick={login} className="btn-primary w-full text-base py-3">
                🔮 Entrar no PredLab
              </button>

              {authError && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(248,113,113,0.1)", color: "var(--red)" }}>
                  {authError}
                </p>
              )}

              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Ao entrar, uma wallet Base é criada automaticamente para ti.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
