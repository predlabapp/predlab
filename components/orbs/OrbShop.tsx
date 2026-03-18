"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type ShopItem = {
  key: string
  label: string
  emoji: string
  cost: number
  description: string
}

const ITEMS: ShopItem[] = [
  { key: "badge_verificado", label: "Analista Verificado", emoji: "🔍", cost: 500,  description: "Badge exclusivo de analista" },
  { key: "badge_oraculo",    label: "Oráculo de Ouro",     emoji: "🔮", cost: 2000, description: "Badge raro e prestígio" },
  { key: "theme_neon",       label: "Tema Neon Purple",    emoji: "💜", cost: 1000, description: "Visual premium neon" },
  { key: "theme_matrix",     label: "Tema Matrix Green",   emoji: "💚", cost: 1000, description: "Visual estilo matrix" },
  { key: "theme_solar",      label: "Tema Solar Gold",     emoji: "🌟", cost: 1500, description: "Visual dourado solar" },
]

type Props = { currentOrbs: number }

export function OrbShop({ currentOrbs }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const buy = async (item: ShopItem) => {
    if (!confirm(`Comprar "${item.label}" por ${item.cost} 🔮?`)) return

    setLoading(item.key)
    setMessage(null)

    try {
      const res = await fetch("/api/orbs/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: item.key }),
      })
      const data = await res.json()

      if (data.success) {
        setMessage({ text: `${item.emoji} ${item.label} adquirido!`, ok: true })
        router.refresh()
      } else {
        setMessage({ text: data.message ?? "Erro ao comprar.", ok: false })
      }
    } catch {
      setMessage({ text: "Erro de rede.", ok: false })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div>
      {message && (
        <div
          className="mb-4 px-3 py-2 rounded-lg text-sm"
          style={{
            background: message.ok ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
            color: message.ok ? "var(--green)" : "var(--red)",
            border: `1px solid ${message.ok ? "var(--green)" : "var(--red)"}`,
          }}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ITEMS.map((item) => {
          const canAfford = currentOrbs >= item.cost
          return (
            <div
              key={item.key}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                opacity: canAfford ? 1 : 0.5,
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl">{item.emoji}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {item.label}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {item.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => buy(item)}
                disabled={!canAfford || loading === item.key}
                className="ml-3 shrink-0 px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-colors"
                style={{
                  background: canAfford ? "var(--accent-dim)" : "var(--border)",
                  color: canAfford ? "var(--accent)" : "var(--text-muted)",
                  cursor: canAfford ? "pointer" : "not-allowed",
                }}
              >
                {loading === item.key ? "..." : `${item.cost} 🔮`}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
