"use client"

import { Link } from "@/navigation"
import { Users } from "lucide-react"

interface BolaoSummary {
  id: string
  name: string
  slug: string
  coverEmoji: string
  memberCount: number
  myRole: "ADMIN" | "MEMBER"
  myPosition: number | null
  myScore: number
  topForecaster: { name: string; score: number } | null
  recentActivity: number
}

interface Props {
  bolao: BolaoSummary
}

function positionLabel(pos: number | null) {
  if (!pos) return null
  if (pos === 1) return "1º lugar 🥇"
  if (pos === 2) return "2º lugar 🥈"
  if (pos === 3) return "3º lugar 🥉"
  return `${pos}º lugar`
}

export function BolaoCard({ bolao }: Props) {
  const pos = positionLabel(bolao.myPosition)

  return (
    <Link
      href={`/bolao/${bolao.slug}`}
      className="card block group transition-all hover:scale-[1.01]"
      style={{ textDecoration: "none" }}
    >
      <div className="flex items-start gap-4">
        {/* Emoji */}
        <div
          className="text-3xl w-12 h-12 flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ background: "var(--bg)", fontSize: 28 }}
        >
          {bolao.coverEmoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className="font-display font-semibold text-base truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {bolao.name}
            </h3>
            {bolao.myRole === "ADMIN" && (
              <span
                className="font-mono text-xs px-1.5 py-0.5 rounded"
                style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
              >
                admin
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
              <Users size={12} />
              {bolao.memberCount} membros
            </span>
            {pos && (
              <span className="text-xs font-mono" style={{ color: "var(--accent)" }}>
                {pos}
              </span>
            )}
            {bolao.recentActivity > 0 && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                +{bolao.recentActivity} hoje
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div
          className="text-lg transition-transform group-hover:translate-x-1"
          style={{ color: "var(--text-muted)" }}
        >
          →
        </div>
      </div>
    </Link>
  )
}
