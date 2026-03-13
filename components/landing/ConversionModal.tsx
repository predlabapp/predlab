"use client"

import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

interface HotMarket {
  slug: string
  question: string
  probability: number
  categoryEmoji: string
}

interface Props {
  market: HotMarket | null
  onClose: () => void
}

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

export function ConversionModal({ market, onClose }: Props) {
  if (!market) return null

  const callbackUrl = `/dashboard?market=${encodeURIComponent(market.slug)}`

  function handleGoogle() {
    signIn("google", { callbackUrl })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-6 animate-fade-in max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
            🔮 Qual é a tua previsão?
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors touch-manipulation"
          >
            <X size={16} />
          </button>
        </div>

        {/* Market context */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 mb-5">
          <p className="text-sm text-[var(--text-primary)] leading-snug mb-2">
            {market.question}
          </p>
          <p className="text-xs font-mono text-[var(--accent)]">
            Mercado actual: {market.probability}%
          </p>
        </div>

        {/* Separator */}
        <div className="border-t border-[var(--border)] mb-5" />

        <p className="text-sm text-[var(--text-secondary)] mb-1 text-center">
          Para registar a tua previsão
        </p>
        <p className="text-sm font-semibold text-[var(--text-primary)] mb-1 text-center">
          cria uma conta grátis.
        </p>
        <p className="text-xs text-[var(--text-muted)] text-center mb-5">
          É gratuito e demora 30 segundos.
        </p>

        {/* Google */}
        <button
          onClick={handleGoogle}
          className="btn-ghost w-full flex items-center justify-center gap-2 mb-3"
        >
          <GoogleIcon />
          Continuar com Google
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-xs text-[var(--text-muted)]">ou</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        {/* Email signup */}
        <a
          href={`/auth/signup?market=${encodeURIComponent(market.slug)}`}
          className="btn-primary w-full flex items-center justify-center text-center mb-4"
        >
          Criar conta com email
        </a>

        {/* Login link */}
        <p className="text-xs text-[var(--text-muted)] text-center">
          Já tens conta?{" "}
          <a
            href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="text-[var(--accent)] hover:underline"
          >
            Entrar
          </a>
        </p>
      </div>
    </div>
  )
}
