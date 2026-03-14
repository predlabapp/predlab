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
        className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-[var(--bg-card)] border border-[var(--border)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        title={t("buttonTitle")}
      >
        <Info size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="relative w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl animate-fade-in">
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

            {/* Cards */}
            <div className="grid grid-cols-2 gap-3 p-6">
              {steps.map((s) => (
                <div
                  key={s.number}
                  className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--border-bright)] transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{s.emoji}</span>
                    <span className="font-mono text-xs text-[var(--accent)]">{s.number}</span>
                  </div>
                  <p className="font-display text-sm font-bold text-[var(--text-primary)] mb-1">
                    {s.title}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mb-2">{s.desc}</p>
                  <p className="text-xs text-[var(--text-muted)] italic">{s.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
