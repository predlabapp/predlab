"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, Plus, CheckCircle, Clock, Lock, Calendar } from "lucide-react"

interface Jogo {
  id: string
  name: string
  description: string | null
  homeTeam: string | null
  awayTeam: string | null
  options: string[] | null
  scheduledAt: string
  phase: string | null
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "CANCELLED"
  resultHome: number | null
  resultAway: number | null
  resultOption: string | null
  resolvedAt: string | null
  meuPalpite: {
    id: string
    palpiteHome: number | null
    palpiteAway: number | null
    palpiteOption: string | null
    pontos: number | null
  } | null
  totalPalpites: number
  totalMembros: number
}

interface Props {
  slug: string
  isAdmin: boolean
  bolaoType: "SPORTS" | "CUSTOM"
  isMember: boolean
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

function isJogoOpen(jogo: Jogo) {
  return jogo.status === "SCHEDULED" && new Date() < new Date(jogo.scheduledAt)
}

export function BolaoJogos({ slug, isAdmin, bolaoType, isMember }: Props) {
  const [jogos, setJogos] = useState<Jogo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activePalpite, setActivePalpite] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/bolaos/${slug}/jogos`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar jogos")
      setJogos(data.jogos)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

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

  // Group by phase
  const groups: Record<string, Jogo[]> = {}
  for (const jogo of jogos) {
    const phase = jogo.phase ?? "Sem fase"
    if (!groups[phase]) groups[phase] = []
    groups[phase].push(jogo)
  }

  return (
    <div className="flex flex-col gap-4">
      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-colors"
            style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent-dim)" }}
          >
            <Plus size={14} />
            Adicionar Jogo
          </button>
        </div>
      )}

      {jogos.length === 0 ? (
        <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
          <p className="text-3xl mb-3">{bolaoType === "SPORTS" ? "⚽" : "🗳️"}</p>
          <p className="font-display font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
            Nenhum jogo ainda
          </p>
          <p className="text-sm">
            {isAdmin ? "Clique em \"Adicionar Jogo\" para começar." : "O admin ainda não adicionou jogos."}
          </p>
        </div>
      ) : (
        Object.entries(groups).map(([phase, phaseJogos]) => (
          <div key={phase}>
            {Object.keys(groups).length > 1 && (
              <p className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                📅 {phase}
              </p>
            )}
            <div className="flex flex-col gap-3">
              {phaseJogos.map((jogo) => (
                <JogoCard
                  key={jogo.id}
                  jogo={jogo}
                  slug={slug}
                  isAdmin={isAdmin}
                  isMember={isMember}
                  activePalpite={activePalpite}
                  setActivePalpite={setActivePalpite}
                  onUpdate={load}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {showCreateModal && (
        <CreateJogoModal
          slug={slug}
          bolaoType={bolaoType}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); load() }}
        />
      )}
    </div>
  )
}

// ─── Jogo Card ────────────────────────────────────────────────────────────────

function JogoCard({
  jogo,
  slug,
  isAdmin,
  isMember,
  activePalpite,
  setActivePalpite,
  onUpdate,
}: {
  jogo: Jogo
  slug: string
  isAdmin: boolean
  isMember: boolean
  activePalpite: string | null
  setActivePalpite: (id: string | null) => void
  onUpdate: () => void
}) {
  const open = isJogoOpen(jogo)
  const [showResult, setShowResult] = useState(false)

  const hasMeuPalpite = !!jogo.meuPalpite
  const isExpanded = activePalpite === jogo.id

  let statusIcon = <Calendar size={14} />
  let statusColor = "var(--text-muted)"
  if (jogo.status === "FINISHED") { statusIcon = <CheckCircle size={14} />; statusColor = "var(--green)" }
  else if (jogo.status === "LIVE") { statusIcon = <Clock size={14} />; statusColor = "var(--yellow)" }
  else if (!open) { statusIcon = <Lock size={14} />; statusColor = "var(--orange)" }

  return (
    <div className="rounded-xl p-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {jogo.homeTeam && jogo.awayTeam ? (
                <>
                  <span>{jogo.homeTeam}</span>
                  <span className="mx-1.5 font-mono" style={{ color: "var(--text-muted)" }}>vs</span>
                  <span>{jogo.awayTeam}</span>
                </>
              ) : jogo.name}
            </p>
            <span className="text-xs flex items-center gap-1" style={{ color: statusColor }}>
              {statusIcon}
              {jogo.status === "FINISHED" ? "Encerrado" :
               jogo.status === "LIVE" ? "Ao vivo" :
               open ? "Aberto" : "Encerrado"}
            </span>
          </div>

          {/* Date */}
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {formatDateTime(jogo.scheduledAt)}
            <span className="ml-2">{jogo.totalPalpites}/{jogo.totalMembros} palpites</span>
          </p>

          {/* Result (if finished) */}
          {jogo.status === "FINISHED" && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span
                className="text-sm font-mono font-bold px-2 py-0.5 rounded"
                style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
              >
                {jogo.homeTeam && jogo.awayTeam
                  ? `${jogo.resultHome} × ${jogo.resultAway}`
                  : jogo.resultOption ?? "—"}
              </span>
              {jogo.meuPalpite && (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Seu palpite:{" "}
                  <span style={{ color: "var(--text-secondary)" }}>
                    {jogo.homeTeam
                      ? `${jogo.meuPalpite.palpiteHome} × ${jogo.meuPalpite.palpiteAway}`
                      : jogo.meuPalpite.palpiteOption ?? "—"}
                  </span>
                  {" "}→{" "}
                  <span
                    style={{
                      color: (jogo.meuPalpite.pontos ?? 0) > 0 ? "var(--green)" : "var(--text-muted)",
                      fontWeight: "600",
                    }}
                  >
                    {jogo.meuPalpite.pontos != null ? `+${jogo.meuPalpite.pontos} pts` : "0 pts"}
                  </span>
                </span>
              )}
            </div>
          )}

          {/* Pending palpite info */}
          {jogo.status !== "FINISHED" && hasMeuPalpite && !isExpanded && (
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Palpite: {jogo.meuPalpite!.palpiteHome != null
                  ? `${jogo.meuPalpite!.palpiteHome} × ${jogo.meuPalpite!.palpiteAway}`
                  : jogo.meuPalpite!.palpiteOption ?? "—"}
              </span>
              {open && (
                <button
                  className="text-xs underline"
                  style={{ color: "var(--text-muted)" }}
                  onClick={() => setActivePalpite(jogo.id)}
                >
                  Alterar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          {/* Palpite button */}
          {isMember && jogo.status !== "FINISHED" && open && !isExpanded && (
            <button
              onClick={() => setActivePalpite(jogo.id)}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: hasMeuPalpite ? "var(--bg-card)" : "var(--accent-dim)",
                color: hasMeuPalpite ? "var(--text-muted)" : "var(--accent)",
                border: hasMeuPalpite ? "1px solid var(--border)" : "1px solid var(--accent-dim)",
              }}
            >
              {hasMeuPalpite ? "Ver palpite" : "Palpitar"}
            </button>
          )}

          {/* Admin: fill result */}
          {isAdmin && jogo.status !== "FINISHED" && jogo.status !== "CANCELLED" && (
            <button
              onClick={() => setShowResult(true)}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
            >
              Resultado
            </button>
          )}
        </div>
      </div>

      {/* Inline palpite form */}
      {isExpanded && isMember && (
        <PalpiteForm
          jogo={jogo}
          slug={slug}
          onClose={() => setActivePalpite(null)}
          onSaved={() => { setActivePalpite(null); onUpdate() }}
        />
      )}

      {/* Inline result form (admin) */}
      {showResult && isAdmin && (
        <ResultadoForm
          jogo={jogo}
          slug={slug}
          onClose={() => setShowResult(false)}
          onSaved={() => { setShowResult(false); onUpdate() }}
        />
      )}
    </div>
  )
}

// ─── Palpite Form ─────────────────────────────────────────────────────────────

function PalpiteForm({
  jogo,
  slug,
  onClose,
  onSaved,
}: {
  jogo: Jogo
  slug: string
  onClose: () => void
  onSaved: () => void
}) {
  const [home, setHome] = useState<string>(jogo.meuPalpite?.palpiteHome?.toString() ?? "")
  const [away, setAway] = useState<string>(jogo.meuPalpite?.palpiteAway?.toString() ?? "")
  const [option, setOption] = useState<string>(jogo.meuPalpite?.palpiteOption ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSports = !!jogo.homeTeam

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const body = isSports
        ? { palpiteHome: parseInt(home), palpiteAway: parseInt(away) }
        : { palpiteOption: option }

      const res = await fetch(`/api/bolaos/${slug}/jogos/${jogo.id}/palpite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar palpite")
      onSaved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
      {isSports ? (
        <div className="flex items-center gap-3">
          <div className="flex-1 text-right">
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{jogo.homeTeam}</p>
            <input
              type="number"
              min={0}
              max={99}
              value={home}
              onChange={(e) => setHome(e.target.value)}
              className="input-base w-16 text-center text-lg font-mono"
            />
          </div>
          <span className="font-mono text-lg" style={{ color: "var(--text-muted)" }}>×</span>
          <div className="flex-1">
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{jogo.awayTeam}</p>
            <input
              type="number"
              min={0}
              max={99}
              value={away}
              onChange={(e) => setAway(e.target.value)}
              className="input-base w-16 text-center text-lg font-mono"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {(jogo.options ?? []).map((opt) => (
            <button
              key={opt}
              onClick={() => setOption(opt)}
              className="px-4 py-2 rounded-lg text-sm transition-all"
              style={{
                background: option === opt ? "var(--accent-dim)" : "var(--bg-card)",
                color: option === opt ? "var(--accent)" : "var(--text-secondary)",
                border: option === opt ? "1px solid var(--accent)" : "1px solid var(--border)",
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-xs mt-2" style={{ color: "var(--red)" }}>{error}</p>}

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleSave}
          disabled={saving || (isSports ? (home === "" || away === "") : !option)}
          className="btn-primary text-sm flex-1"
        >
          {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Salvar palpite"}
        </button>
        <button
          onClick={onClose}
          className="btn-ghost text-sm px-3"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── Resultado Form (Admin) ───────────────────────────────────────────────────

function ResultadoForm({
  jogo,
  slug,
  onClose,
  onSaved,
}: {
  jogo: Jogo
  slug: string
  onClose: () => void
  onSaved: () => void
}) {
  const [home, setHome] = useState<string>("")
  const [away, setAway] = useState<string>("")
  const [option, setOption] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSports = !!jogo.homeTeam

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const body = isSports
        ? { resultHome: parseInt(home), resultAway: parseInt(away) }
        : { resultOption: option }

      const res = await fetch(`/api/bolaos/${slug}/jogos/${jogo.id}/resultado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar resultado")
      onSaved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
      <p className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
        Preencher resultado
      </p>

      {isSports ? (
        <div className="flex items-center gap-3">
          <div className="flex-1 text-right">
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{jogo.homeTeam}</p>
            <input
              type="number"
              min={0}
              max={99}
              value={home}
              onChange={(e) => setHome(e.target.value)}
              className="input-base w-16 text-center text-lg font-mono"
            />
          </div>
          <span className="font-mono text-lg" style={{ color: "var(--text-muted)" }}>×</span>
          <div className="flex-1">
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{jogo.awayTeam}</p>
            <input
              type="number"
              min={0}
              max={99}
              value={away}
              onChange={(e) => setAway(e.target.value)}
              className="input-base w-16 text-center text-lg font-mono"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {(jogo.options ?? []).map((opt) => (
            <button
              key={opt}
              onClick={() => setOption(opt)}
              className="px-4 py-2 rounded-lg text-sm transition-all"
              style={{
                background: option === opt ? "var(--accent-dim)" : "var(--bg-card)",
                color: option === opt ? "var(--accent)" : "var(--text-secondary)",
                border: option === opt ? "1px solid var(--accent)" : "1px solid var(--border)",
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-xs mt-2" style={{ color: "var(--red)" }}>{error}</p>}

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleSave}
          disabled={saving || (isSports ? (home === "" || away === "") : !option)}
          className="btn-primary text-sm flex-1"
          style={{ background: "var(--green)", borderColor: "var(--green)" }}
        >
          {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Confirmar resultado"}
        </button>
        <button onClick={onClose} className="btn-ghost text-sm px-3">Cancelar</button>
      </div>
    </div>
  )
}

// ─── Create Jogo Modal ────────────────────────────────────────────────────────

function CreateJogoModal({
  slug,
  bolaoType,
  onClose,
  onCreated,
}: {
  slug: string
  bolaoType: "SPORTS" | "CUSTOM"
  onClose: () => void
  onCreated: () => void
}) {
  const [type, setType] = useState<"SPORTS" | "CUSTOM">(bolaoType)
  const [homeTeam, setHomeTeam] = useState("")
  const [awayTeam, setAwayTeam] = useState("")
  const [name, setName] = useState("")
  const [options, setOptions] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [phase, setPhase] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const body =
        type === "SPORTS"
          ? { type, homeTeam: homeTeam.trim(), awayTeam: awayTeam.trim(), scheduledAt, phase: phase.trim() || undefined }
          : {
              type,
              name: name.trim(),
              options: options.split("\n").map((s) => s.trim()).filter(Boolean),
              scheduledAt,
              phase: phase.trim() || undefined,
            }

      const res = await fetch(`/api/bolaos/${slug}/jogos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar jogo")
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
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Adicionar Jogo
          </h2>
          <button onClick={onClose} className="text-sm" style={{ color: "var(--text-muted)" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Type toggle (only if bolão is SPORTS, allow custom too) */}
          <div className="grid grid-cols-2 gap-2">
            {(["SPORTS", "CUSTOM"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className="p-2 rounded-lg text-sm transition-all"
                style={{
                  background: type === t ? "var(--accent-dim)" : "var(--bg)",
                  color: type === t ? "var(--accent)" : "var(--text-secondary)",
                  border: type === t ? "1px solid var(--accent)" : "1px solid var(--border)",
                }}
              >
                {t === "SPORTS" ? "⚽ Com placar" : "🗳️ Opções"}
              </button>
            ))}
          </div>

          {type === "SPORTS" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Time da casa</label>
                <input
                  className="input-base w-full"
                  placeholder="Ex: Brasil"
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Time visitante</label>
                <input
                  className="input-base w-full"
                  placeholder="Ex: Argentina"
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  required
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Pergunta</label>
                <input
                  className="input-base w-full"
                  placeholder="Ex: Quem vence o BBB?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                  Opções (uma por linha, mín. 2)
                </label>
                <textarea
                  className="input-base w-full resize-none"
                  rows={4}
                  placeholder={"Lula\nBolsonaro\nOutro"}
                  value={options}
                  onChange={(e) => setOptions(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Data e hora</label>
            <input
              type="datetime-local"
              className="input-base w-full"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Fase (opcional)</label>
            <input
              className="input-base w-full"
              placeholder="Ex: Fase de Grupos, Semifinal..."
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
            />
          </div>

          {error && <p className="text-sm" style={{ color: "var(--red)" }}>{error}</p>}

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Criar Jogo"}
          </button>
        </form>
      </div>
    </div>
  )
}
