"use client"

import { Prediction } from "@/types"
import {
  CATEGORIES,
  RESOLUTION_CONFIG,
  formatDate,
  getProbabilityColor,
  isExpired,
} from "@/lib/utils"
import { Calendar, Trash2, RefreshCw, Share2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/Toast"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { ShareModal } from "@/components/predictions/ShareModal"
import { Link } from "@/navigation"
import { useTranslations, useLocale } from "next-intl"

const DELETE_WINDOW_MS = 10 * 60 * 1000

function useDeleteCountdown(createdAt: Date | string) {
  const created = new Date(createdAt).getTime()
  const expiresAt = created + DELETE_WINDOW_MS

  const [remaining, setRemaining] = useState(() => Math.max(0, expiresAt - Date.now()))

  useEffect(() => {
    if (remaining === 0) return
    const id = setInterval(() => {
      const r = Math.max(0, expiresAt - Date.now())
      setRemaining(r)
      if (r === 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [expiresAt, remaining])

  const canDelete = remaining > 0
  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  const label = canDelete ? `${minutes}:${String(seconds).padStart(2, "0")}` : null

  return { canDelete, label }
}

interface Props {
  prediction: Prediction
  onDelete: (id: string) => void
  onMarketUpdate?: (id: string, data: Partial<Prediction>) => void
}

interface MarketData {
  question: string
  probability: number | null
  url: string
}

export function PredictionCard({ prediction, onDelete, onMarketUpdate }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [matchLoading, setMatchLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const { data: session } = useSession()
  const { toast } = useToast()
  const t = useTranslations("PredictionCard")
  const tCat = useTranslations("Categories")
  const tRes = useTranslations("Resolution")
  const locale = useLocale()
  const { canDelete, label: countdownLabel } = useDeleteCountdown(prediction.createdAt)

  const cat = CATEGORIES[prediction.category]
  const probColor = getProbabilityColor(prediction.probability)
  const expired = isExpired(prediction.expiresAt) && !prediction.resolution
  const daysLeft = (!prediction.resolution && !expired)
    ? Math.ceil((new Date(prediction.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  const expiringSoon = daysLeft !== null && daysLeft >= 1 && daysLeft <= 7

  const [marketData, setMarketData] = useState<MarketData | null>(
    prediction.polymarketSlug
      ? {
          question: prediction.polymarketQuestion ?? "",
          probability: prediction.polymarketProbability ?? null,
          url: prediction.polymarketUrl ?? "",
        }
      : null
  )

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/predictions/${prediction.id}`, {
      method: "DELETE",
    })
    if (res.ok) {
      onDelete(prediction.id)
      toast(t("deleted"), "success")
    } else {
      toast(t("deleteError"), "error")
      setDeleting(false)
    }
  }

  async function handleMatchMarket(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setMatchLoading(true)
    const res = await fetch(`/api/predictions/${prediction.id}/market-match`, {
      method: "POST",
    })
    const data = await res.json()
    if (data.matched) {
      setMarketData(data.market)
      onMarketUpdate?.(prediction.id, {
        polymarketQuestion: data.market.question,
        polymarketProbability: data.market.probability,
        polymarketUrl: data.market.url,
      })
      toast(t("marketFound"), "success")
    } else {
      toast(t("noMarketFound"), "info")
    }
    setMatchLoading(false)
  }

  async function handleRefreshMarket(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setRefreshing(true)
    const res = await fetch(
      `/api/predictions/${prediction.id}/refresh-market`,
      { method: "POST" }
    )
    const data = await res.json()
    if (data.probability !== undefined) {
      setMarketData((prev) =>
        prev ? { ...prev, probability: data.probability } : prev
      )
      onMarketUpdate?.(prediction.id, { polymarketProbability: data.probability })
      toast(t("probabilityUpdated"), "success")
    } else {
      toast(t("updateError"), "error")
    }
    setRefreshing(false)
  }

  return (
    <>
      <Link href={`/dashboard/${prediction.id}`}>
        <div className="card cursor-pointer group relative animate-fade-in flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-secondary)]">
                {cat.emoji} {tCat(prediction.category as any)}
              </span>
              {prediction.resolution ? (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-mono"
                  style={{
                    color: RESOLUTION_CONFIG[prediction.resolution].color,
                    background: RESOLUTION_CONFIG[prediction.resolution].bg,
                  }}
                >
                  {tRes(prediction.resolution as any)}
                </span>
              ) : expired ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(251,191,36,0.1)] text-[var(--yellow)]">
                  {t("expired")}
                </span>
              ) : expiringSoon ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(251,191,36,0.08)] text-[var(--yellow)] border border-[rgba(251,191,36,0.2)]">
                  ⚠️ {daysLeft === 1 ? t("expiresTomorrow") : t("expiresInDays", { days: daysLeft })}
                </span>
              ) : null}
            </div>

            {canDelete && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setConfirmOpen(true)
                }}
                disabled={deleting}
                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--red)] hover:bg-[rgba(248,113,113,0.1)] transition-all shrink-0"
                title={t("deleteTitle", { time: countdownLabel ?? "" })}
              >
                <Trash2 size={14} />
                <span className="text-xs font-mono">{countdownLabel}</span>
              </button>
            )}
          </div>

          {/* Title */}
          <p className="text-sm text-[var(--text-primary)] leading-snug line-clamp-2">
            {prediction.title}
          </p>

          {/* Market comparison widget */}
          {marketData?.probability !== null && marketData?.probability !== undefined ? (
            <div
              className="rounded-lg p-3"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
              onClick={(e) => e.preventDefault()}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  {t("vsPolymarket")}
                </span>
                <a
                  href={marketData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs underline"
                  style={{ color: "var(--accent)" }}
                >
                  {t("view")}
                </a>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs w-12 text-right font-mono" style={{ color: "var(--text-muted)" }}>
                    {t("you")}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${prediction.probability}%`,
                        background: getProbabilityColor(prediction.probability),
                      }}
                    />
                  </div>
                  <span className="text-xs w-8 font-bold font-mono" style={{ color: getProbabilityColor(prediction.probability) }}>
                    {prediction.probability}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs w-12 text-right font-mono" style={{ color: "var(--text-muted)" }}>
                    {t("market")}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${marketData.probability}%`, background: "var(--accent)" }}
                    />
                  </div>
                  <span className="text-xs w-8 font-bold font-mono" style={{ color: "var(--accent)" }}>
                    {marketData.probability}%
                  </span>
                </div>
              </div>

              {Math.abs(prediction.probability - (marketData.probability ?? 0)) >= 15 && (
                <div
                  className="mt-2 text-xs font-mono px-2 py-1 rounded"
                  style={{ background: "rgba(124,106,247,0.1)", color: "var(--accent)" }}
                >
                  {t("divergence", { diff: Math.abs(prediction.probability - (marketData.probability ?? 0)) })}
                </div>
              )}

              <button
                onClick={handleRefreshMarket}
                disabled={refreshing}
                className="mt-2 flex items-center gap-1 text-xs transition-colors disabled:opacity-50"
                style={{ color: "var(--text-muted)" }}
              >
                <RefreshCw size={10} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? t("updating") : t("update")}
              </button>
            </div>
          ) : !prediction.resolution ? (
            <button
              onClick={handleMatchMarket}
              disabled={matchLoading}
              className="text-xs px-3 py-1.5 rounded-lg w-full transition-all text-left disabled:opacity-60"
              style={{
                background: "var(--bg)",
                border: "1px dashed var(--border)",
                color: "var(--text-muted)",
              }}
            >
              {matchLoading ? t("searchingPolymarket") : t("comparePolymarket")}
            </button>
          ) : null}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Calendar size={12} />
                <span>{formatDate(prediction.expiresAt, locale)}</span>
              </div>
              {prediction.shareToken && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShareOpen(true)
                  }}
                  className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                  title="Partilhar"
                >
                  <Share2 size={12} />
                </button>
              )}
            </div>
            <div className="font-mono text-lg font-bold" style={{ color: probColor }}>
              {prediction.probability}%
            </div>
          </div>
        </div>
      </Link>

      {shareOpen && (
        <ShareModal
          prediction={prediction}
          username={session?.user?.username ?? null}
          onClose={() => setShareOpen(false)}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={t("confirmDeleteTitle")}
        description={t("confirmDeleteDescription")}
        confirmLabel={t("deleteLabel")}
        danger
        onConfirm={() => {
          setConfirmOpen(false)
          handleDelete()
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
