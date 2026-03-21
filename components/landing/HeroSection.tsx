"use client"

import { useEffect, useState } from "react"
import { Link } from "@/navigation"
import { useTranslations } from "next-intl"

interface PublicStats {
  totalPredictions: number
  totalUsers: number
  predictionsToday: number
  avgAccuracy: number
}

export function HeroSection() {
  const [stats, setStats] = useState<PublicStats | null>(null)
  const t = useTranslations("Landing")

  useEffect(() => {
    fetch("/api/stats/public")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-12 sm:pb-16 text-center">
      {/* Animated badge */}
      <div className="flex justify-center mb-8">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-mono animate-fade-in"
          style={{
            borderColor: "var(--accent)",
            background: "var(--accent-glow)",
            color: "var(--accent)",
          }}
        >
          <span className="relative flex h-2 w-2">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: "var(--accent)" }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ background: "var(--accent)" }}
            />
          </span>
          {stats
            ? t("heroBadge", { count: stats.predictionsToday })
            : t("heroBadgeLoading")}
        </div>
      </div>

      {/* Headline */}
      <h1
        className="font-display font-bold leading-tight mb-5 animate-fade-in"
        style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
      >
        {t("heroHeadline1")}
        <br />
        <span className="gradient-text">{t("heroHeadline2")}</span>
      </h1>

      {/* Subheadline */}
      <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in">
        {t("heroSubheadline").split("\n").map((line, i) => (
          <span key={i}>{line}{i === 0 && <br />}</span>
        ))}
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
        <a
          href="#mercados"
          className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2"
        >
          {t("heroCta")}
        </a>
      </div>

      <p className="mt-4 text-xs text-[var(--text-muted)] animate-fade-in">
        {t("heroSignInPrompt")}{" "}
        <Link href="/auth/signin" className="text-[var(--accent)] hover:underline">
          {t("heroSignIn")}
        </Link>
      </p>

      {/* Stats strip — temporariamente ocultado até ter volume de utilizadores
      {stats && (
        <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mt-8 sm:mt-12 animate-fade-in">
          {[
            { label: t("statsPredictions"), value: stats.totalPredictions.toLocaleString() },
            { label: t("statsUsers"), value: stats.totalUsers.toLocaleString() },
            { label: t("statsAccuracy"), value: `${stats.avgAccuracy}%` },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="font-mono text-2xl font-bold text-[var(--text-primary)]">{value}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}
      */}
    </section>
  )
}
