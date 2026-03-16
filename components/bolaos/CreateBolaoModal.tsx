"use client"

import { useState } from "react"
import { X, Loader2 } from "lucide-react"
import { CATEGORIES } from "@/lib/utils"
import { Category } from "@prisma/client"
import { useRouter } from "@/navigation"

const EMOJI_OPTIONS = ["🔮", "🏆", "⚽", "🏀", "🎯", "🧠", "📈", "🌍", "🎪", "🎲", "💡", "🚀", "🌟", "🔥", "💰", "🎭"]

interface Props {
  onClose: () => void
}

export function CreateBolaoModal({ onClose }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    description: "",
    coverEmoji: "🔮",
    category: "" as Category | "",
    endsAt: "",
    maxMembers: "",
    isPublic: false,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/bolaos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          coverEmoji: form.coverEmoji,
          category: form.category || undefined,
          endsAt: form.endsAt || undefined,
          maxMembers: form.maxMembers ? parseInt(form.maxMembers) : undefined,
          isPublic: form.isPublic,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar bolão")
      router.push(`/bolao/${data.slug}`)
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
        className="w-full max-w-lg rounded-2xl flex flex-col"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Criar Bolão
          </h2>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
          {/* Emoji picker */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              Emoji
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, coverEmoji: emoji }))}
                  className="w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all"
                  style={{
                    background: form.coverEmoji === emoji ? "var(--accent-dim)" : "var(--bg)",
                    border: form.coverEmoji === emoji ? "2px solid var(--accent)" : "1px solid var(--border)",
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
              Nome *
            </label>
            <input
              className="input-base w-full"
              placeholder="Ex: Bolão Copa 2026"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={100}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
              Descrição
            </label>
            <textarea
              className="input-base w-full resize-none"
              placeholder="Descrição do bolão (opcional)"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              maxLength={500}
            />
          </div>

          {/* Category */}
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

          {/* Ends at + Max members */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                Data de encerramento
              </label>
              <input
                type="date"
                className="input-base w-full"
                value={form.endsAt}
                onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                Máx. membros
              </label>
              <input
                type="number"
                className="input-base w-full"
                placeholder="Ilimitado"
                min={2}
                max={1000}
                value={form.maxMembers}
                onChange={(e) => setForm((f) => ({ ...f, maxMembers: e.target.value }))}
              />
            </div>
          </div>

          {/* Public/private toggle */}
          <div className="p-3 rounded-xl" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
                style={{ background: form.isPublic ? "var(--accent)" : "var(--border-bright)" }}
                onClick={() => setForm((f) => ({ ...f, isPublic: !f.isPublic }))}
              >
                <div
                  className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform"
                  style={{
                    background: "white",
                    transform: form.isPublic ? "translateX(20px)" : "translateX(0)",
                  }}
                />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {form.isPublic ? "Bolão público" : "Grupo privado"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {form.isPublic
                    ? "Qualquer pessoa pode encontrar e entrar"
                    : "Acesso só por link de convite — perfeito para amigos"}
                </p>
              </div>
            </label>
          </div>

          {error && (
            <p className="text-sm" style={{ color: "var(--red)" }}>{error}</p>
          )}

          <button
            type="submit"
            className="btn-primary w-full mt-2"
            disabled={loading || !form.name.trim()}
          >
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Criar Bolão"}
          </button>
        </form>
      </div>
    </div>
  )
}
