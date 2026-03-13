"use client"

import { useState } from "react"
import { Lock } from "lucide-react"

interface HotMarket {
  slug: string
  question: string
  probability: number
  volume: number
  volumeChange24h: number
  expiresAt: string
  category: string
  categoryEmoji: string
  isHot: boolean
  isTrending: boolean
}

interface Props {
  market: HotMarket
  onPredict: (market: HotMarket) => void
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v}`
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" })
}

export function MarketCard({ market, onPredict }: Props) {
  const [pulse, setPulse] = useState(false)

  function handleSliderInteraction() {
    setPulse(true)
    setTimeout(() => setPulse(false), 600)
  }

  const badge = market.isHot
    ? { label: "🔥 Alto volume", color: "var(--orange)" }
    : market.isTrending
    ? { label: "⚡ Em alta", color: "var(--yellow)" }
    : null

  return (
    <div
      className={`rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-5 flex flex-col gap-3 transition-all duration-200 hover:border-[var(--border-bright)] hover:-translate-y-0.5 ${
        pulse ? "animate-pulse" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-1">
          {market.categoryEmoji}{" "}
          <span className="uppercase tracking-wider">{market.category}</span>
        </span>
        {badge && (
          <span
            className="text-xs font-mono px-2 py-0.5 rounded-full border"
            style={{ color: badge.color, borderColor: badge.color, background: `${badge.color}18` }}
          >
            {badge.label}
          </span>
        )}
      </div>

      {/* Question */}
      <p className="text-sm font-medium text-[var(--text-primary)] leading-snug line-clamp-2">
        {market.question}
      </p>

      {/* Probability bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[var(--text-muted)]">Probabilidade</span>
          <span className="font-mono text-sm font-bold text-[var(--accent)]">
            {market.probability}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${market.probability}%`,
              background: "linear-gradient(90deg, var(--accent-dim), var(--accent))",
            }}
          />
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 text-xs text-[var(--text-muted)] font-mono">
        <span>Vol: {formatVolume(market.volume)}</span>
        <span>Expira: {formatDate(market.expiresAt)}</span>
      </div>

      {/* Locked slider */}
      <div
        className="rounded-lg border border-dashed border-[var(--border)] p-3 flex items-center gap-2 cursor-not-allowed"
        style={{ opacity: 0.6 }}
        onClick={handleSliderInteraction}
        onMouseDown={handleSliderInteraction}
      >
        <Lock size={12} className="text-[var(--text-muted)] shrink-0" />
        <div className="flex-1 h-1.5 rounded-full bg-[var(--border)] relative">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-[var(--accent-dim)]"
            style={{ width: "50%" }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-[var(--accent-dim)] bg-[var(--bg-card)]"
            style={{ left: "calc(50% - 8px)" }}
          />
        </div>
        <span className="text-xs font-mono text-[var(--text-muted)]">50%</span>
      </div>

      {/* CTA */}
      <button
        onClick={() => onPredict(market)}
        className="btn-primary w-full text-sm py-2.5 touch-manipulation"
      >
        Prever neste mercado
      </button>
    </div>
  )
}
