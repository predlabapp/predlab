"use client"

import { useState } from "react"
import Image from "next/image"

interface RankingEntry {
  position: number
  userId: string
  name: string
  image: string | null
  nickname: string | null
  totalPredictions: number
  resolvedPredictions: number
  correctPredictions: number
  scoreVerified: number
  scoreGeneral: number
  streak: number
  badges: string[]
  paymentStatus?: "PENDING" | "CONFIRMED" | "REJECTED" | null
  scoreGrupo?: number | null
}

interface Props {
  ranking: RankingEntry[]
  currentUserId?: string | null
  showPayments?: boolean
  showScoreGrupo?: boolean
}

type SortKey = "scoreVerified" | "scoreGrupo"

function positionBadge(pos: number) {
  if (pos === 1) return "🥇"
  if (pos === 2) return "🥈"
  if (pos === 3) return "🥉"
  return pos
}

const PAYMENT_LABELS = {
  CONFIRMED: { icon: "✅", label: "Confirmado", color: "var(--green)" },
  PENDING:   { icon: "⏳", label: "Pendente",   color: "var(--yellow)" },
  REJECTED:  { icon: "❌", label: "Rejeitado",  color: "var(--red)" },
}

export function BolaoRanking({ ranking, currentUserId, showPayments, showScoreGrupo }: Props) {
  const [sortBy, setSortBy] = useState<SortKey>("scoreVerified")

  const sorted = [...ranking].sort((a, b) => {
    if (sortBy === "scoreGrupo") {
      return (b.scoreGrupo ?? -1) - (a.scoreGrupo ?? -1)
    }
    return b.scoreVerified - a.scoreVerified || b.scoreGeneral - a.scoreGeneral
  }).map((m, i) => ({ ...m, position: i + 1 }))

  if (ranking.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
        Nenhum membro ainda.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Sort toggle */}
      {showScoreGrupo && (
        <div className="flex gap-2">
          {([
            { key: "scoreVerified", label: "Score Global ⚡" },
            { key: "scoreGrupo",    label: "Score Grupo 🏠" },
          ] as { key: SortKey; label: string }[]).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: sortBy === opt.key ? "var(--accent-dim)" : "var(--bg)",
                color: sortBy === opt.key ? "var(--accent)" : "var(--text-muted)",
                border: sortBy === opt.key ? "1px solid var(--accent)" : "1px solid var(--border)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th className="text-left py-2 px-3 font-mono text-xs uppercase" style={{ color: "var(--text-muted)" }}>#</th>
              <th className="text-left py-2 px-3 font-mono text-xs uppercase" style={{ color: "var(--text-muted)" }}>Nome</th>
              <th className="text-right py-2 px-3 font-mono text-xs uppercase" style={{ color: "var(--text-muted)" }}>Certas</th>
              <th className="text-right py-2 px-3 font-mono text-xs uppercase" style={{ color: "var(--accent)" }}>Score ⚡</th>
              {showScoreGrupo && (
                <th className="text-right py-2 px-3 font-mono text-xs uppercase hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>
                  Grupo 🏠
                </th>
              )}
              <th className="text-right py-2 px-3 font-mono text-xs uppercase hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>Streak</th>
              {showPayments && (
                <th className="text-right py-2 px-3 font-mono text-xs uppercase hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>Pagamento</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((member) => {
              const isMe = member.userId === currentUserId
              const payment = member.paymentStatus ? PAYMENT_LABELS[member.paymentStatus] : null
              return (
                <tr
                  key={member.userId}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background: isMe ? "var(--accent-glow)" : "transparent",
                  }}
                >
                  <td className="py-3 px-3 text-center font-mono font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                    {positionBadge(member.position)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      {member.image ? (
                        <Image src={member.image} alt={member.name} width={28} height={28} className="rounded-full flex-shrink-0" />
                      ) : (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
                        >
                          {member.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold" style={{ color: isMe ? "var(--accent)" : "var(--text-primary)" }}>
                          {member.nickname ?? member.name}
                        </span>
                        {isMe && (
                          <span className="ml-1 text-xs font-normal" style={{ color: "var(--text-muted)" }}>(você)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono" style={{ color: "var(--text-secondary)" }}>
                    {member.correctPredictions}/{member.resolvedPredictions}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold" style={{ color: "var(--accent)" }}>
                    {member.scoreVerified > 0 ? `${member.scoreVerified}` : "—"}
                  </td>
                  {showScoreGrupo && (
                    <td className="py-3 px-3 text-right font-mono hidden sm:table-cell" style={{ color: "var(--text-secondary)" }}>
                      {member.scoreGrupo != null && member.scoreGrupo > 0 ? `${member.scoreGrupo}%` : "—"}
                    </td>
                  )}
                  <td className="py-3 px-3 text-right font-mono hidden sm:table-cell" style={{ color: "var(--text-secondary)" }}>
                    {member.streak > 0 ? `🔥${member.streak}` : "——"}
                  </td>
                  {showPayments && (
                    <td className="py-3 px-3 text-right hidden sm:table-cell">
                      {payment ? (
                        <span className="text-xs" style={{ color: payment.color }}>
                          {payment.icon} {payment.label}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
