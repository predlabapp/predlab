"use client"

import { useState } from "react"
import { X, Lock } from "lucide-react"
import { CATEGORIES, getProbabilityColor } from "@/lib/utils"
import { Prediction } from "@/types"
// Note: title, probability, category are immutable after creation
import { useToast } from "@/components/ui/Toast"

interface Props {
  prediction: Prediction
  onClose: () => void
  onSaved: (p: Prediction) => void
}

export function EditPredictionModal({ prediction, onClose, onSaved }: Props) {
  const { toast } = useToast()
  const [description, setDescription] = useState(prediction.description ?? "")
  const [evidence, setEvidence] = useState(prediction.evidence ?? "")
  const [tags, setTags] = useState(prediction.tags.join(", "))
  const [isPublic, setIsPublic] = useState(prediction.isPublic)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch(`/api/predictions/${prediction.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: description || undefined,
        evidence: evidence || undefined,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        isPublic,
      }),
    })

    if (res.ok) {
      const updated = await res.json()
      onSaved(updated)
      toast("Previsão atualizada.", "success")
    } else {
      toast("Erro ao atualizar previsão.", "error")
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[var(--bg-card)] rounded-xl border border-[var(--border)] shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="font-display text-lg font-semibold">Editar Previsão</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Locked fields info */}
          <div className="rounded-lg bg-[var(--bg)] border border-[var(--border)] overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)]">
              <Lock size={12} className="text-[var(--text-muted)]" />
              <span className="text-xs text-[var(--text-muted)]">Campos imutáveis — alterar invalidaria a previsão</span>
            </div>
            <div className="p-3 space-y-2">
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Previsão</p>
                <p className="text-sm text-[var(--text-secondary)] leading-snug">{prediction.title}</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">Probabilidade</p>
                  <span className="font-mono text-lg font-bold" style={{ color: getProbabilityColor(prediction.probability) }}>
                    {prediction.probability}%
                  </span>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">Categoria</p>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {CATEGORIES[prediction.category].emoji} {CATEGORIES[prediction.category].label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              Argumento / Raciocínio
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-base resize-none h-20"
              placeholder="Porque acreditas nisto?"
            />
          </div>

          {/* Evidence */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              Evidências / Fontes
            </label>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              className="input-base resize-none h-16"
              placeholder="Links, dados, fontes..."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              Tags{" "}
              <span className="text-[var(--text-muted)]">(separadas por vírgula)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input-base"
              placeholder="ia, openai, llm"
            />
          </div>

          {/* Public toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`w-9 h-5 rounded-full transition-colors relative ${
                isPublic ? "bg-[var(--accent)]" : "bg-[var(--border-bright)]"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  isPublic ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-sm text-[var(--text-secondary)]">Pública</span>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? "A guardar..." : "Guardar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
