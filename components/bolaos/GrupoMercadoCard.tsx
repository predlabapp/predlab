"use client"

import { useState } from "react"
import { getProbabilityColor, formatDate } from "@/lib/utils"
import { Trash2 } from "lucide-react"
import { VotarModal } from "./VotarModal"
import { ResolverMercadoModal } from "./ResolverMercadoModal"

interface Mercado {
  id: string
  question: string
  description: string | null
  expiresAt: string
  resolvedAt: string | null
  resolution: "SIM" | "NAO" | "CANCELADO" | null
  isOpen: boolean
  creatorId: string
  creatorName: string
  totalVotos: number
  totalMembros: number
  mediaGrupo: number | null
  meuVoto: number | null
  acertou: boolean | null
  melhorForecaster: { name: string; probability: number; error: number } | null
}

interface Props {
  mercado: Mercado
  slug: string
  currentUserId: string | null
  isAdmin: boolean
  onRefresh: () => void
}

const RESOLUTION_LABELS = {
  SIM: { label: "SIM", color: "var(--green)", bg: "rgba(52,211,153,0.1)" },
  NAO: { label: "NÃO", color: "var(--red)", bg: "rgba(248,113,113,0.1)" },
  CANCELADO: { label: "Cancelado", color: "var(--text-muted)", bg: "rgba(85,85,112,0.15)" },
}

export function GrupoMercadoCard({ mercado, slug, currentUserId, isAdmin, onRefresh }: Props) {
  const [showVotar, setShowVotar] = useState(false)
  const [showResolver, setShowResolver] = useState(false)

  const isCreator = mercado.creatorId === currentUserId
  const canResolve = (isCreator || isAdmin) && mercado.isOpen && !mercado.resolvedAt
  const canDelete = isCreator && mercado.totalVotos === 0
  const isResolved = !!mercado.resolvedAt

  const mediaColor = mercado.mediaGrupo !== null ? getProbabilityColor(mercado.mediaGrupo) : "var(--text-muted)"
  const meuVotoColor = mercado.meuVoto !== null ? getProbabilityColor(mercado.meuVoto) : "var(--text-muted)"

  async function handleDelete() {
    if (!confirm("Apagar este mercado?")) return
    await fetch(`/api/bolaos/${slug}/mercados/${mercado.id}`, { method: "DELETE" })
    onRefresh()
  }

  const resConfig = mercado.resolution ? RESOLUTION_LABELS[mercado.resolution] : null

  return (
    <>
      <div
        className="rounded-xl p-4"
        style={{ background: "var(--bg)", border: `1px solid ${isResolved ? "var(--border)" : "var(--border-bright)"}` }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            {resConfig && (
              <span
                className="inline-flex items-center text-xs font-mono font-bold px-2 py-0.5 rounded mb-1"
                style={{ background: resConfig.bg, color: resConfig.color }}
              >
                {resConfig.label}
              </span>
            )}
            {!isResolved && mercado.expiresAt < new Date().toISOString() && (
              <span
                className="inline-flex items-center text-xs font-mono px-2 py-0.5 rounded mb-1 ml-1"
                style={{ background: "rgba(251,191,36,0.1)", color: "var(--yellow)" }}
              >
                expirado
              </span>
            )}
            <p className="font-semibold text-sm leading-snug" style={{ color: "var(--text-primary)" }}>
              &ldquo;{mercado.question}&rdquo;
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              por {mercado.creatorName} · {isResolved ? `Resolvido ${formatDate(mercado.resolvedAt!)}` : `Encerra ${formatDate(mercado.expiresAt)}`}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {canDelete && (
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-md transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseOver={(e) => { e.currentTarget.style.color = "var(--red)" }}
                onMouseOut={(e) => { e.currentTarget.style.color = "var(--text-muted)" }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        {mercado.description && (
          <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>{mercado.description}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-3">
          {mercado.mediaGrupo !== null && (
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Média do grupo</p>
              <p className="font-mono font-bold text-sm" style={{ color: mediaColor }}>{mercado.mediaGrupo}%</p>
            </div>
          )}
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Votos</p>
            <p className="font-mono text-sm" style={{ color: "var(--text-secondary)" }}>
              {mercado.totalVotos}/{mercado.totalMembros}
            </p>
          </div>
          {mercado.meuVoto !== null && (
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Meu voto</p>
              <p className="font-mono font-bold text-sm" style={{ color: meuVotoColor }}>
                {mercado.meuVoto}%
                {mercado.acertou !== null && (
                  <span className="ml-1">{mercado.acertou ? "✅" : "❌"}</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Group bar */}
        {mercado.mediaGrupo !== null && (
          <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: "var(--border)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${mercado.mediaGrupo}%`, background: mediaColor }}
            />
          </div>
        )}

        {/* Best forecaster (resolved) */}
        {isResolved && mercado.melhorForecaster && mercado.resolution !== "CANCELADO" && (
          <div
            className="p-2 rounded-lg mb-3 text-xs"
            style={{ background: "rgba(124,106,247,0.1)", border: "1px solid var(--accent-dim)" }}
          >
            🏆 Melhor forecaster: <strong>{mercado.melhorForecaster.name}</strong> ({mercado.melhorForecaster.probability}%)
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {mercado.isOpen && !mercado.resolvedAt && (
            <button
              onClick={() => setShowVotar(true)}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: mercado.meuVoto !== null ? "var(--bg-card)" : "var(--accent-dim)",
                color: mercado.meuVoto !== null ? "var(--text-secondary)" : "var(--accent)",
                border: mercado.meuVoto !== null ? "1px solid var(--border)" : "1px solid var(--accent)",
              }}
            >
              {mercado.meuVoto !== null ? "✏️ Alterar voto" : "Votar"}
            </button>
          )}
          {canResolve && (
            <button
              onClick={() => setShowResolver(true)}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            >
              Resolver
            </button>
          )}
        </div>
      </div>

      {showVotar && (
        <VotarModal
          mercado={mercado}
          slug={slug}
          onClose={() => setShowVotar(false)}
          onVoted={onRefresh}
        />
      )}
      {showResolver && (
        <ResolverMercadoModal
          mercado={mercado}
          slug={slug}
          onClose={() => setShowResolver(false)}
          onResolved={onRefresh}
        />
      )}
    </>
  )
}
