"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/navigation"
import { CATEGORIES, getProbabilityColor, formatDate, calculateAccuracyScore } from "@/lib/utils"
import type { Category, Resolution } from "@prisma/client"

interface SharedPrediction {
  id: string
  title: string
  description: string | null
  probability: number
  category: Category
  expiresAt: string
  resolvedAt: string | null
  resolution: Resolution | null
  polymarketProbability: number | null
  polymarketUrl: string | null
  evidence: string | null
  tags: string[]
  user: {
    name: string | null
    username: string | null
    level: number
    predictions: Array<{ probability: number; resolution: Resolution | null }>
  }
}

interface Props {
  prediction: SharedPrediction
  locale: string
}

const RESOLUTION_COLORS: Record<Resolution, { color: string; bg: string; label: string }> = {
  CORRECT: { color: "#34d399", bg: "rgba(52,211,153,0.12)", label: "✓ Correct" },
  INCORRECT: { color: "#f87171", bg: "rgba(248,113,113,0.12)", label: "✗ Incorrect" },
  PARTIAL: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)", label: "◑ Partial" },
  CANCELLED: { color: "#555570", bg: "rgba(85,85,112,0.15)", label: "○ Cancelled" },
}

export default function SharedPredictionPage({ prediction, locale }: Props) {
  const t = useTranslations("SharePage")
  const tResolution = useTranslations("Resolution")
  const tCategories = useTranslations("Categories")

  const cat = CATEGORIES[prediction.category]
  const probColor = getProbabilityColor(prediction.probability)
  const forecastScore = calculateAccuracyScore(prediction.user.predictions)
  const displayName = prediction.user.name ?? prediction.user.username ?? "Forecaster"
  const avatarLetter = displayName.charAt(0).toUpperCase()

  const polyProb = prediction.polymarketProbability
  const divergence = polyProb !== null ? Math.abs(prediction.probability - Math.round(polyProb)) : null

  const resolutionConfig = prediction.resolution ? RESOLUTION_COLORS[prediction.resolution] : null

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text-primary)",
        fontFamily: "inherit",
      }}
    >
      {/* Navbar */}
      <nav
        style={{
          borderBottom: "1px solid var(--border)",
          background: "rgba(10,10,15,0.85)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 768,
            margin: "0 auto",
            padding: "0 1rem",
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 700,
              fontSize: "1.125rem",
              color: "var(--text-primary)",
              textDecoration: "none",
              letterSpacing: "-0.02em",
            }}
          >
            🔮 PredLab
          </Link>
          <Link
            href="/auth/signup"
            style={{
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "0.4rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "none",
              display: "inline-block",
              letterSpacing: "-0.01em",
            }}
          >
            {t("navCta")}
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <main
        style={{
          maxWidth: 672,
          margin: "0 auto",
          padding: "2.5rem 1rem 4rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {/* Prediction Card */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {/* Category badge + resolution */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
            <span
              style={{
                background: "var(--accent-glow)",
                border: "1px solid var(--accent-dim)",
                color: "var(--accent)",
                borderRadius: 6,
                padding: "0.2rem 0.625rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                fontFamily: "var(--font-dm-mono), monospace",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {cat.emoji} {tCategories(prediction.category)}
            </span>

            {resolutionConfig && prediction.resolution && (
              <span
                style={{
                  background: resolutionConfig.bg,
                  border: `1px solid ${resolutionConfig.color}33`,
                  color: resolutionConfig.color,
                  borderRadius: 6,
                  padding: "0.2rem 0.625rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  fontFamily: "var(--font-dm-mono), monospace",
                  letterSpacing: "0.02em",
                }}
              >
                {resolutionConfig.label} · {tResolution(prediction.resolution)}
              </span>
            )}
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontSize: "clamp(1.25rem, 4vw, 1.625rem)",
              fontWeight: 700,
              lineHeight: 1.3,
              color: "var(--text-primary)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            &ldquo;{prediction.title}&rdquo;
          </h1>

          {/* Probability */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
              <span
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-dm-mono), monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {t("yourProbability")}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSize: "clamp(2rem, 8vw, 3rem)",
                  fontWeight: 700,
                  color: probColor,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                }}
              >
                {prediction.probability}%
              </span>
            </div>
            {/* Probability bar */}
            <div
              style={{
                height: 8,
                background: "var(--border)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${prediction.probability}%`,
                  background: probColor,
                  borderRadius: 4,
                  transition: "width 0.6s ease",
                }}
              />
            </div>
          </div>

          {/* Polymarket comparison */}
          {polyProb !== null && (
            <div
              style={{
                background: "rgba(124,106,247,0.06)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "0.875rem 1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.625rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-dm-mono), monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                }}
              >
                {t("vsPolymarket")}
                {divergence !== null && divergence > 0 && (
                  <span
                    style={{
                      color: "var(--accent)",
                      background: "var(--accent-glow)",
                      border: "1px solid var(--accent-dim)",
                      borderRadius: 4,
                      padding: "0.1rem 0.375rem",
                      fontSize: "0.6875rem",
                    }}
                  >
                    {t("divergence", { diff: divergence })}
                  </span>
                )}
              </div>
              {/* Polymarket bar */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span
                  style={{
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    minWidth: "3.5rem",
                  }}
                >
                  {Math.round(polyProb)}%
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    background: "var(--border)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.round(polyProb)}%`,
                      background: "var(--accent-dim)",
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Expiry */}
          <div
            style={{
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
              fontFamily: "var(--font-dm-mono), monospace",
              borderTop: "1px solid var(--border)",
              paddingTop: "1rem",
            }}
          >
            {prediction.resolution
              ? `${t("resolved")} · ${formatDate(prediction.resolvedAt ?? prediction.expiresAt, locale)}`
              : t("expires", { date: formatDate(prediction.expiresAt, locale) })}
          </div>
        </div>

        {/* Forecaster section */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "1.5rem 1.75rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--accent-dim)",
              border: "2px solid var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-syne), sans-serif",
              fontWeight: 700,
              fontSize: "1.25rem",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {avatarLetter}
          </div>

          {/* Name + score */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: "1rem",
                color: "var(--text-primary)",
                fontFamily: "var(--font-syne), sans-serif",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {displayName}
            </div>
            {prediction.user.username && (
              <div
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-dm-mono), monospace",
                }}
              >
                @{prediction.user.username}
              </div>
            )}
            <div
              style={{
                marginTop: "0.25rem",
                fontSize: "0.8125rem",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>{t("forecastScore")}:</span>
              <span
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontWeight: 700,
                  color: forecastScore > 0 ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {forecastScore > 0 ? `${forecastScore}%` : "—"}
              </span>
            </div>
          </div>

          {/* Profile link */}
          {prediction.user.username && (
            <Link
              href={`/p/${prediction.user.username}` as any}
              style={{
                color: "var(--accent)",
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
                whiteSpace: "nowrap",
                letterSpacing: "-0.01em",
                padding: "0.5rem 1rem",
                border: "1px solid var(--accent-dim)",
                borderRadius: 8,
                background: "var(--accent-glow)",
                transition: "border-color 0.15s",
              }}
            >
              {t("viewProfile")}
            </Link>
          )}
        </div>

        {/* CTA section */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(124,106,247,0.08) 0%, rgba(61,53,128,0.12) 100%)",
            border: "1px solid var(--border-bright)",
            borderRadius: 16,
            padding: "2rem 1.75rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--accent)",
              fontFamily: "var(--font-dm-mono), monospace",
              fontWeight: 600,
            }}
          >
            🔮 PredLab
          </div>
          <h2
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontSize: "clamp(1.125rem, 4vw, 1.375rem)",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
              letterSpacing: "-0.02em",
              lineHeight: 1.3,
            }}
          >
            {t("ctaTitle")}
          </h2>
          <Link
            href="/auth/signup"
            style={{
              background: "var(--accent)",
              color: "#fff",
              borderRadius: 10,
              padding: "0.75rem 1.75rem",
              fontSize: "1rem",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-block",
              letterSpacing: "-0.01em",
              boxShadow: "0 0 24px rgba(124,106,247,0.3)",
              transition: "opacity 0.15s",
            }}
          >
            {t("ctaButton")}
          </Link>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
              margin: 0,
              fontFamily: "var(--font-dm-mono), monospace",
            }}
          >
            {t("ctaFine")}
          </p>
        </div>
      </main>
    </div>
  )
}
