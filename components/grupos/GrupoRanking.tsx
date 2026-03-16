"use client"

import Image from "next/image"

interface RankingEntry {
  position: number
  userId: string
  name: string
  image: string | null
  totalVotos: number
  mercadosResolvidos: number
  acertos: number
  scoreCalibração: number
}

interface Props {
  ranking: RankingEntry[]
  currentUserId?: string | null
}

function positionBadge(pos: number) {
  if (pos === 1) return "🥇"
  if (pos === 2) return "🥈"
  if (pos === 3) return "🥉"
  return pos
}

function calibrColor(score: number) {
  if (score >= 75) return "var(--green)"
  if (score >= 55) return "var(--yellow)"
  if (score >= 35) return "var(--orange)"
  return "var(--red)"
}

export function GrupoRanking({ ranking, currentUserId }: Props) {
  if (ranking.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
        Nenhum membro com votos ainda.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th className="text-left py-2 px-3 font-mono text-xs uppercase" style={{ color: "var(--text-muted)" }}>#</th>
            <th className="text-left py-2 px-3 font-mono text-xs uppercase" style={{ color: "var(--text-muted)" }}>Nome</th>
            <th className="text-right py-2 px-3 font-mono text-xs uppercase hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>Acertos</th>
            <th className="text-right py-2 px-3 font-mono text-xs uppercase hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>Mercados</th>
            <th className="text-right py-2 px-3 font-mono text-xs uppercase" style={{ color: "var(--accent)" }}>Calibração</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((m) => {
            const isMe = m.userId === currentUserId
            const color = calibrColor(m.scoreCalibração)
            return (
              <tr
                key={m.userId}
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: isMe ? "var(--accent-glow)" : "transparent",
                }}
              >
                <td className="py-3 px-3 text-center font-mono font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                  {positionBadge(m.position)}
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    {m.image ? (
                      <Image src={m.image} alt={m.name} width={28} height={28} className="rounded-full flex-shrink-0" />
                    ) : (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
                      >
                        {m.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <span className="font-semibold" style={{ color: isMe ? "var(--accent)" : "var(--text-primary)" }}>
                      {m.name}
                      {isMe && <span className="ml-1 text-xs font-normal" style={{ color: "var(--text-muted)" }}>(você)</span>}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 text-right font-mono hidden sm:table-cell" style={{ color: "var(--text-secondary)" }}>
                  {m.acertos}/{m.mercadosResolvidos}
                </td>
                <td className="py-3 px-3 text-right font-mono hidden sm:table-cell" style={{ color: "var(--text-secondary)" }}>
                  {m.totalVotos}
                </td>
                <td className="py-3 px-3 text-right font-mono font-semibold" style={{ color }}>
                  {m.mercadosResolvidos > 0 ? `${m.scoreCalibração}%` : "—"}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
