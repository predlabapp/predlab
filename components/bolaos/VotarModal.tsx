"use client"

import { useState } from "react"
import { X, Loader2 } from "lucide-react"
import { getProbabilityColor } from "@/lib/utils"
import { formatDate } from "@/lib/utils"

interface Props {
  mercado: {
    id: string
    question: string
    expiresAt: string
    mediaGrupo: number | null
    totalVotos: number
    meuVoto: number | null
  }
  slug: string
  onClose: () => void
  onVoted: () => void
}

export function VotarModal({ mercado, slug, onClose, onVoted }: Props) {
  const [probability, setProbability] = useState(mercado.meuVoto ?? 50)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/bolaos/${slug}/mercados/${mercado.id}/votar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ probability }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao votar")
      onVoted()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const probColor = getProbabilityColor(probability)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-display text-base font-bold" style={{ color: "var(--text-primary)" }}>
            {mercado.meuVoto !== null ? "Alterar voto" : "Votar"}
          </h2>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}><X size={20} /></button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Question */}
          <div>
            <p className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
              &ldquo;{mercado.question}&rdquo;
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Encerra {formatDate(mercado.expiresAt)}
              {mercado.totalVotos > 0 && ` · Média do grupo até agora: ${mercado.mediaGrupo}% (${mercado.totalVotos} voto${mercado.totalVotos !== 1 ? "s" : ""})`}
            </p>
          </div>

          {/* Slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Muito improvável</span>
              <span className="font-mono text-3xl font-bold" style={{ color: probColor }}>{probability}%</span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Muito provável</span>
            </div>

            <input
              type="range"
              min={1}
              max={99}
              value={probability}
              onChange={(e) => setProbability(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: probColor }}
            />

            {/* Progress bar */}
            <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${probability}%`, background: probColor }}
              />
            </div>
          </div>

          <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
            Só tu e o grupo vêem os votos individuais. Podes alterar até à data de encerramento.
          </p>

          {error && <p className="text-sm" style={{ color: "var(--red)" }}>{error}</p>}

          <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Submeter voto →"}
          </button>
        </div>
      </div>
    </div>
  )
}
