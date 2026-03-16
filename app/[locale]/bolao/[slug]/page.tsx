"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Link } from "@/navigation"
import { ArrowLeft, Users, Calendar, Loader2 } from "lucide-react"
import { BolaoRanking } from "@/components/bolaos/BolaoRanking"
import { BolaoJogos } from "@/components/bolaos/BolaoJogos"
import { BolaoInvite } from "@/components/bolaos/BolaoInvite"
import { BolaoPayments } from "@/components/bolaos/BolaoPayments"
import { BolaoMembers } from "@/components/bolaos/BolaoMembers"
import { formatDate } from "@/lib/utils"

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
    hasPrize: boolean
    type: "SPORTS" | "CUSTOM"
  }
  myRole: "ADMIN" | "MEMBER" | null
  isMember: boolean
  ranking: any[]
  members: { userId: string; name: string; image: string | null; nickname: string | null; role: "ADMIN" | "MEMBER"; joinedAt: string }[]
}

type Tab = "ranking" | "jogos" | "membros" | "pagamentos"

export default function BolaoPage() {
  const params = useParams()
  const slug = params?.slug as string
  const { data: session } = useSession()
  const [data, setData] = useState<BolaoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("ranking")

  const load = useCallback(async () => {
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
  }, [slug])

  useEffect(() => { load() }, [load])

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

  const { bolao, myRole, isMember, ranking, members } = data
  const isAdmin = myRole === "ADMIN"
  const currentUserId = session?.user?.id ?? null

  const tabs: { key: Tab; label: string }[] = [
    { key: "ranking", label: "Ranking" },
    { key: "jogos", label: "Jogos" },
    { key: "membros", label: `Membros (${bolao.memberCount})` },
    ...(bolao.hasPrize ? [{ key: "pagamentos" as Tab, label: "Pagamentos" }] : []),
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      {/* Back */}
      <Link
        href="/dashboard/bolaos"
        className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: "var(--text-muted)" }}
      >
        <ArrowLeft size={14} />
        Meus Bolões
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
              <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: "rgba(85,85,112,0.2)", color: "var(--text-muted)" }}>
                {bolao.type === "SPORTS" ? "⚽ Esportivo" : "🗳️ Personalizado"}
              </span>
              {!bolao.isPublic && (
                <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: "rgba(85,85,112,0.2)", color: "var(--text-muted)" }}>
                  privado
                </span>
              )}
            </div>
            {bolao.description && (
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{bolao.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                <Users size={12} />
                {bolao.memberCount} membros
              </span>
              {bolao.endsAt && (
                <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Calendar size={12} />
                  Encerra {formatDate(bolao.endsAt)}
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

      {/* Tabs */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
            style={{
              background: activeTab === tab.key ? "var(--accent-dim)" : "transparent",
              color: activeTab === tab.key ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="card">
        {activeTab === "ranking" && (
          <BolaoRanking
            ranking={ranking}
            currentUserId={currentUserId}
            showPayments={bolao.hasPrize}
          />
        )}

        {activeTab === "jogos" && (
          <BolaoJogos
            slug={slug}
            isAdmin={isAdmin}
            bolaoType={bolao.type}
            isMember={isMember}
          />
        )}

        {activeTab === "membros" && (
          <BolaoMembers
            slug={slug}
            members={members ?? []}
            currentUserId={currentUserId}
            creatorId={bolao.creatorId}
            isAdmin={isAdmin}
            inviteCode={inviteCode}
            onRefresh={load}
          />
        )}

        {activeTab === "pagamentos" && (
          <div>
            <h2 className="font-display font-semibold text-lg mb-4" style={{ color: "var(--text-primary)" }}>
              Pagamentos
            </h2>
            {isMember ? (
              <BolaoPayments
                slug={slug}
                isAdmin={isAdmin}
                currentUserId={currentUserId}
              />
            ) : (
              <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
                Apenas membros podem ver os pagamentos.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
