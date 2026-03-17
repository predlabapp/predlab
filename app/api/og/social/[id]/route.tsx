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
  try {
    const post = await prisma.socialPost.findUnique({ where: { id: params.id } })
    if (!post) return new Response("Not found", { status: 404 })

    const isLandscape = post.imageFormat === "landscape"
    const W = isLandscape ? 1200 : 1080
    const H = isLandscape ? 675 : 1080
    const pColor = probColor(post.probability)

    const maxLen = isLandscape ? 80 : 90
    const title = post.marketTitle.length > maxLen
      ? post.marketTitle.slice(0, maxLen) + "..."
      : post.marketTitle
    const titleSize = isLandscape
      ? (title.length > 70 ? 30 : title.length > 50 ? 34 : 40)
      : (title.length > 80 ? 40 : title.length > 60 ? 46 : 54)
    const probSize = isLandscape ? 84 : 112

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: `${W}px`,
            height: `${H}px`,
            position: "relative",
            fontFamily: "system-ui, sans-serif",
            background: "linear-gradient(135deg, #0a0a0f 0%, #12101e 40%, #0d0a1a 100%)",
          }}
        >
          {/* Unsplash background photo */}
          {post.unsplashUrl && (
            <>
              <img
                src={post.unsplashUrl}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              {/* Dark overlay so text stays readable */}
              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "linear-gradient(135deg, rgba(10,10,15,0.82) 0%, rgba(18,16,30,0.78) 100%)",
                }}
              />
            </>
          )}

          {/* Decorative orb */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: isLandscape ? -80 : -120,
              right: isLandscape ? -80 : -120,
              width: isLandscape ? 400 : 600,
              height: isLandscape ? 400 : 600,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(124,106,247,0.25) 0%, rgba(124,106,247,0) 70%)",
            }}
          />

          {/* Top accent line */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 5,
              background: "linear-gradient(90deg, #7c6af7, #a78bfa, #7c6af7)",
            }}
          />

          {/* Watermark */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: isLandscape ? 28 : 36,
              left: isLandscape ? 40 : 48,
              fontSize: isLandscape ? 20 : 22,
              fontWeight: 800,
              color: "#ffffff",
            }}
          >
            PredLab
          </div>

          {/* Main content — landscape */}
          {isLandscape && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: "center",
                padding: "88px 72px 64px 72px",
              }}
            >
              {/* Badge */}
              <div style={{ display: "flex", marginBottom: 28 }}>
                <div
                  style={{
                    display: "flex",
                    background: "rgba(124,106,247,0.2)",
                    border: "1.5px solid rgba(124,106,247,0.5)",
                    borderRadius: 8,
                    padding: "6px 18px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#a78bfa",
                    letterSpacing: 2,
                  }}
                >
                  TRENDING
                </div>
              </div>

              {/* Title */}
              <div
                style={{
                  display: "flex",
                  fontSize: titleSize,
                  fontWeight: 700,
                  color: "#e8e8f0",
                  lineHeight: 1.3,
                  marginBottom: 36,
                  maxWidth: "900px",
                }}
              >
                {title}
              </div>

              {/* Probability row */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 18 }}>
                <div style={{ display: "flex", fontSize: probSize, fontWeight: 900, color: pColor, lineHeight: 1 }}>
                  {post.probability}%
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingBottom: 10 }}>
                  <div style={{ display: "flex", fontSize: 18, color: "#8888aa" }}>market probability</div>
                  <div style={{ display: "flex", fontSize: 14, color: "#555570" }}>via Polymarket</div>
                </div>
              </div>

              {/* CTA */}
              <div style={{ display: "flex", marginTop: 28, fontSize: 17, color: "#7c6af7", fontWeight: 600 }}>
                Record your prediction at predlab.app
              </div>
            </div>
          )}

          {/* Main content — square */}
          {!isLandscape && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                padding: "80px",
                justifyContent: "space-between",
              }}
            >
              {/* Top: badge */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div
                  style={{
                    display: "flex",
                    background: "rgba(124,106,247,0.2)",
                    border: "1.5px solid rgba(124,106,247,0.5)",
                    borderRadius: 10,
                    padding: "8px 22px",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#a78bfa",
                    letterSpacing: 2,
                  }}
                >
                  TRENDING
                </div>
              </div>

              {/* Bottom */}
              <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
                <div
                  style={{
                    display: "flex",
                    fontSize: titleSize,
                    fontWeight: 700,
                    color: "#e8e8f0",
                    lineHeight: 1.25,
                  }}
                >
                  {title}
                </div>

                <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
                  <div style={{ display: "flex", fontSize: probSize, fontWeight: 900, color: pColor, lineHeight: 1 }}>
                    {post.probability}%
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingBottom: 14 }}>
                    <div style={{ display: "flex", fontSize: 24, color: "#8888aa", fontWeight: 500 }}>market probability</div>
                    <div style={{ display: "flex", fontSize: 18, color: "#555570" }}>via Polymarket</div>
                  </div>
                </div>

                <div style={{ display: "flex", fontSize: 22, color: "#7c6af7", fontWeight: 600 }}>
                  Record your prediction at predlab.app
                </div>
              </div>
            </div>
          )}
        </div>
      ),
      { width: W, height: H }
    )
  } catch (err) {
    console.error("[og/social] Error:", err)
    return new Response(`Error generating image: ${String(err)}`, { status: 500 })
  }
}
