"use client"

import { useState } from "react"
import { X, Copy, Check, ExternalLink } from "lucide-react"
import { Prediction } from "@/types"
import { CATEGORIES } from "@/lib/utils"
import { useToast } from "@/components/ui/Toast"
import { useTranslations } from "next-intl"

interface Props {
  prediction: Prediction
  username?: string | null
  onClose: () => void
}

const BASE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000"

export function ShareModal({ prediction, username, onClose }: Props) {
  const { toast } = useToast()
  const t = useTranslations("ShareModal")
  const [copied, setCopied] = useState(false)

  const shareUrl = `${BASE_URL}/share/${prediction.shareToken}`
  const ogImageUrl = `${BASE_URL}/api/og/prediction/${prediction.shareToken}`

  const tRes = useTranslations("Resolution")
  const cat = CATEGORIES[prediction.category]

  const resolutionLine = prediction.resolution
    ? t("resolutionLine", { resolution: tRes(prediction.resolution as any).toUpperCase() })
    : ""

  const marketLine =
    prediction.polymarketProbability !== null &&
    prediction.polymarketProbability !== undefined
      ? t("polymarketLine", {
          polyProb: prediction.polymarketProbability,
          diff: Math.abs(prediction.probability - prediction.polymarketProbability),
        })
      : ""

  const textForX = t("shareTextX", {
    title: prediction.title,
    prob: prediction.probability,
    market: marketLine,
    resolution: resolutionLine,
  })

  const textForWhatsApp = t("shareTextWhatsApp", {
    title: prediction.title,
    prob: prediction.probability,
    resolution: resolutionLine,
    url: shareUrl,
  })

  function openX() {
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(textForX)}&url=${encodeURIComponent(shareUrl)}`
    window.open(url, "_blank")
  }

  function openLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    window.open(url, "_blank")
  }

  function openWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(textForWhatsApp)}`
    window.open(url, "_blank")
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast(t("linkCopied"), "success")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[var(--bg-card)] rounded-xl border border-[var(--border)] shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="font-display text-lg font-semibold">{t("title")}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* OG card preview */}
          <div className="rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ogImageUrl}
              alt={t("shareCardAlt")}
              className="w-full"
              style={{ aspectRatio: "1200/630" }}
            />
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={openX}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-bright)] transition-colors"
            >
              <span className="text-lg">𝕏</span>
              <span className="text-xs text-[var(--text-muted)]">{t("xTwitter")}</span>
            </button>
            <button
              onClick={openLinkedIn}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-bright)] transition-colors"
            >
              <span className="text-lg">🔗</span>
              <span className="text-xs text-[var(--text-muted)]">LinkedIn</span>
            </button>
            <button
              onClick={openWhatsApp}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-bright)] transition-colors"
            >
              <span className="text-lg">💬</span>
              <span className="text-xs text-[var(--text-muted)]">{t("whatsapp")}</span>
            </button>
          </div>

          {/* Copy link */}
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={shareUrl}
              className="input-base flex-1 text-xs text-[var(--text-muted)]"
            />
            <button
              onClick={copyLink}
              className="btn-ghost flex items-center gap-1.5 shrink-0"
            >
              {copied ? <Check size={14} className="text-[var(--green)]" /> : <Copy size={14} />}
              {copied ? t("copied") : t("copy")}
            </button>
          </div>

          {/* Text preview */}
          <details className="group">
            <summary className="text-xs text-[var(--text-muted)] cursor-pointer select-none hover:text-[var(--text-secondary)] transition-colors">
              {t("showTextForX")}
            </summary>
            <textarea
              readOnly
              value={textForX}
              rows={6}
              className="input-base mt-2 text-xs resize-none font-mono"
            />
          </details>
        </div>
      </div>
    </div>
  )
}
