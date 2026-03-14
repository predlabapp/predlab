"use client"

import { useTranslations } from "next-intl"

export function HowItWorks() {
  const t = useTranslations("Landing")

  const steps = [
    {
      number: "①",
      emoji: "🌍",
      title: t("step1Title"),
      desc: t("step1Desc"),
      detail: t("step1Detail"),
    },
    {
      number: "②",
      emoji: "📊",
      title: t("step2Title"),
      desc: t("step2Desc"),
      detail: t("step2Detail"),
    },
    {
      number: "③",
      emoji: "🔥",
      title: t("step3Title"),
      desc: t("step3Desc"),
      detail: t("step3Detail"),
    },
  ]

  return (
    <section className="border-t border-[var(--border)] py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-xs text-[var(--text-muted)] uppercase tracking-widest font-mono mb-3">
          {t("howItWorksLabel")}
        </p>
        <h2 className="font-display text-2xl font-bold text-center text-[var(--text-primary)] mb-12">
          {t("howItWorksTitle")}
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.number} className="text-center">
              <div className="text-4xl mb-3">{s.emoji}</div>
              <p className="font-mono text-xs text-[var(--accent)] mb-2">{s.number}</p>
              <p className="font-display text-base font-bold text-[var(--text-primary)] mb-1">
                {s.title}
              </p>
              <p className="text-sm text-[var(--text-secondary)] mb-3">{s.desc}</p>
              <p className="text-xs text-[var(--text-muted)] italic">{s.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
