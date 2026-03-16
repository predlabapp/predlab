"use client"

import { Link } from "@/navigation"
import { Users, BarChart2 } from "lucide-react"

interface GrupoSummary {
  id: string
  name: string
  slug: string
  coverEmoji: string
  memberCount: number
  totalMercados: number
  mercadosAbertos: number
  myRole: "ADMIN" | "MEMBER"
}

export function GrupoCard({ grupo }: { grupo: GrupoSummary }) {
  return (
    <Link
      href={`/grupo/${grupo.slug}`}
      className="card block group transition-all hover:scale-[1.01]"
      style={{ textDecoration: "none" }}
    >
      <div className="flex items-start gap-4">
        <div
          className="text-3xl w-12 h-12 flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ background: "var(--bg)", fontSize: 28 }}
        >
          {grupo.coverEmoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-base truncate" style={{ color: "var(--text-primary)" }}>
              {grupo.name}
            </h3>
            {grupo.myRole === "ADMIN" && (
              <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
                admin
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
              <Users size={12} />
              {grupo.memberCount} membros
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
              <BarChart2 size={12} />
              {grupo.mercadosAbertos} abertos
            </span>
          </div>
        </div>

        <div className="text-lg transition-transform group-hover:translate-x-1" style={{ color: "var(--text-muted)" }}>
          →
        </div>
      </div>
    </Link>
  )
}
