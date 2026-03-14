"use client"

import { useState } from "react"
import { X, Info } from "lucide-react"
import { useTranslations } from "next-intl"

export function HowItWorksModal() {
  const [open, setOpen] = useState(false)
  const t = useTranslations("HowItWorks")

  const steps = [
    { emoji: "🌍", number: "①", title: t("step1Title"), desc: t("step1Desc"), detail: t("step1Detail") },
    { emoji: "📊", number: "②", title: t("step2Title"), desc: t("step2Desc"), detail: t("step2Detail") },
    { emoji: "🔥", number: "③", title: t("step3Title"), desc: t("step3Desc"), detail: t("step3Detail") },
    { emoji: "🏆", number: "④", title: t("step4Title"), desc: t("step4Desc"), detail: t("step4Detail") },
  ]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-md hover:bg-[var(--bg-card)] border border-[var(--border)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
      >
        <Info size={13} />
        <span className="text-xs font-mono">{t("buttonTitle")}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="relative w-full sm:max-w-2xl bg-[var(--bg-card)] border border-[var(--border)] rounded-t-2xl sm:rounded-2xl shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <div>
                <p className="font-mono text-xs text-[var(--accent)] uppercase tracking-widest mb-0.5">
                  {t("label")}
                </p>
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                  {t("title")}
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-md hover:bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Carousel */}
            <div className="flex gap-3 overflow-x-auto px-6 py-6 snap-x snap-mandatory scrollbar-hide">
              {steps.map((s) => (
                <div
                  key={s.number}
                  className="flex-none w-52 snap-start bg-[var(--bg)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--border-bright)] transition-colors"
                >
                  <div className="text-3xl mb-3">{s.emoji}</div>
                  <p className="font-mono text-xs text-[var(--accent)] mb-2">{s.number}</p>
                  <p className="font-display text-sm font-bold text-[var(--text-primary)] mb-2 leading-snug">
                    {s.title}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">{s.desc}</p>
                  <p className="text-xs text-[var(--text-muted)] italic leading-relaxed">{s.detail}</p>
                </div>
              ))}
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center gap-1.5 pb-5">
              {steps.map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--border-bright)]" />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
