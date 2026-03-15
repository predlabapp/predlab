"use client"

import { useState } from "react"
import { X, Loader2 } from "lucide-react"

interface Props {
  mercado: { id: string; question: string }
  slug: string
  onClose: () => void
  onResolved: () => void
}

type Resolution = "SIM" | "NAO" | "CANCELADO"

export function ResolverMercadoModal({ mercado, slug, onClose, onResolved }: Props) {
  const [resolution, setResolution] = useState<Resolution | null>(null)
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!resolution) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/bolaos/${slug}/mercados/${mercado.id}/resolver`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution, note: note.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao resolver")
      onResolved()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const options: { value: Resolution; label: string; color: string; bg: string }[] = [
    { value: "SIM", label: "✅ SIM — aconteceu", color: "var(--green)", bg: "rgba(52,211,153,0.1)" },
    { value: "NAO", label: "❌ NÃO — não aconteceu", color: "var(--red)", bg: "rgba(248,113,113,0.1)" },
    { value: "CANCELADO", label: "⚪ Cancelado — mercado inválido", color: "var(--text-muted)", bg: "rgba(85,85,112,0.15)" },
  ]

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
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-display text-base font-bold" style={{ color: "var(--text-primary)" }}>
            Resolver mercado
          </h2>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}><X size={20} /></button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            &ldquo;{mercado.question}&rdquo;
          </p>

          <div className="flex flex-col gap-2">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setResolution(opt.value)}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: resolution === opt.value ? opt.bg : "var(--bg)",
                  border: resolution === opt.value ? `1.5px solid ${opt.color}` : "1px solid var(--border)",
                  color: resolution === opt.value ? opt.color : "var(--text-secondary)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
              Nota (opcional)
            </label>
            <input
              className="input-base w-full"
              placeholder="Ex: Lula venceu no 2º turno com 51%"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
            />
          </div>

          {error && <p className="text-sm" style={{ color: "var(--red)" }}>{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!resolution || loading}
            className="btn-primary w-full"
          >
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Resolver →"}
          </button>
        </div>
      </div>
    </div>
  )
}
