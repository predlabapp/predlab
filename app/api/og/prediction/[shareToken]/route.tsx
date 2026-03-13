import { ImageResponse } from "next/og"
import { prisma } from "@/lib/prisma"
import { LEVELS } from "@/lib/gamification"
import { calculateAccuracyScore } from "@/lib/utils"

export const runtime = "nodejs"

function probColor(p: number) {
  if (p >= 70) return "#34d399"
  if (p >= 40) return "#fbbf24"
  if (p >= 20) return "#fb923c"
  return "#f87171"
}

function resolutionEmoji(r: string) {
  if (r === "CORRECT") return "✅"
  if (r === "INCORRECT") return "❌"
  if (r === "PARTIAL") return "🔶"
  return "⛔"
}

function resolutionLabel(r: string) {
  if (r === "CORRECT") return "Correto"
  if (r === "INCORRECT") return "Incorreto"
  if (r === "PARTIAL") return "Parcialmente correto"
  return "Cancelado"
}

function getLevelEmoji(level: number) {
  return LEVELS.find((l) => l.level === level)?.emoji ?? "🌱"
}

export async function GET(
  req: Request,
  { params }: { params: { shareToken: string } }
) {
  const prediction = await prisma.prediction.findUnique({
    where: { shareToken: params.shareToken },
    include: {
      user: {
        select: {
          name: true,
          username: true,
          level: true,
          predictions: {
            where: { resolution: { not: null } },
            select: { probability: true, resolution: true },
          },
        },
      },
    },
  })

  if (!prediction) {
    return new Response("Not found", { status: 404 })
  }

  const { user } = prediction
  const score = calculateAccuracyScore(user.predictions)
  const displayName = user.name ?? user.username ?? "Forecaster"
  const handle = user.username ? `@${user.username}` : ""
  const levelEmoji = getLevelEmoji(user.level)
  const pColor = probColor(prediction.probability)
  const hasMarket =
    prediction.polymarketProbability !== null &&
    prediction.polymarketProbability !== undefined
  const divergence = hasMarket
    ? Math.abs(prediction.probability - (prediction.polymarketProbability ?? 0))
    : 0

  const titleMaxLen = 72
  const title =
    prediction.title.length > titleMaxLen
      ? prediction.title.slice(0, titleMaxLen) + "…"
      : prediction.title

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#0a0a0f",
          padding: "48px 56px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Top border accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #7c6af7, #a78bfa)",
          }}
        />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div
            style={{
              fontSize: 18,
              color: "#7c6af7",
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            🔮 PredLab
          </div>
          {prediction.resolution && (
            <div
              style={{
                marginLeft: "auto",
                fontSize: 15,
                fontWeight: 700,
                padding: "4px 14px",
                borderRadius: 20,
                background:
                  prediction.resolution === "CORRECT"
                    ? "rgba(52,211,153,0.15)"
                    : prediction.resolution === "INCORRECT"
                    ? "rgba(248,113,113,0.15)"
                    : "rgba(251,191,36,0.15)",
                color:
                  prediction.resolution === "CORRECT"
                    ? "#34d399"
                    : prediction.resolution === "INCORRECT"
                    ? "#f87171"
                    : "#fbbf24",
              }}
            >
              {resolutionEmoji(prediction.resolution)}{" "}
              {resolutionLabel(prediction.resolution)}
            </div>
          )}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 50 ? 26 : 32,
            fontWeight: 700,
            color: "#e8e8f0",
            lineHeight: 1.3,
            marginBottom: 32,
            flex: 1,
          }}
        >
          "{title}"
        </div>

        {/* Probability bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          {/* User probability */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ color: "#8888aa", fontSize: 14, width: 80, textAlign: "right" }}>
              Tu
            </span>
            <div
              style={{
                flex: 1,
                height: 10,
                background: "#1e1e2e",
                borderRadius: 6,
                overflow: "hidden",
                display: "flex",
              }}
            >
              <div
                style={{
                  width: `${prediction.probability}%`,
                  height: "100%",
                  background: pColor,
                  borderRadius: 6,
                }}
              />
            </div>
            <span
              style={{
                color: pColor,
                fontSize: 22,
                fontWeight: 800,
                fontFamily: "monospace",
                width: 52,
              }}
            >
              {prediction.probability}%
            </span>
          </div>

          {/* Polymarket probability */}
          {hasMarket && (
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ color: "#8888aa", fontSize: 14, width: 80, textAlign: "right" }}>
                Polymarket
              </span>
              <div
                style={{
                  flex: 1,
                  height: 10,
                  background: "#1e1e2e",
                  borderRadius: 6,
                  overflow: "hidden",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    width: `${prediction.polymarketProbability}%`,
                    height: "100%",
                    background: "#7c6af7",
                    borderRadius: 6,
                  }}
                />
              </div>
              <span
                style={{
                  color: "#7c6af7",
                  fontSize: 22,
                  fontWeight: 800,
                  fontFamily: "monospace",
                  width: 52,
                }}
              >
                {prediction.polymarketProbability}%
              </span>
            </div>
          )}

          {/* Divergence badge */}
          {divergence >= 15 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginLeft: 94,
                fontSize: 13,
                color: "#a78bfa",
                background: "rgba(124,106,247,0.1)",
                padding: "4px 12px",
                borderRadius: 6,
                width: "fit-content",
              }}
            >
              ⚡ Divergência de {divergence}% face ao mercado
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 20,
            borderTop: "1px solid #1e1e2e",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ color: "#e8e8f0", fontSize: 16, fontWeight: 600 }}>
              {levelEmoji} {displayName}
            </span>
            {handle && (
              <span style={{ color: "#555570", fontSize: 13 }}>{handle}</span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {score > 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span style={{ color: "#8888aa", fontSize: 12 }}>Forecast Score</span>
                <span style={{ color: "#7c6af7", fontSize: 22, fontWeight: 800 }}>
                  {score}%
                </span>
              </div>
            )}
            <span style={{ color: "#555570", fontSize: 13 }}>
              predlab.app
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
