"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Loader2, Copy, Check } from "lucide-react"

interface PaymentEntry {
  userId: string
  name: string
  image: string | null
  amount: number | null
  status: "PENDING" | "CONFIRMED" | "REJECTED"
  confirmedAt: string | null
  note: string | null
  confirmerName: string | null
}

interface Summary {
  total: number
  confirmed: number
  pending: number
  totalAmount: number
}

interface Props {
  slug: string
  isAdmin: boolean
  currentUserId: string | null
  pixKey?: string | null
  entryAmount?: number | null
}

const STATUS_CONFIG = {
  CONFIRMED: { label: "Confirmado", icon: "✅", color: "var(--green)" },
  PENDING:   { label: "Pendente",   icon: "⏳", color: "var(--yellow)" },
  REJECTED:  { label: "Rejeitado",  icon: "❌", color: "var(--red)" },
}

export function BolaoPayments({ slug, isAdmin, currentUserId, pixKey, entryAmount }: Props) {
  const [payments, setPayments] = useState<PaymentEntry[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [signaling, setSignaling] = useState(false)
  const [copiedPix, setCopiedPix] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/bolaos/${slug}/payments`)
    const data = await res.json()
    setPayments(data.payments ?? [])
    setSummary(data.summary ?? null)
    setLoading(false)
  }, [slug])

  useEffect(() => { load() }, [load])

  async function handleAction(userId: string, status: "CONFIRMED" | "REJECTED" | "PENDING") {
    setActionLoading(`${userId}-${status}`)
    await fetch(`/api/bolaos/${slug}/payments/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    await load()
    setActionLoading(null)
  }

  async function handleSignal() {
    setSignaling(true)
    await fetch(`/api/bolaos/${slug}/payments/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: "Pix enviado" }),
    })
    await load()
    setSignaling(false)
  }

  async function handleCopyPix() {
    if (!pixKey) return
    await navigator.clipboard.writeText(pixKey)
    setCopiedPix(true)
    setTimeout(() => setCopiedPix(false), 2000)
  }

  const myPayment = payments.find((p) => p.userId === currentUserId)

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary bar */}
      {summary && (
        <div
          className="grid grid-cols-3 gap-3 p-4 rounded-xl"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          <div className="text-center">
            <p className="font-mono text-xl font-bold" style={{ color: "var(--green)" }}>
              {summary.confirmed}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Confirmados</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-xl font-bold" style={{ color: "var(--yellow)" }}>
              {summary.pending}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Pendentes</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-xl font-bold" style={{ color: "var(--accent)" }}>
              {summary.totalAmount > 0 ? `R$${summary.totalAmount.toFixed(0)}` : "—"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Arrecadado</p>
          </div>
        </div>
      )}

      {/* My payment action (if not admin and not confirmed) */}
      {!isAdmin && myPayment?.status !== "CONFIRMED" && (
        <div
          className="flex items-center justify-between p-3 rounded-xl"
          style={{ background: "var(--accent-glow)", border: "1px solid var(--accent-dim)" }}
        >
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {myPayment?.status === "PENDING" ? "Sinalizaste o pagamento — aguardando confirmação" : "O teu pagamento ainda não foi registado"}
            </p>
            {entryAmount && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Valor: R${entryAmount.toFixed(2)}
              </p>
            )}
          </div>
          {myPayment?.status !== "PENDING" && (
            <button
              onClick={handleSignal}
              disabled={signaling}
              className="btn-primary text-xs px-3 py-1.5 flex-shrink-0"
            >
              {signaling ? <Loader2 size={12} className="animate-spin" /> : "Já paguei"}
            </button>
          )}
        </div>
      )}

      {/* Pix key */}
      {pixKey && (
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono uppercase" style={{ color: "var(--text-muted)" }}>
              Chave Pix do organizador
            </p>
            <p className="text-sm font-mono truncate mt-0.5" style={{ color: "var(--text-primary)" }}>
              {pixKey}
            </p>
          </div>
          <button
            onClick={handleCopyPix}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: copiedPix ? "var(--accent-dim)" : "var(--bg-card)", border: "1px solid var(--border)", color: copiedPix ? "var(--accent)" : "var(--text-secondary)" }}
          >
            {copiedPix ? <Check size={12} /> : <Copy size={12} />}
            {copiedPix ? "Copiado!" : "Copiar"}
          </button>
        </div>
      )}

      {/* Payment list */}
      <div className="flex flex-col gap-2">
        {payments.map((p) => {
          const cfg = STATUS_CONFIG[p.status]
          const isMe = p.userId === currentUserId
          return (
            <div
              key={p.userId}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: isMe ? "var(--accent-glow)" : "var(--bg)",
                border: `1px solid ${isMe ? "var(--accent-dim)" : "var(--border)"}`,
              }}
            >
              {p.image ? (
                <Image src={p.image} alt={p.name} width={32} height={32} className="rounded-full flex-shrink-0" />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
                >
                  {p.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: isMe ? "var(--accent)" : "var(--text-primary)" }}>
                  {p.name}
                  {isMe && <span className="ml-1 text-xs font-normal" style={{ color: "var(--text-muted)" }}>(você)</span>}
                </p>
                {p.note && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{p.note}</p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-mono" style={{ color: cfg.color }}>
                  {cfg.icon} {cfg.label}
                </span>

                {isAdmin && p.status !== "CONFIRMED" && (
                  <button
                    onClick={() => handleAction(p.userId, "CONFIRMED")}
                    disabled={actionLoading === `${p.userId}-CONFIRMED`}
                    className="text-xs px-2 py-1 rounded-md transition-colors"
                    style={{ background: "rgba(52,211,153,0.1)", color: "var(--green)", border: "1px solid rgba(52,211,153,0.3)" }}
                  >
                    {actionLoading === `${p.userId}-CONFIRMED` ? <Loader2 size={10} className="animate-spin" /> : "✅"}
                  </button>
                )}
                {isAdmin && p.status !== "REJECTED" && p.status !== "CONFIRMED" && (
                  <button
                    onClick={() => handleAction(p.userId, "REJECTED")}
                    disabled={actionLoading === `${p.userId}-REJECTED`}
                    className="text-xs px-2 py-1 rounded-md transition-colors"
                    style={{ background: "rgba(248,113,113,0.1)", color: "var(--red)", border: "1px solid rgba(248,113,113,0.3)" }}
                  >
                    {actionLoading === `${p.userId}-REJECTED` ? <Loader2 size={10} className="animate-spin" /> : "❌"}
                  </button>
                )}
                {isAdmin && p.status === "CONFIRMED" && (
                  <button
                    onClick={() => handleAction(p.userId, "PENDING")}
                    className="text-xs px-2 py-1 rounded-md"
                    style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                  >
                    Desfazer
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
