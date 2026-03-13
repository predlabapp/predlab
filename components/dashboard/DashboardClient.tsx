"use client"

import { useState, useMemo, useEffect } from "react"
import { Prediction } from "@/types"
import { PredictionCard } from "@/components/predictions/PredictionCard"
import { CreatePredictionModal } from "@/components/predictions/CreatePredictionModal"
import { BrowseMarketsModal } from "@/components/predictions/BrowseMarketsModal"
import type { MarketResult } from "@/app/api/markets/route"
import { StatsBar } from "@/components/dashboard/StatsBar"
import { OnboardingState } from "@/components/dashboard/OnboardingState"
import { HotMarketsBar } from "@/components/dashboard/HotMarketsBar"
import { CATEGORIES } from "@/lib/utils"
import { Plus, Search, Tag, X, Globe } from "lucide-react"
import { Category } from "@prisma/client"

interface Props {
  initialPredictions: Prediction[]
  pendingMarketSlug?: string | null
}

export function DashboardClient({ initialPredictions, pendingMarketSlug }: Props) {
  const [predictions, setPredictions] = useState<Prediction[]>(initialPredictions)
  const [showModal, setShowModal] = useState(false)
  const [showBrowseMarkets, setShowBrowseMarkets] = useState(false)
  const [selectedMarket, setSelectedMarket] = useState<MarketResult | null>(null)

  // Handle pending market from landing page "Prever" flow
  useEffect(() => {
    if (!pendingMarketSlug) return
    // Clear the URL param without reload
    window.history.replaceState({}, "", "/dashboard")
    // Fetch market data and open modal
    fetch(`/api/markets?q=${encodeURIComponent(pendingMarketSlug)}&limit=1`)
      .then((r) => r.json())
      .then((data) => {
        const market: MarketResult | undefined = data.markets?.[0]
        if (market) {
          setSelectedMarket(market)
        }
        setShowModal(true)
      })
      .catch(() => {
        // Still open modal without pre-selected market
        setShowModal(true)
      })
  }, [pendingMarketSlug])
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState<Category | "ALL">("ALL")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "resolved">("all")
  const [filterTag, setFilterTag] = useState<string | null>(null)

  // Collect all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>()
    predictions.forEach((p) => p.tags.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [predictions])

  function handleMarketSelected(market: MarketResult) {
    setSelectedMarket(market)
    setShowBrowseMarkets(false)
    setShowModal(true)
  }

  function handleModalClose() {
    setShowModal(false)
    setSelectedMarket(null)
  }

  function handleCreated(p: Prediction) {
    setPredictions((prev) => [p, ...prev])
    setSelectedMarket(null)
    setShowModal(false)

    // Auto-match only for free-form predictions (market-linked ones are already matched)
    if (!p.polymarketSlug) {
      fetch(`/api/predictions/${p.id}/market-match`, { method: "POST" })
        .then((r) => r.json())
        .then((data) => {
          if (data.matched) {
            setPredictions((prev) =>
              prev.map((pred) =>
                pred.id === p.id
                  ? {
                      ...pred,
                      polymarketQuestion: data.market.question,
                      polymarketProbability: data.market.probability,
                      polymarketUrl: data.market.url,
                    }
                  : pred
              )
            )
          }
        })
        .catch(() => {})
    }
  }

  function handleMarketUpdate(id: string, data: Partial<Prediction>) {
    setPredictions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    )
  }

  function handleDelete(id: string) {
    setPredictions((prev) => prev.filter((p) => p.id !== id))
  }

  const filtered = predictions.filter((p) => {
    const matchSearch =
      !search || p.title.toLowerCase().includes(search.toLowerCase())
    const matchCategory =
      filterCategory === "ALL" || p.category === filterCategory
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "pending" && !p.resolution) ||
      (filterStatus === "resolved" && !!p.resolution)
    const matchTag = !filterTag || p.tags.includes(filterTag)
    return matchSearch && matchCategory && matchStatus && matchTag
  })

  const hasFilters =
    search || filterCategory !== "ALL" || filterStatus !== "all" || filterTag

  function clearFilters() {
    setSearch("")
    setFilterCategory("ALL")
    setFilterStatus("all")
    setFilterTag(null)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <StatsBar />

      <HotMarketsBar onMarketSelect={handleMarketSelected} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            placeholder="Pesquisar previsões..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-8"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as Category | "ALL")}
          className="input-base sm:w-44"
        >
          <option value="ALL">Todas as categorias</option>
          {Object.entries(CATEGORIES).map(([key, val]) => (
            <option key={key} value={key}>
              {val.emoji} {val.label}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="input-base sm:w-36"
        >
          <option value="all">Todas</option>
          <option value="pending">Pendentes</option>
          <option value="resolved">Resolvidas</option>
        </select>

        <button
          onClick={() => setShowBrowseMarkets(true)}
          className="btn-ghost flex items-center gap-2 shrink-0"
          title="Explorar mercados Polymarket"
        >
          <Globe size={16} />
          <span className="hidden sm:inline">Mercados</span>
        </button>

        <button
          onClick={() => { setSelectedMarket(null); setShowModal(true) }}
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          <Plus size={16} />
          Nova previsão
        </button>
      </div>

      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-5">
          <Tag size={12} className="text-[var(--text-muted)]" />
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className="text-xs px-2.5 py-1 rounded-full border transition-colors"
              style={{
                borderColor:
                  filterTag === tag ? "var(--accent)" : "var(--border)",
                color:
                  filterTag === tag
                    ? "var(--accent)"
                    : "var(--text-secondary)",
                background:
                  filterTag === tag
                    ? "var(--accent-glow)"
                    : "transparent",
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Active filters summary */}
      {hasFilters && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-[var(--text-muted)]">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </p>
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={12} />
            Limpar filtros
          </button>
        </div>
      )}

      {/* Onboarding — shown only when user has zero predictions and no filters active */}
      {predictions.length === 0 && (
        <OnboardingState
          onFreeForm={() => { setSelectedMarket(null); setShowModal(true) }}
        />
      )}

      {/* Grid */}
      {predictions.length > 0 && filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[var(--text-muted)] text-sm">Nenhuma previsão encontrada.</p>
        </div>
      ) : predictions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <PredictionCard key={p.id} prediction={p} onDelete={handleDelete} onMarketUpdate={handleMarketUpdate} />
          ))}
        </div>
      ) : null}

      {showBrowseMarkets && (
        <BrowseMarketsModal
          onClose={() => setShowBrowseMarkets(false)}
          onSelect={handleMarketSelected}
        />
      )}

      {showModal && (
        <CreatePredictionModal
          onClose={handleModalClose}
          onCreated={handleCreated}
          market={selectedMarket}
        />
      )}
    </div>
  )
}
