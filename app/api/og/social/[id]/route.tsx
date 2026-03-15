import { ImageResponse } from "next/og"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

function probColor(p: number) {
  if (p >= 60) return "#34d399"
  if (p >= 40) return "#fbbf24"
  return "#f87171"
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const post = await prisma.socialPost.findUnique({ where: { id: params.id } })
  if (!post) return new Response("Not found", { status: 404 })

  const isLandscape = post.imageFormat === "landscape"
  const W = isLandscape ? 1200 : 1080
  const H = isLandscape ? 675 : 1080
  const pColor = probColor(post.probability)

  const maxTitleLen = isLandscape ? 80 : 90
  const title = post.marketTitle.length > maxTitleLen
    ? post.marketTitle.slice(0, maxTitleLen) + "…"
    : post.marketTitle
  const titleFontSize = isLandscape
    ? (title.length > 70 ? 32 : title.length > 50 ? 36 : 42)
    : (title.length > 80 ? 42 : title.length > 60 ? 48 : 56)

  const probFontSize = isLandscape ? 88 : 116
  const padding = isLandscape ? "48px 64px" : "70px 80px"

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: `${W}px`,
          height: `${H}px`,
          backgroundColor: "#0a0a0f",
          position: "relative",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Background photo */}
        {post.unsplashUrl && (
          <img
            src={post.unsplashUrl}
            style={{
              position: "absolute",
              top: 0, left: 0,
              width: "100%", height: "100%",
              objectFit: "cover",
              opacity: 0.28,
            }}
          />
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            background: isLandscape
              ? "linear-gradient(to right, rgba(10,10,15,0.97) 35%, rgba(10,10,15,0.5) 70%, rgba(10,10,15,0.3) 100%)"
              : "linear-gradient(to bottom, rgba(10,10,15,0.35) 0%, rgba(10,10,15,0.65) 45%, rgba(10,10,15,0.97) 100%)",
            display: "flex",
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: 5,
            background: "linear-gradient(90deg, #7c6af7, #a78bfa)",
            display: "flex",
          }}
        />

        {/* WATERMARK — top left, always visible, Polymarket style */}
        <div
          style={{
            position: "absolute",
            top: isLandscape ? 24 : 32,
            left: isLandscape ? 32 : 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>🔮</span>
          <span
            style={{
              fontSize: isLandscape ? 20 : 22,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: 0.5,
            }}
          >
            PredLab
          </span>
        </div>

        {/* Content */}
        {isLandscape ? (
          /* LANDSCAPE layout — left-aligned content */
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding,
              paddingTop: "80px",
              maxWidth: "720px",
            }}
          >
            {/* TRENDING badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  background: "rgba(124,106,247,0.18)",
                  border: "1.5px solid rgba(124,106,247,0.45)",
                  borderRadius: 8,
                  padding: "6px 18px",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#a78bfa",
                  letterSpacing: 2,
                }}
              >
                🔥 TRENDING
              </div>
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: titleFontSize,
                fontWeight: 700,
                color: "#e8e8f0",
                lineHeight: 1.3,
                marginBottom: 32,
              }}
            >
              {title}
            </div>

            {/* Probability */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
              <div
                style={{
                  fontSize: probFontSize,
                  fontWeight: 900,
                  color: pColor,
                  lineHeight: 1,
                  fontFamily: "monospace",
                }}
              >
                {post.probability}%
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  paddingBottom: 10,
                }}
              >
                <div style={{ fontSize: 18, color: "#8888aa" }}>market probability</div>
                <div style={{ fontSize: 15, color: "#555570" }}>via Polymarket</div>
              </div>
            </div>

            {/* CTA */}
            <div style={{ marginTop: 24, fontSize: 18, color: "#7c6af7", fontWeight: 600 }}>
              Record your prediction → predlab.app
            </div>
          </div>
        ) : (
          /* SQUARE layout — stacked content */
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              padding,
              justifyContent: "space-between",
            }}
          >
            {/* Top spacer (watermark already positioned absolutely) */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div
                style={{
                  background: "rgba(124,106,247,0.18)",
                  border: "1.5px solid rgba(124,106,247,0.45)",
                  borderRadius: 10,
                  padding: "8px 22px",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#a78bfa",
                  letterSpacing: 2,
                }}
              >
                🔥 TRENDING
              </div>
            </div>

            {/* Bottom section */}
            <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
              <div
                style={{
                  fontSize: titleFontSize,
                  fontWeight: 700,
                  color: "#e8e8f0",
                  lineHeight: 1.25,
                  maxWidth: "960px",
                }}
              >
                {title}
              </div>

              <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
                <div
                  style={{
                    fontSize: probFontSize,
                    fontWeight: 900,
                    color: pColor,
                    lineHeight: 1,
                    fontFamily: "monospace",
                  }}
                >
                  {post.probability}%
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    paddingBottom: 14,
                  }}
                >
                  <div style={{ fontSize: 26, color: "#8888aa", fontWeight: 500 }}>
                    market probability
                  </div>
                  <div style={{ fontSize: 20, color: "#555570" }}>via Polymarket</div>
                </div>
              </div>

              <div style={{ fontSize: 24, color: "#7c6af7", fontWeight: 600 }}>
                Record your prediction → predlab.app
              </div>
            </div>
          </div>
        )}
      </div>
    ),
    { width: W, height: H }
  )
}
