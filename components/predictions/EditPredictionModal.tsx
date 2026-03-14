"use client"

import { useState } from "react"
import { X, Lock } from "lucide-react"
import { CATEGORIES, getProbabilityColor } from "@/lib/utils"
import { Prediction } from "@/types"
import { useToast } from "@/components/ui/Toast"
import { useTranslations } from "next-intl"

interface Props {
  prediction: Prediction
  onClose: () => void
  onSaved: (p: Prediction) => void
}

export function EditPredictionModal({ prediction, onClose, onSaved }: Props) {
  const { toast } = useToast()
  const t = useTranslations("EditPredictionModal")
  const tCat = useTranslations("Categories")
  const [description, setDescription] = useState(prediction.description ?? "")
  const [evidence, setEvidence] = useState(prediction.evidence ?? "")
  const [tags, setTags] = useState(prediction.tags.join(", "))
  const [isPublic, setIsPublic] = useState(prediction.isPublic)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch(`/api/predictions/${prediction.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: description || undefined,
        evidence: evidence || undefined,
        tags: tags ? tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
        isPublic,
      }),
    })

    if (res.ok) {
      const updated = await res.json()
      onSaved(updated)
      toast(t("updated"), "success")
    } else {
      toast(t("updateError"), "error")
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[var(--bg-card)] rounded-xl border border-[var(--border)] shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="font-display text-lg font-semibold">{t("title")}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Locked fields info */}
          <div className="rounded-lg bg-[var(--bg)] border border-[var(--border)] overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)]">
              <Lock size={12} className="text-[var(--text-muted)]" />
              <span className="text-xs text-[var(--text-muted)]">{t("immutableFields")}</span>
            </div>
            <div className="p-3 space-y-2">
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">{t("predictionLabel")}</p>
                <p className="text-sm text-[var(--text-secondary)] leading-snug">{prediction.title}</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">{t("probabilityLabel")}</p>
                  <span className="font-mono text-lg font-bold" style={{ color: getProbabilityColor(prediction.probability) }}>
                    {prediction.probability}%
                  </span>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">{t("categoryLabel")}</p>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {CATEGORIES[prediction.category].emoji} {tCat(prediction.category as any)}
                  </span>
                </div>
              </div>
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
              placeholder={t("argumentPlaceholder")}
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
              {t("tagsLabel")}{" "}
              <span className="text-[var(--text-muted)]">{t("tagsHint")}</span>
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
            <span className="text-sm text-[var(--text-secondary)]">{t("publicLabel")}</span>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              {t("cancel")}
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? t("saving") : t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
