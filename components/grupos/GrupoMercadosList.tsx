"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, Plus, CheckCircle, Clock, Trash2 } from "lucide-react"
import { CATEGORIES } from "@/lib/utils"
import { Category } from "@prisma/client"

interface Mercado {
  id: string
  question: string
  description: string | null
  category: string | null
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
  acertei: boolean | null
  melhorForecaster: { name: string; probability: number; erro: number } | null
}

interface Props {
  slug: string
  isMember: boolean
  isAdmin: boolean
  currentUserId: string | null
}

function probColor(p: number) {
  if (p >= 70) return "var(--green)"
  if (p >= 40) return "var(--yellow)"
  if (p >= 20) return "var(--orange)"
  return "var(--red)"
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

export function GrupoMercadosList({ slug, isMember, isAdmin, currentUserId }: Props) {
  const [mercados, setMercados] = useState<Mercado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [votarMercado, setVotarMercado] = useState<Mercado | null>(null)
  const [resolverMercado, setResolverMercado] = useState<Mercado | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/grupos/${slug}/mercados`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar")
      setMercados(data.mercados)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  async function handleDelete(mercadoId: string) {
    if (!confirm("Apagar este mercado?")) return
    const res = await fetch(`/api/grupos/${slug}/mercados/${mercadoId}`, { method: "DELETE" })
    if (res.ok) load()
    else {
      const data = await res.json()
      alert(data.error ?? "Erro ao apagar")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-center py-8" style={{ color: "var(--red)" }}>{error}</p>
  }

  const abertos = mercados.filter((m) => m.isOpen)
  const resolvidos = mercados.filter((m) => !m.isOpen)

  return (
    <div className="flex flex-col gap-4">
      {isMember && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-colors"
            style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent-dim)" }}
          >
            <Plus size={14} />
            Criar mercado
          </button>
        </div>
      )}

      {mercados.length === 0 ? (
        <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
          <p className="text-3xl mb-3">📊</p>
          <p className="font-display font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
            Nenhum mercado ainda
          </p>
          <p className="text-sm">
            {isMember ? "Clique em \"Criar mercado\" para começar." : "O grupo ainda não tem mercados."}
          </p>
        </div>
      ) : (
        <>
          {/* Abertos */}
          {abertos.length > 0 && (
            <div>
              <p className="text-xs font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "var(--green)" }}>
                <span className="w-2 h-2 rounded-full bg-current inline-block" />
                Abertos ({abertos.length})
              </p>
              <div className="flex flex-col gap-3">
                {abertos.map((m) => (
                  <MercadoCard
                    key={m.id}
                    mercado={m}
                    isMember={isMember}
                    isAdmin={isAdmin}
                    currentUserId={currentUserId}
                    onVotar={() => setVotarMercado(m)}
                    onResolver={() => setResolverMercado(m)}
                    onDelete={() => handleDelete(m.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Resolvidos */}
          {resolvidos.length > 0 && (
            <div>
              <p className="text-xs font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                <CheckCircle size={12} />
                Resolvidos ({resolvidos.length})
              </p>
              <div className="flex flex-col gap-3">
                {resolvidos.map((m) => (
                  <MercadoCard
                    key={m.id}
                    mercado={m}
                    isMember={isMember}
                    isAdmin={isAdmin}
                    currentUserId={currentUserId}
                    onVotar={() => {}}
                    onResolver={() => {}}
                    onDelete={() => handleDelete(m.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateMercadoModal
          slug={slug}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load() }}
        />
      )}
      {votarMercado && (
        <VotarModal
          mercado={votarMercado}
          slug={slug}
          onClose={() => setVotarMercado(null)}
          onVoted={() => { setVotarMercado(null); load() }}
        />
      )}
      {resolverMercado && (
        <ResolverModal
          mercado={resolverMercado}
          slug={slug}
          onClose={() => setResolverMercado(null)}
          onResolved={() => { setResolverMercado(null); load() }}
        />
      )}
    </div>
  )
}

// ─── Mercado Card ─────────────────────────────────────────────────────────────

function MercadoCard({
  mercado,
  isMember,
  isAdmin,
  currentUserId,
  onVotar,
  onResolver,
  onDelete,
}: {
  mercado: Mercado
  isMember: boolean
  isAdmin: boolean
  currentUserId: string | null
  onVotar: () => void
  onResolver: () => void
  onDelete: () => void
}) {
  const cat = mercado.category ? CATEGORIES[mercado.category as keyof typeof CATEGORIES] : null
  const isExpired = new Date() > new Date(mercado.expiresAt)
  const canVote = isMember && mercado.isOpen && !isExpired
  const canResolve = mercado.isOpen && (isAdmin || mercado.creatorId === currentUserId)
  const canDelete = (isAdmin || mercado.creatorId === currentUserId) && !mercado.resolvedAt

  const resolutionLabel = {
    SIM: { icon: "✅", label: "SIM", color: "var(--green)" },
    NAO: { icon: "❌", label: "NÃO", color: "var(--red)" },
    CANCELADO: { icon: "⚪", label: "Cancelado", color: "var(--text-muted)" },
  }

  return (
    <div className="rounded-xl p-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {cat && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{cat.emoji} {cat.label}</span>}
            {mercado.resolution && (
              <span
                className="text-xs font-mono font-bold"
                style={{ color: resolutionLabel[mercado.resolution].color }}
              >
                {resolutionLabel[mercado.resolution].icon} {resolutionLabel[mercado.resolution].label}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {mercado.question}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Por {mercado.creatorName} · {mercado.isOpen ? "Encerra" : "Encerrou"} {formatDate(mercado.expiresAt)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {canDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <Trash2 size={14} />
            </button>
          )}
          {canResolve && (
            <button
              onClick={onResolver}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
            >
              Resolver
            </button>
          )}
          {canVote && (
            <button
              onClick={onVotar}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: mercado.meuVoto !== null ? "var(--bg-card)" : "var(--accent-dim)",
                color: mercado.meuVoto !== null ? "var(--text-secondary)" : "var(--accent)",
                border: mercado.meuVoto !== null ? "1px solid var(--border)" : "1px solid var(--accent-dim)",
              }}
            >
              {mercado.meuVoto !== null ? `${mercado.meuVoto}% ✏️` : "Votar"}
            </button>
          )}
        </div>
      </div>

      {/* Probability bar */}
      {mercado.mediaGrupo !== null && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--border)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${mercado.mediaGrupo}%`, background: probColor(mercado.mediaGrupo) }}
              />
            </div>
            <span className="text-xs font-mono font-bold w-8 text-right" style={{ color: probColor(mercado.mediaGrupo) }}>
              {mercado.mediaGrupo}%
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Média do grupo · {mercado.totalVotos}/{mercado.totalMembros} votaram
          </p>
        </div>
      )}

      {/* My vote */}
      {mercado.meuVoto !== null && !mercado.isOpen && mercado.resolution !== "CANCELADO" && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Meu voto: <span className="font-mono font-bold" style={{ color: "var(--text-secondary)" }}>{mercado.meuVoto}%</span>
          </span>
          {mercado.acertei !== null && (
            <span
              className="text-xs font-semibold"
              style={{ color: mercado.acertei ? "var(--green)" : "var(--red)" }}
            >
              {mercado.acertei ? "✅ Acertei" : "❌ Errei"}
            </span>
          )}
        </div>
      )}

      {/* Best forecaster */}
      {mercado.melhorForecaster && mercado.resolution !== "CANCELADO" && (
        <div className="mt-1">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            🏆 Melhor: <span style={{ color: "var(--accent)" }}>{mercado.melhorForecaster.name}</span>
            {" "}({mercado.melhorForecaster.probability}%)
          </span>
        </div>
      )}

      {/* Expired but not resolved */}
      {isExpired && mercado.isOpen && (
        <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: "var(--orange)" }}>
          <Clock size={12} />
          Prazo encerrado — aguardando resolução
        </div>
      )}
    </div>
  )
}

// ─── Create Mercado Modal ─────────────────────────────────────────────────────

const CATEGORY_OPTIONS: { value: Category; label: string; emoji: string }[] = [
  { value: "TECHNOLOGY", label: "Tecnologia", emoji: "💻" },
  { value: "ECONOMY", label: "Economia", emoji: "📈" },
  { value: "MARKETS", label: "Mercados", emoji: "💹" },
  { value: "STARTUPS", label: "Startups", emoji: "🚀" },
  { value: "GEOPOLITICS", label: "Geopolítica", emoji: "🌍" },
  { value: "SCIENCE", label: "Ciência", emoji: "🔬" },
  { value: "SPORTS", label: "Esportes", emoji: "⚽" },
  { value: "CULTURE", label: "Cultura", emoji: "🎭" },
  { value: "OTHER", label: "Outro", emoji: "🎯" },
]

function CreateMercadoModal({
  slug,
  onClose,
  onCreated,
}: {
  slug: string
  onClose: () => void
  onCreated: () => void
}) {
  const [question, setQuestion] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<Category | "">("")
  const [expiresAt, setExpiresAt] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/grupos/${slug}/mercados`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          description: description.trim() || undefined,
          category: category || undefined,
          expiresAt,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar mercado")
      onCreated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
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
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            📊 Novo mercado
          </h2>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Questão *</label>
            <input
              className="input-base w-full"
              placeholder="Ex: Lula vence as eleições 2026?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Descrição (opcional)</label>
            <textarea
              className="input-base w-full resize-none"
              placeholder="Contexto adicional..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
            />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Categoria</label>
            <select
              className="input-base w-full"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category | "")}
            >
              <option value="">Selecionar...</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Data de resolução *</label>
            <input
              type="date"
              className="input-base w-full"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              required
            />
          </div>

          <p className="text-xs p-3 rounded-lg" style={{ background: "var(--accent-glow)", color: "var(--accent)" }}>
            💡 Após esta data, o criador ou admin declara o resultado (Sim ou Não).
          </p>

          {error && <p className="text-sm" style={{ color: "var(--red)" }}>{error}</p>}

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Criar mercado →"}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Votar Modal ──────────────────────────────────────────────────────────────

function VotarModal({
  mercado,
  slug,
  onClose,
  onVoted,
}: {
  mercado: Mercado
  slug: string
  onClose: () => void
  onVoted: () => void
}) {
  const [probability, setProbability] = useState(mercado.meuVoto ?? 50)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/grupos/${slug}/mercados/${mercado.id}/votar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ probability }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao votar")
      onVoted()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const color = probColor(probability)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
          {mercado.question}
        </p>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          Por {mercado.creatorName} · Encerra {formatDate(mercado.expiresAt)}
          {mercado.mediaGrupo !== null && (
            <span> · Média: <span className="font-mono">{mercado.mediaGrupo}%</span> ({mercado.totalVotos} votos)</span>
          )}
        </p>

        <p className="text-xs font-mono uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
          Qual é a sua probabilidade?
        </p>

        {/* Probability display */}
        <div className="text-center mb-4">
          <span className="font-display text-5xl font-bold" style={{ color }}>
            {probability}%
          </span>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {probability < 20 ? "Muito improvável" :
             probability < 40 ? "Improvável" :
             probability < 60 ? "Incerto" :
             probability < 80 ? "Provável" : "Muito provável"}
          </p>
        </div>

        {/* Slider */}
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-muted)" }}>
            <span>Improvável</span>
            <span>Provável</span>
          </div>
          <input
            type="range"
            min={1}
            max={99}
            value={probability}
            onChange={(e) => setProbability(parseInt(e.target.value))}
            className="w-full accent-purple-500"
            style={{ accentColor: "var(--accent)" }}
          />
        </div>

        <p className="text-xs text-center mb-4" style={{ color: "var(--text-muted)" }}>
          Pode alterar até à data de resolução.
        </p>

        {error && <p className="text-sm mb-3" style={{ color: "var(--red)" }}>{error}</p>}

        <div className="flex gap-3">
          <button className="btn-ghost flex-1 text-sm" onClick={onClose}>Cancelar</button>
          <button className="btn-primary flex-1 text-sm" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Submeter voto →"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Resolver Modal ───────────────────────────────────────────────────────────

function ResolverModal({
  mercado,
  slug,
  onClose,
  onResolved,
}: {
  mercado: Mercado
  slug: string
  onClose: () => void
  onResolved: () => void
}) {
  const [resolution, setResolution] = useState<"SIM" | "NAO" | "CANCELADO" | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!resolution) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/grupos/${slug}/mercados/${mercado.id}/resolver`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao resolver")
      onResolved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const options: { value: "SIM" | "NAO" | "CANCELADO"; icon: string; label: string; desc: string; color: string }[] = [
    { value: "SIM", icon: "✅", label: "SIM — aconteceu", desc: "O evento ocorreu", color: "var(--green)" },
    { value: "NAO", icon: "❌", label: "NÃO — não aconteceu", desc: "O evento não ocorreu", color: "var(--red)" },
    { value: "CANCELADO", icon: "⚪", label: "Cancelado", desc: "Mercado inválido ou inconclusivo", color: "var(--text-muted)" },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <h3 className="font-display font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          Resolver mercado
        </h3>
        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
          "{mercado.question}"
        </p>

        <div className="flex flex-col gap-2 mb-5">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setResolution(opt.value)}
              className="p-3 rounded-xl text-left transition-all"
              style={{
                background: resolution === opt.value ? "var(--accent-glow)" : "var(--bg)",
                border: resolution === opt.value ? `2px solid ${opt.color}` : "1px solid var(--border)",
              }}
            >
              <p className="text-sm font-semibold" style={{ color: opt.color }}>
                {opt.icon} {opt.label}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{opt.desc}</p>
            </button>
          ))}
        </div>

        {error && <p className="text-sm mb-3" style={{ color: "var(--red)" }}>{error}</p>}

        <div className="flex gap-3">
          <button className="btn-ghost flex-1 text-sm" onClick={onClose}>Cancelar</button>
          <button
            className="btn-primary flex-1 text-sm"
            onClick={handleSubmit}
            disabled={saving || !resolution}
          >
            {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Resolver →"}
          </button>
        </div>
      </div>
    </div>
  )
}
