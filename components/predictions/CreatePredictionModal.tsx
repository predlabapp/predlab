"use client"

import { useState } from "react"
import { X, ExternalLink, Lock } from "lucide-react"
import { CATEGORIES } from "@/lib/utils"
import { Category } from "@prisma/client"
import { Prediction } from "@/types"
import { useToast } from "@/components/ui/Toast"
import type { MarketResult } from "@/app/api/markets/route"
import { useTranslations } from "next-intl"

interface Props {
  onClose: () => void
  onCreated: (p: Prediction) => void
  market?: MarketResult | null
}

export function CreatePredictionModal({ onClose, onCreated, market }: Props) {
  const { toast } = useToast()
  const t = useTranslations("CreatePredictionModal")
  const tCat = useTranslations("Categories")

  // When linked to a market, title and date are locked
  const [title, setTitle] = useState(market?.question ?? "")
  const [description, setDescription] = useState("")
  const [probability, setProbability] = useState(50)
  const [category, setCategory] = useState<Category>(market?.suggestedCategory ?? "OTHER")
  const [expiresAt, setExpiresAt] = useState(
    market?.endDate ? market.endDate.split("T")[0] : ""
  )
  const [evidence, setEvidence] = useState("")
  const [tags, setTags] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isMarketLinked = !!market
  const marketProb = market?.probability ?? null

  const probColor =
    probability >= 70 ? "var(--green)"
    : probability >= 40 ? "var(--yellow)"
    : probability >= 20 ? "var(--orange)"
    : "var(--red)"

  const divergence = marketProb !== null ? Math.abs(probability - marketProb) : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!expiresAt) {
      setError(t("noExpiresError"))
      return
    }
    setLoading(true)
    setError("")

    const body: Record<string, any> = {
      title,
      description: description || undefined,
      probability,
      category,
      expiresAt: new Date(expiresAt).toISOString(),
      evidence: evidence || undefined,
      tags: tags ? tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
      isPublic,
    }

    // If created from a market, embed Polymarket data at creation time
    if (market) {
      body.polymarketSlug = market.slug
      body.polymarketQuestion = market.question
      body.polymarketProbability = market.probability
      body.polymarketUrl = market.url
    }

    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? t("createError"))
      setLoading(false)
      return
    }

    const prediction = await res.json()
    toast(t("created"), "success")
    onCreated(prediction)
  }

  function getDivergenceLabel(): string {
    if (divergence === null) return ""
    if (divergence < 10) return t("agreesWithMarket")
    if (divergence < 25) return t("moderateDivergence", { diff: divergence })
    if (divergence < 40) return t("boldBet", { diff: divergence })
    return t("againstMarket", { diff: divergence })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg bg-[var(--bg-card)] rounded-t-2xl sm:rounded-xl border border-[var(--border)] shadow-2xl animate-fade-in max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-display text-lg font-semibold">{t("title")}</h2>
            {isMarketLinked && (
              <p className="text-xs text-[var(--accent)] mt-0.5">
                {t("linkedToPolymarket")}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">

          {/* Market chip — shown when linked */}
          {market && (
            <div
              className="rounded-lg p-3 border"
              style={{ background: "var(--bg)", borderColor: "var(--accent-dim)" }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-[var(--accent)]">
                  Polymarket · {CATEGORIES[market.suggestedCategory].emoji} {tCat(market.suggestedCategory as any)}
                </span>
                <a
                  href={market.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-snug mb-1.5">
                {market.question}
              </p>
              <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
                <span className="text-[var(--text-muted)]">{t("marketLabel")}</span>
                <span style={{ color: "var(--accent)" }}>{market.probability}%</span>
                <span className="text-[var(--text-muted)]">·</span>
                <span className="text-[var(--text-muted)]">{t("youLabel")}</span>
                <span style={{ color: probColor }}>{probability}%</span>
                {divergence !== null && (
                  <span style={{ color: divergence >= 40 ? "var(--red)" : divergence >= 25 ? "var(--orange)" : divergence >= 10 ? "var(--yellow)" : "var(--text-muted)" }}>
                    {getDivergenceLabel()}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Title — locked if market-linked */}
          <div>
            <label className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-1">
              {t("predictionLabel")} <span className="text-[var(--red)]">*</span>
              {isMarketLinked && <Lock size={10} className="text-[var(--text-muted)]" />}
            </label>
            {isMarketLinked ? (
              <div className="input-base text-sm text-[var(--text-secondary)] cursor-not-allowed opacity-70 leading-snug">
                {title}
              </div>
            ) : (
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-base resize-none h-20"
                placeholder={t("predictionPlaceholder")}
                required
              />
            )}
          </div>

          {/* Probability */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[var(--text-muted)]">{t("yourProbability")}</label>
              <span className="font-mono text-lg font-bold" style={{ color: probColor }}>
                {probability}%
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={99}
              value={probability}
              onChange={(e) => setProbability(Number(e.target.value))}
              className="w-full accent-[var(--accent)] cursor-pointer h-8 touch-manipulation"
              style={{ WebkitTapHighlightColor: "transparent" }}
            />
            <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
              <span>{t("veryUnlikely")}</span>
              <span>{t("veryLikely")}</span>
            </div>
          </div>

          {/* Category + ExpiresAt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-1">
                {t("categoryLabel")} <span className="text-[var(--red)]">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="input-base"
              >
                {Object.entries(CATEGORIES).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.emoji} {tCat(key as any)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-1">
                {t("expiresLabel")} <span className="text-[var(--red)]">*</span>
                {isMarketLinked && market?.endDate && <Lock size={10} className="text-[var(--text-muted)]" />}
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="input-base"
                min={new Date().toISOString().split("T")[0]}
                readOnly={isMarketLinked && !!market?.endDate}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              {t("argumentLabel")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-base resize-none h-20"
              placeholder={isMarketLinked ? t("argumentPlaceholderMarket") : t("argumentPlaceholder")}
            />
          </div>

          {/* Evidence */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              {t("evidenceLabel")}
            </label>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              className="input-base resize-none h-16"
              placeholder={t("evidencePlaceholder")}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              {t("tagsLabel")} <span className="text-[var(--text-muted)]">{t("tagsHint")}</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input-base"
              placeholder={t("tagsPlaceholder")}
            />
          </div>

          {/* Public toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`w-9 h-5 rounded-full transition-colors relative ${
                isPublic ? "bg-[var(--accent)]" : "bg-[var(--border-bright)]"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  isPublic ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-sm text-[var(--text-secondary)]">{t("makePublic")}</span>
          </div>

          {error && (
            <p className="text-xs text-[var(--red)] bg-[rgba(248,113,113,0.1)] px-3 py-2 rounded-md">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              {t("cancel")}
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? t("creating") : t("create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
