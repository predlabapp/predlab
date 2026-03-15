"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Link } from "@/navigation"
import { ArrowLeft, Users, Calendar, Plus, Loader2, Trash2, Settings } from "lucide-react"
import { BolaoRanking } from "@/components/bolaos/BolaoRanking"
import { BolaoInvite } from "@/components/bolaos/BolaoInvite"
import { AddPredictionToBolao } from "@/components/bolaos/AddPredictionToBolao"
import { CATEGORIES, getProbabilityColor, formatDate } from "@/lib/utils"

interface BolaoData {
  bolao: {
    id: string
    name: string
    description: string | null
    coverEmoji: string
    slug: string
    inviteCode: string | null
    endsAt: string | null
    isPublic: boolean
    creatorId: string
    memberCount: number
  }
  myRole: "ADMIN" | "MEMBER" | null
  isMember: boolean
  ranking: any[]
  predictions: any[]
}

export default function BolaoPage() {
  const params = useParams()
  const slug = params?.slug as string
  const { data: session } = useSession()
  const [data, setData] = useState<BolaoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddPrediction, setShowAddPrediction] = useState(false)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  async function load() {
    try {
      const res = await fetch(`/api/bolaos/${slug}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar bolão")
      setData(json)
      setInviteCode(json.bolao.inviteCode)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [slug])

  async function handleJoin() {
    if (!data?.bolao.inviteCode) return
    setJoining(true)
    try {
      const res = await fetch(`/api/bolaos/join/${data.bolao.inviteCode}`, { method: "POST" })
      if (res.ok) await load()
    } finally {
      setJoining(false)
    }
  }

  async function handleRemovePrediction(predictionId: string) {
    if (!confirm("Remover esta previsão do bolão?")) return
    await fetch(`/api/bolaos/${slug}/predictions/${predictionId}`, { method: "DELETE" })
    await load()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-lg mb-4" style={{ color: "var(--red)" }}>{error ?? "Bolão não encontrado."}</p>
        <Link href="/dashboard/bolaos" className="btn-ghost">Voltar aos Bolões</Link>
      </div>
    )
  }

  const { bolao, myRole, isMember, ranking, predictions } = data
  const isAdmin = myRole === "ADMIN"
  const currentUserId = session?.user?.id ?? null
  const existingPredictionIds = predictions.map((p: any) => p.predictionId)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      {/* Back */}
      <Link
        href="/dashboard/bolaos"
        className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: "var(--text-muted)" }}
      >
        <ArrowLeft size={14} />
        Os meus Bolões
      </Link>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-start gap-4">
          <div
            className="text-4xl w-14 h-14 flex items-center justify-center rounded-2xl flex-shrink-0"
            style={{ background: "var(--bg)", fontSize: 32 }}
          >
            {bolao.coverEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {bolao.name}
              </h1>
              {isAdmin && (
                <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
                  admin
                </span>
              )}
              {!bolao.isPublic && (
                <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: "rgba(85,85,112,0.2)", color: "var(--text-muted)" }}>
                  privado
                </span>
              )}
            </div>
            {bolao.description && (
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{bolao.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                <Users size={12} />
                {bolao.memberCount} membros
              </span>
              {bolao.endsAt && (
                <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Calendar size={12} />
                  Encerra em {formatDate(bolao.endsAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Join / Invite */}
        <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          {!isMember ? (
            <button onClick={handleJoin} disabled={joining} className="btn-primary">
              {joining ? <Loader2 size={16} className="animate-spin" /> : "Entrar no Bolão"}
            </button>
          ) : inviteCode ? (
            <BolaoInvite
              inviteCode={inviteCode}
              slug={slug}
              isAdmin={isAdmin}
              onRegenerate={setInviteCode}
            />
          ) : null}
        </div>
      </div>

      {/* Ranking */}
      <div className="card mb-6">
        <h2 className="font-display font-semibold text-lg mb-4" style={{ color: "var(--text-primary)" }}>
          Ranking
        </h2>
        <BolaoRanking ranking={ranking} currentUserId={currentUserId} />
      </div>

      {/* Predictions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
            Previsões do Bolão
          </h2>
          {isMember && (
            <button
              onClick={() => setShowAddPrediction(true)}
              className="btn-ghost flex items-center gap-1.5 text-sm"
            >
              <Plus size={14} />
              Adicionar
            </button>
          )}
        </div>

        {predictions.length === 0 ? (
          <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
            <p className="text-sm">Nenhuma previsão partilhada ainda.</p>
            {isMember && (
              <button onClick={() => setShowAddPrediction(true)} className="btn-primary mt-3 text-sm">
                Partilhar a primeira previsão
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {predictions.map((p: any) => {
              const cat = CATEGORIES[p.prediction.category as keyof typeof CATEGORIES]
              const canRemove = isAdmin || p.addedById === currentUserId
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                >
                  <div
                    className="font-mono text-sm font-bold w-10 text-center flex-shrink-0"
                    style={{ color: getProbabilityColor(p.prediction.probability) }}
                  >
                    {p.prediction.probability}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {p.prediction.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {cat?.emoji} {cat?.label} · por {p.addedByName}
                      {p.prediction.resolution && (
                        <span
                          className="ml-2 font-mono"
                          style={{
                            color: p.prediction.resolution === "CORRECT" ? "var(--green)" :
                                   p.prediction.resolution === "INCORRECT" ? "var(--red)" : "var(--yellow)"
                          }}
                        >
                          {p.prediction.resolution}
                        </span>
                      )}
                    </p>
                  </div>
                  {canRemove && (
                    <button
                      onClick={() => handleRemovePrediction(p.predictionId)}
                      className="p-1.5 rounded-md transition-colors"
                      style={{ color: "var(--text-muted)" }}
                      onMouseOver={(e) => { e.currentTarget.style.color = "var(--red)" }}
                      onMouseOut={(e) => { e.currentTarget.style.color = "var(--text-muted)" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAddPrediction && (
        <AddPredictionToBolao
          slug={slug}
          existingPredictionIds={existingPredictionIds}
          onClose={() => setShowAddPrediction(false)}
          onAdded={() => { setShowAddPrediction(false); load() }}
        />
      )}
    </div>
  )
}
