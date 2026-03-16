import { ImageResponse } from "next/og"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const MEDAL = ["🥇", "🥈", "🥉"]

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const bolao = await prisma.bolao.findUnique({
      where: { slug: params.slug },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true } },
            palpites: { select: { pontos: true } },
          },
        },
      },
    })

    if (!bolao) return new Response("Not found", { status: 404 })

    const ranking = bolao.members
      .map((m) => {
        const totalPontos = m.palpites.reduce((sum, p) => sum + (p.pontos ?? 0), 0)
        return { name: m.user.name ?? "—", totalPontos, totalPalpites: m.palpites.length }
      })
      .sort((a, b) => b.totalPontos - a.totalPontos)
      .slice(0, 3)

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            background: "#0a0a0f",
            fontFamily: "system-ui, sans-serif",
            position: "relative",
          }}
        >
          {/* Top accent */}
          <div style={{ display: "flex", position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "linear-gradient(90deg, #7c6af7, #a78bfa, #7c6af7)" }} />

          {/* Decorative orb */}
          <div style={{ display: "flex", position: "absolute", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,106,247,0.2) 0%, rgba(124,106,247,0) 70%)" }} />

          {/* Content */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "56px 64px" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
              <div style={{ display: "flex", fontSize: 18, fontWeight: 800, color: "#7c6af7", letterSpacing: 2 }}>
                PredLab
              </div>
              <div style={{ display: "flex", fontSize: 15, color: "#555570" }}>
                predlab.app/bolao/{params.slug}
              </div>
            </div>

            {/* Bolão title */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 40 }}>
              <div style={{ display: "flex", fontSize: 56, lineHeight: 1 }}>{bolao.coverEmoji}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", fontSize: bolao.name.length > 30 ? 34 : 42, fontWeight: 800, color: "#e8e8f0", lineHeight: 1.2, maxWidth: 800 }}>
                  {bolao.name}
                </div>
                <div style={{ display: "flex", fontSize: 17, color: "#8888aa" }}>
                  {bolao.members.length} participante{bolao.members.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {/* Ranking */}
            {ranking.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {ranking.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      background: i === 0 ? "rgba(124,106,247,0.12)" : "rgba(255,255,255,0.03)",
                      border: i === 0 ? "1.5px solid rgba(124,106,247,0.35)" : "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 14,
                      padding: "14px 20px",
                    }}
                  >
                    <div style={{ display: "flex", fontSize: 28, width: 36, justifyContent: "center" }}>
                      {MEDAL[i]}
                    </div>
                    <div style={{ display: "flex", flex: 1, fontSize: 20, fontWeight: 600, color: i === 0 ? "#e8e8f0" : "#8888aa" }}>
                      {m.name}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                      <div style={{ display: "flex", fontSize: 22, fontWeight: 800, color: i === 0 ? "#7c6af7" : "#555570", fontFamily: "monospace" }}>
                        {m.totalPontos > 0 ? `${m.totalPontos} pts` : "—"}
                      </div>
                      <div style={{ display: "flex", fontSize: 13, color: "#555570" }}>
                        {m.totalPalpites} palpites
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {ranking.length === 0 && (
              <div style={{ display: "flex", fontSize: 20, color: "#555570" }}>
                Bolão sem palpites ainda — entra e faça o seu!
              </div>
            )}

            {/* CTA */}
            <div style={{ display: "flex", marginTop: "auto", paddingTop: 24, alignItems: "center", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  background: "rgba(124,106,247,0.15)",
                  border: "1.5px solid rgba(124,106,247,0.4)",
                  borderRadius: 10,
                  padding: "8px 20px",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#a78bfa",
                  letterSpacing: 1,
                }}
              >
                Entra no bolão
              </div>
              <div style={{ display: "flex", fontSize: 15, color: "#7c6af7", fontWeight: 600 }}>
                predlab.app
              </div>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  } catch (err) {
    console.error("[og/bolao]", err)
    return new Response(`Error: ${String(err)}`, { status: 500 })
  }
}
