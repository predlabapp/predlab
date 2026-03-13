"use client"

import { useEffect, useState } from "react"
import { TrendingUp, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import type { MarketResult } from "@/app/api/markets/route"
import { CATEGORIES } from "@/lib/utils"

interface Props {
  onMarketSelect: (market: MarketResult) => void
}

function probColor(p: number) {
  if (p >= 70) return "var(--green)"
  if (p >= 40) return "var(--yellow)"
  if (p >= 20) return "var(--orange)"
  return "var(--red)"
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

export function HotMarketsBar({ onMarketSelect }: Props) {
  const [markets, setMarkets] = useState<MarketResult[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    fetch("/api/markets?limit=10")
      .then((r) => r.json())
      .then((data) => {
        setMarkets(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-[var(--accent)]" />
          <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
            Mercados em alta · Polymarket
          </span>
          {!loading && (
            <span className="text-xs text-[var(--text-muted)]">
              ({markets.length})
            </span>
          )}
        </div>
        {collapsed
          ? <ChevronDown size={14} className="text-[var(--text-muted)]" />
          : <ChevronUp size={14} className="text-[var(--text-muted)]" />
        }
      </button>

      {!collapsed && (
        <>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-[var(--text-muted)]">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-xs">A carregar mercados...</span>
            </div>
          ) : markets.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] text-center py-6">
              Não foi possível carregar mercados.
            </p>
          ) : (
            /* Horizontal scroll */
            <div className="flex gap-3 overflow-x-auto px-4 pb-4 pt-1 snap-x snap-mandatory scrollbar-none"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {markets.map((market) => {
                const cat = CATEGORIES[market.suggestedCategory]
                const pColor = probColor(market.probability)
                return (
                  <div
                    key={market.id}
                    className="shrink-0 w-48 sm:w-52 snap-start rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 flex flex-col gap-2 hover:border-[var(--border-bright)] transition-colors"
                  >
                    {/* Category + volume */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">
                        {cat.emoji} {cat.label}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] font-mono">
                        {formatVolume(market.volume)}
                      </span>
                    </div>

                    {/* Question */}
                    <p className="text-xs text-[var(--text-primary)] leading-snug line-clamp-3 flex-1">
                      {market.question}
                    </p>

                    {/* Probability bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-[var(--border)]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${market.probability}%`, background: pColor }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold w-7 text-right" style={{ color: pColor }}>
                        {market.probability}%
                      </span>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => onMarketSelect(market)}
                      className="w-full text-xs py-2 rounded-md border border-[var(--accent-dim)] text-[var(--accent)] hover:bg-[var(--accent-glow)] transition-colors touch-manipulation"
                    >
                      Prever
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
