"use client"

import Image from "next/image"

interface RankingEntry {
  position: number
  userId: string
  name: string
  image: string | null
  nickname: string | null
  totalPontos: number
  palpitesExactos: number
  palpitesResultado: number
  palpitesErrados: number
  totalPalpites: number
  paymentStatus?: "PENDING" | "CONFIRMED" | "REJECTED" | null
}

interface Props {
  ranking: RankingEntry[]
  currentUserId?: string | null
  showPayments?: boolean
}

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

export function BolaoRanking({ ranking, currentUserId, showPayments }: Props) {
  if (ranking.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
        Nenhum membro ainda.
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
            <th className="text-right py-2 px-3 font-mono text-xs uppercase hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>🎯 Exactos</th>
            <th className="text-right py-2 px-3 font-mono text-xs uppercase hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>✅ Result.</th>
            <th className="text-right py-2 px-3 font-mono text-xs uppercase" style={{ color: "var(--accent)" }}>Pontos</th>
            {showPayments && (
              <th className="text-right py-2 px-3 font-mono text-xs uppercase hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>Pagamento</th>
            )}
          </tr>
        </thead>
        <tbody>
          {ranking.map((member) => {
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
                <td className="py-3 px-3 text-right font-mono hidden sm:table-cell" style={{ color: "var(--text-secondary)" }}>
                  {member.palpitesExactos}
                </td>
                <td className="py-3 px-3 text-right font-mono hidden sm:table-cell" style={{ color: "var(--text-secondary)" }}>
                  {member.palpitesResultado}
                </td>
                <td className="py-3 px-3 text-right font-mono font-semibold" style={{ color: "var(--accent)" }}>
                  {member.totalPontos > 0 ? `${member.totalPontos} pts` : "—"}
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
  )
}
