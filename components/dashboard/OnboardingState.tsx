"use client"

import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"

interface Props {
  onFreeForm: () => void
}

export function OnboardingState({ onFreeForm }: Props) {
  const t = useTranslations("OnboardingState")

  return (
    <div className="text-center py-12 animate-fade-in">
      <p className="text-3xl mb-3">☝️</p>
      <h3 className="font-display text-lg font-semibold mb-2">
        {t("title")}
      </h3>
      <p className="text-sm text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
        {t("description")}
      </p>
      <button
        onClick={onFreeForm}
        className="btn-ghost inline-flex items-center gap-2"
      >
        <Plus size={15} />
        {t("freePrediction")}
      </button>
    </div>
  )
}
