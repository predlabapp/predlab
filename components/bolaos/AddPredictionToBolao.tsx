"use client"

import { useState, useEffect } from "react"
import { X, Loader2, Search } from "lucide-react"
import { CATEGORIES, getProbabilityColor } from "@/lib/utils"
import { Prediction } from "@/types"

interface Props {
  slug: string
  existingPredictionIds: string[]
  onClose: () => void
  onAdded: (predictionId: string) => void
}

export function AddPredictionToBolao({ slug, existingPredictionIds, onClose, onAdded }: Props) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/predictions")
      .then((r) => r.json())
      .then((data) => setPredictions(Array.isArray(data) ? data : (data.predictions ?? [])))
      .catch(() => setError("Erro ao carregar previsões"))
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd(predictionId: string) {
    setAdding(predictionId)
    setError(null)
    try {
      const res = await fetch(`/api/bolaos/${slug}/predictions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ predictionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao adicionar")
      onAdded(predictionId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAdding(null)
    }
  }

  const available = predictions.filter(
    (p) =>
      !existingPredictionIds.includes(p.id) &&
      !p.resolvedAt &&
      (search === "" || p.title.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-2xl flex flex-col"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", maxHeight: "80vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Adicionar Previsão ao Bolão
          </h2>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              className="input-base w-full pl-8"
              placeholder="Pesquisar previsões..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-2">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-muted)" }} />
            </div>
          )}
          {!loading && available.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>
              Nenhuma previsão disponível para adicionar.
            </p>
          )}
          {available.map((p) => {
            const cat = CATEGORIES[p.category]
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
              >
                <div
                  className="font-mono text-sm font-bold w-10 text-center flex-shrink-0"
                  style={{ color: getProbabilityColor(p.probability) }}
                >
                  {p.probability}%
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {p.title}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {cat.emoji} {cat.label}
                  </p>
                </div>
                <button
                  onClick={() => handleAdd(p.id)}
                  disabled={adding === p.id}
                  className="btn-primary text-xs px-3 py-1.5 flex-shrink-0"
                >
                  {adding === p.id ? <Loader2 size={12} className="animate-spin" /> : "Adicionar"}
                </button>
              </div>
            )
          })}
        </div>

        {error && (
          <div className="px-6 py-3 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--red)" }}>{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
