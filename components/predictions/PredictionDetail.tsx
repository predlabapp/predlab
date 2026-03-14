"use client"

import { useState, useEffect } from "react"
import { Prediction, Resolution } from "@/types"
import {
  CATEGORIES,
  RESOLUTION_CONFIG,
  formatDate,
  formatRelative,
  getProbabilityColor,
  isExpired,
} from "@/lib/utils"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Tag,
  Trash2,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Ban,
  BookOpen,
  Link2,
  Pencil,
  Share2,
} from "lucide-react"
import { Link } from "@/navigation"
import { useRouter } from "@/navigation"
import { useToast } from "@/components/ui/Toast"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { EditPredictionModal } from "@/components/predictions/EditPredictionModal"
import { ShareModal } from "@/components/predictions/ShareModal"
import { useTranslations, useLocale } from "next-intl"

interface Props {
  prediction: Prediction
}

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

export function PredictionDetail({ prediction: initial }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations("PredictionDetail")
  const tCat = useTranslations("Categories")
  const tRes = useTranslations("Resolution")
  const tProb = useTranslations("ProbabilityLabel")
  const locale = useLocale()
  const [prediction, setPrediction] = useState<Prediction>(initial)
  const [resolving, setResolving] = useState(false)
  const [showResolvePanel, setShowResolvePanel] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const { canDelete, label: countdownLabel } = useDeleteCountdown(prediction.createdAt)

  const cat = CATEGORIES[prediction.category]
  const probColor = getProbabilityColor(prediction.probability)
  const expired = isExpired(prediction.expiresAt) && !prediction.resolution

  const RESOLUTION_OPTIONS: {
    value: Resolution
    label: string
    icon: React.ElementType
    color: string
    bg: string
  }[] = [
    {
      value: "CORRECT",
      label: t("resolutionCorrect"),
      icon: CheckCircle2,
      color: "var(--green)",
      bg: "rgba(52,211,153,0.1)",
    },
    {
      value: "INCORRECT",
      label: t("resolutionIncorrect"),
      icon: XCircle,
      color: "var(--red)",
      bg: "rgba(248,113,113,0.1)",
    },
    {
      value: "PARTIAL",
      label: t("resolutionPartial"),
      icon: MinusCircle,
      color: "var(--yellow)",
      bg: "rgba(251,191,36,0.1)",
    },
    {
      value: "CANCELLED",
      label: t("resolutionCancelled"),
      icon: Ban,
      color: "var(--text-muted)",
      bg: "rgba(85,85,112,0.15)",
    },
  ]

  async function handleResolve(resolution: Resolution) {
    setResolving(true)
    const res = await fetch(`/api/predictions/${prediction.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolution }),
    })
    if (res.ok) {
      const updated = await res.json()
      setPrediction(updated)
      setShowResolvePanel(false)
      const resLabel = RESOLUTION_OPTIONS.find((o) => o.value === resolution)?.label ?? resolution
      toast(t("resolutionSuccess", { label: resLabel.toLowerCase() }), "success")
    } else {
      toast(t("resolutionError"), "error")
    }
    setResolving(false)
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/predictions/${prediction.id}`, {
      method: "DELETE",
    })
    if (res.ok) {
      toast(t("deleted"), "success")
      router.push("/dashboard")
    } else {
      toast(t("deleteError"), "error")
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          {t("backToDashboard")}
        </Link>

        {/* Main card */}
        <div className="card mb-4">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-secondary)]">
              {cat.emoji} {tCat(prediction.category as any)}
            </span>
            {prediction.resolution ? (
              <span
                className="text-xs px-2 py-1 rounded-full font-mono font-medium"
                style={{
                  color: RESOLUTION_CONFIG[prediction.resolution].color,
                  background: RESOLUTION_CONFIG[prediction.resolution].bg,
                }}
              >
                {tRes(prediction.resolution as any)}
                {prediction.resolutionType === "AUTOMATIC" ? t("autoVerified") : t("manualResolved")}
              </span>
            ) : expired ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(251,191,36,0.1)] text-[var(--yellow)]">
                {t("expired")}
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(124,106,247,0.1)] text-[var(--accent)]">
                {t("pending")}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="font-display text-xl font-bold text-[var(--text-primary)] leading-snug mb-5">
            {prediction.title}
          </h1>

          {/* Probability */}
          <div className="flex items-center gap-4 mb-5 p-4 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
            <div>
              <p
                className="font-mono text-4xl font-bold leading-none"
                style={{ color: probColor }}
              >
                {prediction.probability}%
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{t("probability")}</p>
            </div>
            <div className="flex-1">
              <div className="h-2 rounded-full bg-[var(--border-bright)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${prediction.probability}%`,
                    backgroundColor: probColor,
                  }}
                />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                {prediction.probability >= 80 ? tProb("veryLikely")
                : prediction.probability >= 60 ? tProb("likely")
                : prediction.probability >= 40 ? tProb("uncertain")
                : prediction.probability >= 20 ? tProb("unlikely")
                : tProb("veryUnlikely")}
              </p>
            </div>
          </div>

          {/* Description */}
          {prediction.description && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={13} className="text-[var(--text-muted)]" />
                <h3 className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                  {t("argumentTitle")}
                </h3>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                {prediction.description}
              </p>
            </div>
          )}

          {/* Evidence */}
          {prediction.evidence && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Link2 size={13} className="text-[var(--text-muted)]" />
                <h3 className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                  {t("evidenceTitle")}
                </h3>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                {prediction.evidence}
              </p>
            </div>
          )}

          {/* Tags */}
          {prediction.tags.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Tag size={13} className="text-[var(--text-muted)]" />
                <h3 className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                  {t("tagsTitle")}
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {prediction.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--text-secondary)]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Clock size={12} />
              <span>{t("created", { relative: formatRelative(prediction.createdAt, locale) })}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Calendar size={12} />
              <span>{t("expires", { date: formatDate(prediction.expiresAt, locale) })}</span>
            </div>
            {prediction.resolvedAt && (
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <CheckCircle2 size={12} />
                <span>{t("resolvedOn", { date: formatDate(prediction.resolvedAt, locale) })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {!prediction.resolution && (
            <button
              onClick={() => setShowResolvePanel(!showResolvePanel)}
              className="btn-primary flex items-center gap-2"
            >
              <CheckCircle2 size={15} />
              {t("resolve")}
            </button>
          )}

          <button
            onClick={() => setShowEditModal(true)}
            className="btn-ghost flex items-center gap-2"
          >
            <Pencil size={15} />
            {t("edit")}
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="btn-ghost flex items-center gap-2"
          >
            <Share2 size={15} />
            {t("share")}
          </button>

          {canDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="btn-danger flex items-center gap-2 ml-auto"
              title={`${t("deleteWithTime", { time: countdownLabel ?? "" })}`}
            >
              <Trash2 size={15} />
              {deleting ? t("deleting") : t("deleteWithTime", { time: countdownLabel ?? "" })}
            </button>
          )}
        </div>

        {/* Resolve panel */}
        {showResolvePanel && (
          <div className="mt-4 card animate-fade-in">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">
              {t("resolveTitle")}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {RESOLUTION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleResolve(opt.value)}
                  disabled={resolving}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] transition-all hover:border-[var(--border-bright)] disabled:opacity-50"
                  onMouseEnter={(e) => {
                    const el = e.currentTarget
                    el.style.background = opt.bg
                    el.style.borderColor = opt.color
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget
                    el.style.background = "var(--bg)"
                    el.style.borderColor = "var(--border)"
                  }}
                >
                  <opt.icon size={18} style={{ color: opt.color }} />
                  <span className="text-sm text-[var(--text-secondary)]">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={t("confirmDeleteTitle")}
        description={t("confirmDeleteDescription")}
        confirmLabel={t("deleteLabel")}
        danger
        onConfirm={() => {
          setShowDeleteConfirm(false)
          handleDelete()
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {showEditModal && (
        <EditPredictionModal
          prediction={prediction}
          onClose={() => setShowEditModal(false)}
          onSaved={(updated) => {
            setPrediction(updated)
            setShowEditModal(false)
          }}
        />
      )}

      {showShareModal && (
        <ShareModal
          prediction={prediction}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  )
}
