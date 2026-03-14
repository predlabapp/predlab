"use client"

import { useTranslations } from "next-intl"

export function Differentials() {
  const t = useTranslations("Landing")

  const items = [
    {
      icon: "🔒",
      title: t("diff1Title"),
      desc: t("diff1Desc"),
    },
    {
      icon: "⚡",
      title: t("diff2Title"),
      desc: t("diff2Desc"),
    },
    {
      icon: "🏆",
      title: t("diff3Title"),
      desc: t("diff3Desc"),
    },
  ]

  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-5">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-display text-lg font-bold text-[var(--text-primary)] mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
