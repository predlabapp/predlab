"use client"

import { Prediction } from "@/types"
import {
  CATEGORIES,
  RESOLUTION_CONFIG,
  calculateAccuracyScore,
  formatDate,
  getProbabilityColor,
} from "@/lib/utils"
import { LEVELS, BADGES } from "@/lib/gamification"
import { Calendar, Flame, Trophy } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"

interface Badge {
  badgeKey: string
  earnedAt: Date
}

interface User {
  id: string
  name: string | null
  username: string | null
  bio: string | null
  level: number
  currentStreak: number
  longestStreak: number
  predictionCoins: number
  predictions: Prediction[]
  badges: Badge[]
}

interface Props {
  user: User
}

function getLevelInfo(level: number) {
  return LEVELS.find((l) => l.level === level) ?? LEVELS[0]
}

export function PublicProfile({ user }: Props) {
  const t = useTranslations("PublicProfile")
  const tCat = useTranslations("Categories")
  const tRes = useTranslations("Resolution")
  const locale = useLocale()
  const levelInfo = getLevelInfo(user.level)
  const publicPredictions = user.predictions.filter((p) => p.isPublic)
  const scoreGeneral = calculateAccuracyScore(user.predictions)
  const verifiedPredictions = user.predictions.filter(
    (p) => (p as any).resolutionType === "AUTOMATIC"
  )
  const scoreVerified = calculateAccuracyScore(verifiedPredictions)
  const verifiedCount = verifiedPredictions.filter((p) => p.resolution).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      {/* Profile header */}
      <div className="card mb-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--accent-dim)] flex items-center justify-center text-2xl shrink-0">
            {levelInfo.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl font-bold text-[var(--text-primary)]">
              {user.name ?? user.username ?? "Forecaster"}
            </h1>
            {user.username && (
              <p className="text-sm text-[var(--text-muted)] font-mono">
                @{user.username}
              </p>
            )}
            <p className="text-xs text-[var(--accent)] mt-1">
              {levelInfo.emoji} {levelInfo.label} · {t("level", { level: user.level })}
            </p>
            {user.bio && (
              <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
                {user.bio}
              </p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[var(--border)]">
          {/* Verified Score */}
          <div className="text-center">
            {verifiedCount >= 10 ? (
              <p className="font-mono text-lg font-bold" style={{ color: "var(--accent)" }}>
                {scoreVerified}%
              </p>
            ) : (
              <p className="text-xs font-mono font-bold text-[var(--yellow)]">{t("qualifying")}</p>
            )}
            <p className="text-xs text-[var(--text-muted)]">{t("verifiedScore")}</p>
          </div>
          {/* General Score */}
          <div className="text-center">
            <p className="font-mono text-lg font-bold text-[var(--text-secondary)]">
              {scoreGeneral > 0 ? `${scoreGeneral}%` : "—"}
            </p>
            <p className="text-xs text-[var(--text-muted)]">{t("generalScore")}</p>
          </div>
          {/* Streak */}
          <div className="text-center">
            <p className="font-mono text-lg font-bold text-[var(--yellow)] flex items-center justify-center gap-1">
              <Flame size={16} />
              {user.currentStreak}
            </p>
            <p className="text-xs text-[var(--text-muted)]">{t("streak")}</p>
          </div>
          {/* Coins */}
          <div className="text-center">
            <p className="font-mono text-lg font-bold text-[var(--text-primary)]">
              {user.predictionCoins.toLocaleString()}
            </p>
            <p className="text-xs text-[var(--text-muted)]">{t("coins")}</p>
          </div>
        </div>
      </div>

      {/* Badges */}
      {user.badges.length > 0 && (
        <div className="card mb-5">
          <h2 className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Trophy size={13} />
            {t("achievementsTitle", { count: user.badges.length })}
          </h2>
          <div className="flex flex-wrap gap-2">
            {user.badges.map((b) => {
              const def = BADGES[b.badgeKey]
              if (!def) return null
              return (
                <div
                  key={b.badgeKey}
                  title={def.description}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] cursor-default"
                >
                  <span className="text-sm">{def.emoji}</span>
                  <span className="text-xs text-[var(--text-secondary)]">{def.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Public predictions */}
      <div>
        <h2 className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">
          {t("publicPredictions", { count: publicPredictions.length })}
        </h2>

        {publicPredictions.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)] text-sm">
            {t("noPredictions")}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {publicPredictions.map((p) => {
              const cat = CATEGORIES[p.category]
              const pColor = getProbabilityColor(p.probability)
              return (
                <div key={p.id} className="card">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-secondary)]">
                        {cat.emoji} {tCat(p.category as any)}
                      </span>
                      {p.resolution && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-mono"
                          style={{
                            color: RESOLUTION_CONFIG[p.resolution].color,
                            background: RESOLUTION_CONFIG[p.resolution].bg,
                          }}
                        >
                          {tRes(p.resolution as any)}
                        </span>
                      )}
                    </div>
                    <span
                      className="font-mono text-lg font-bold shrink-0"
                      style={{ color: pColor }}
                    >
                      {p.probability}%
                    </span>
                  </div>

                  <p className="text-sm text-[var(--text-primary)] leading-snug mb-2">
                    {p.title}
                  </p>

                  {/* Polymarket comparison */}
                  {p.polymarketProbability !== null &&
                    p.polymarketProbability !== undefined && (
                      <div className="flex items-center gap-3 text-xs font-mono mb-2">
                        <span className="text-[var(--text-muted)]">{t("vsPolymarket")}</span>
                        <span style={{ color: "var(--accent)" }}>
                          {p.polymarketProbability}%
                        </span>
                        {Math.abs(p.probability - p.polymarketProbability) >= 15 && (
                          <span className="text-[var(--accent)]">
                            {t("divergence", { diff: Math.abs(p.probability - p.polymarketProbability) })}
                          </span>
                        )}
                      </div>
                    )}

                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <Calendar size={11} />
                    <span>{t("expiresOn", { date: formatDate(p.expiresAt, locale) })}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-[var(--text-muted)] mt-8">
        {t("footer")}
      </p>
    </div>
  )
}
