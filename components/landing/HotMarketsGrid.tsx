"use client"

import { useState, useEffect } from "react"
import { MarketCard } from "./MarketCard"
import { ConversionModal } from "./ConversionModal"

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

const TABS = [
  { id: "TRENDING", label: "Trending", emoji: "🔥" },
  { id: "POLITICS", label: "Política", emoji: "🗳️" },
  { id: "CRYPTO", label: "Crypto", emoji: "₿" },
  { id: "GEOPOLITICS", label: "Geopolítica", emoji: "🌍" },
  { id: "SPORTS", label: "Esportes", emoji: "⚽" },
  { id: "ECONOMY", label: "Economia", emoji: "📈" },
  { id: "TECH", label: "Tech", emoji: "💻" },
]

interface Props {
  initialMarkets?: HotMarket[]
}

export function HotMarketsGrid({ initialMarkets = [] }: Props) {
  const [activeTab, setActiveTab] = useState("TRENDING")
  const [markets, setMarkets] = useState<HotMarket[]>(initialMarkets)
  const [loading, setLoading] = useState(false)
  const [selectedMarket, setSelectedMarket] = useState<HotMarket | null>(null)

  useEffect(() => {
    async function fetchMarkets() {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/markets/hot?category=${activeTab}&limit=10`
        )
        const data = await res.json()
        setMarkets(data.markets ?? [])
      } catch {
        setMarkets([])
      } finally {
        setLoading(false)
      }
    }
    fetchMarkets()
  }, [activeTab])

  return (
    <section id="mercados" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Section header */}
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-1">
          🔥 Mercados em Alta
        </h2>
        <div
          className="w-full h-px mb-5"
          style={{
            background:
              "linear-gradient(90deg, var(--accent), transparent)",
          }}
        />

        {/* Category tabs — horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs transition-all touch-manipulation ${
                activeTab === tab.id
                  ? "bg-[var(--accent)] text-white font-medium"
                  : "border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-bright)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-60 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] animate-pulse"
            />
          ))}
        </div>
      ) : markets.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)] text-sm">
          Sem mercados disponíveis nesta categoria agora.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {markets.map((m) => (
            <MarketCard
              key={m.slug}
              market={m}
              onPredict={setSelectedMarket}
            />
          ))}
        </div>
      )}

      {/* Conversion modal */}
      {selectedMarket && (
        <ConversionModal
          market={selectedMarket}
          onClose={() => setSelectedMarket(null)}
        />
      )}
    </section>
  )
}
