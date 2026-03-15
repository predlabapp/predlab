"use client"

import { useState } from "react"
import { X, Loader2 } from "lucide-react"
import { CATEGORIES } from "@/lib/utils"
import { Category } from "@prisma/client"

interface Props {
  slug: string
  onClose: () => void
  onCreated: () => void
}

export function CreateMercadoModal({ slug, onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    question: "",
    description: "",
    category: "" as Category | "",
    expiresAt: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.question.trim() || !form.expiresAt) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/bolaos/${slug}/mercados`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: form.question.trim(),
          description: form.description.trim() || undefined,
          category: form.category || undefined,
          expiresAt: new Date(form.expiresAt).toISOString(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar mercado")
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
          <h2 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Novo mercado do grupo
          </h2>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
              Questão *
            </label>
            <input
              className="input-base w-full"
              placeholder="Lula vence as eleições 2026?"
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
              Descrição (opcional)
            </label>
            <textarea
              className="input-base w-full resize-none"
              placeholder="Contexto adicional..."
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
              Categoria
            </label>
            <select
              className="input-base w-full"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category | "" }))}
            >
              <option value="">Qualquer categoria</option>
              {Object.entries(CATEGORIES).map(([key, { label, emoji }]) => (
                <option key={key} value={key}>{emoji} {label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
              Data de resolução *
            </label>
            <input
              type="date"
              className="input-base w-full"
              value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
              min={new Date().toISOString().split("T")[0]}
              required
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Após esta data, o criador ou admin declara o resultado (Sim ou Não).
            </p>
          </div>

          {error && <p className="text-sm" style={{ color: "var(--red)" }}>{error}</p>}

          <button
            type="submit"
            className="btn-primary w-full mt-1"
            disabled={loading || !form.question.trim() || !form.expiresAt}
          >
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Criar mercado →"}
          </button>
        </form>
      </div>
    </div>
  )
}
