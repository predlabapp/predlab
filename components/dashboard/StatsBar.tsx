"use client"

import { useEffect, useState } from "react"
import { Clock, CheckCircle, Target } from "lucide-react"

interface Stats {
  total: number
  pending: number
  resolved: number
  correct: number
  scoreGeneral: number
  scoreVerified: number
  verifiedCount: number
}

export function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch("/api/user/stats")
      .then((r) => r.json())
      .then(setStats)
  }, [])

  if (!stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card animate-pulse h-16" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {/* Total */}
      <div className="card flex items-center gap-3">
        <Target size={18} style={{ color: "var(--accent)" }} />
        <div>
          <p className="text-lg font-bold font-mono">{stats.total}</p>
          <p className="text-xs text-[var(--text-muted)]">Previsões</p>
        </div>
      </div>

      {/* Pendentes */}
      <div className="card flex items-center gap-3">
        <Clock size={18} style={{ color: "var(--yellow)" }} />
        <div>
          <p className="text-lg font-bold font-mono">{stats.pending}</p>
          <p className="text-xs text-[var(--text-muted)]">Pendentes</p>
        </div>
      </div>

      {/* Score Verificado */}
      <div className="card flex items-center gap-3">
        <span className="text-base shrink-0">⚡</span>
        <div>
          {stats.verifiedCount >= 10 ? (
            <>
              <p className="text-lg font-bold font-mono" style={{ color: "var(--accent)" }}>
                {stats.scoreVerified}%
              </p>
              <p className="text-xs text-[var(--text-muted)]">Score Verificado</p>
            </>
          ) : (
            <>
              <p className="text-xs font-mono font-bold text-[var(--yellow)]">Em qualificação</p>
              <p className="text-xs text-[var(--text-muted)]">
                {stats.verifiedCount}/10 verificadas
              </p>
            </>
          )}
        </div>
      </div>

      {/* Score Geral */}
      <div className="card flex items-center gap-3">
        <span className="text-base shrink-0">✍️</span>
        <div>
          <p className="text-lg font-bold font-mono" style={{ color: "var(--text-secondary)" }}>
            {stats.scoreGeneral > 0 ? `${stats.scoreGeneral}%` : "—"}
          </p>
          <p className="text-xs text-[var(--text-muted)]">Score Geral</p>
        </div>
      </div>
    </div>
  )
}
