"use client"

import { useState, useEffect, useRef } from "react"
import { X, Search, TrendingUp, ExternalLink, Loader2 } from "lucide-react"
import type { MarketResult } from "@/app/api/markets/route"
import { CATEGORIES } from "@/lib/utils"

interface Props {
  onClose: () => void
  onSelect: (market: MarketResult) => void
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

function formatEndDate(d: string | null): string {
  if (!d) return "Sem data"
  const date = new Date(d)
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

function ProbBar({ prob }: { prob: number }) {
  const color =
    prob >= 70 ? "var(--green)" : prob >= 40 ? "var(--yellow)" : prob >= 20 ? "var(--orange)" : "var(--red)"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full" style={{ width: `${prob}%`, background: color }} />
      </div>
      <span className="text-xs font-mono font-bold w-8 text-right" style={{ color }}>
        {prob}%
      </span>
    </div>
  )
}

export function BrowseMarketsModal({ onClose, onSelect }: Props) {
  const [query, setQuery] = useState("")
  const [markets, setMarkets] = useState<MarketResult[]>([])
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef<NodeJS.Timeout>()

  async function load(q: string) {
    setLoading(true)
    const res = await fetch(`/api/markets?q=${encodeURIComponent(q)}&limit=30`)
    if (res.ok) setMarkets(await res.json())
    setLoading(false)
  }

  // Initial load — top markets by volume
  useEffect(() => { load("") }, [])

  function handleSearch(value: string) {
    setQuery(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => load(value), 450)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[var(--bg-card)] rounded-xl border border-[var(--border)] shadow-2xl animate-fade-in flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <div>
            <h2 className="font-display text-lg font-semibold">Explorar Mercados</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Polymarket · ordenado por volume de transações
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-[var(--border)] shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Pesquisar mercados... (ex: bitcoin, trump, oil)"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="input-base pl-8"
              autoFocus
            />
          </div>
        </div>

        {/* Market list */}
        <div className="overflow-y-auto flex-1 p-3 flex flex-col gap-2">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-[var(--text-muted)]">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">A carregar mercados...</span>
            </div>
          ) : markets.length === 0 ? (
            <div className="text-center py-16 text-sm text-[var(--text-muted)]">
              Nenhum mercado encontrado para "{query}"
            </div>
          ) : (
            markets.map((market) => {
              const cat = CATEGORIES[market.suggestedCategory]
              return (
                <div
                  key={market.id}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 hover:border-[var(--border-bright)] transition-colors"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)]">
                        {cat.emoji} {cat.label}
                      </span>
                      {market.endDate && (
                        <span className="text-xs text-[var(--text-muted)] font-mono">
                          até {formatEndDate(market.endDate)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-[var(--text-muted)]">
                        <TrendingUp size={11} className="inline mr-0.5" />
                        {formatVolume(market.volume)}
                      </span>
                      <a
                        href={market.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>

                  {/* Question */}
                  <p className="text-sm text-[var(--text-primary)] leading-snug mb-2.5">
                    {market.question}
                  </p>

                  {/* Probability + action */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-xs text-[var(--text-muted)] mb-1">Probabilidade atual</p>
                      <ProbBar prob={market.probability} />
                    </div>
                    <button
                      onClick={() => onSelect(market)}
                      className="btn-primary text-xs px-3 py-1.5 shrink-0"
                    >
                      Prever neste mercado
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
