"use client"

import { AlertTriangle } from "lucide-react"
import { useTranslations } from "next-intl"

interface Props {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  const t = useTranslations("Common")
  const resolvedConfirmLabel = confirmLabel ?? t("confirm")

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[var(--bg-card)] rounded-xl border border-[var(--border)] shadow-2xl animate-fade-in p-5">
        <div className="flex items-start gap-3 mb-4">
          {danger && (
            <div className="p-2 rounded-lg bg-[rgba(248,113,113,0.1)] shrink-0">
              <AlertTriangle size={16} style={{ color: "var(--red)" }} />
            </div>
          )}
          <div>
            <h3 className="font-medium text-[var(--text-primary)] mb-1">{title}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{description}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1">
            {t("cancel")}
          </button>
          <button
            onClick={onConfirm}
            className={danger ? "btn-danger flex-1" : "btn-primary flex-1"}
          >
            {resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
