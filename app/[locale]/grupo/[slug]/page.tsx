"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Link } from "@/navigation"
import { ArrowLeft, Users, Loader2, Copy, Check } from "lucide-react"
import { GrupoRanking } from "@/components/grupos/GrupoRanking"
import { GrupoMercadosList } from "@/components/grupos/GrupoMercadosList"

interface GrupoData {
  grupo: {
    id: string
    name: string
    description: string | null
    coverEmoji: string
    slug: string
    inviteCode: string | null
    isPublic: boolean
    creatorId: string
    memberCount: number
  }
  myRole: "ADMIN" | "MEMBER" | null
  isMember: boolean
  ranking: any[]
  members: { userId: string; name: string; image: string | null; role: string; joinedAt: string }[]
}

type Tab = "mercados" | "ranking" | "membros"

export default function GrupoPage() {
  const params = useParams()
  const slug = params?.slug as string
  const { data: session } = useSession()
  const [data, setData] = useState<GrupoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>("mercados")
  const [joining, setJoining] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/grupos/${slug}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar grupo")
      setData(json)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  async function handleJoin() {
    if (!data?.grupo.inviteCode) return
    setJoining(true)
    try {
      const res = await fetch(`/api/grupos/join/${data.grupo.inviteCode}`, { method: "POST" })
      if (res.ok) await load()
    } finally {
      setJoining(false)
    }
  }

  async function copyInviteLink() {
    if (!data?.grupo.inviteCode) return
    const url = `${window.location.origin}/grupo/join/${data.grupo.inviteCode}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
        <p className="text-lg mb-4" style={{ color: "var(--red)" }}>{error ?? "Grupo não encontrado."}</p>
        <Link href="/grupos" className="btn-ghost">Voltar aos Grupos</Link>
      </div>
    )
  }

  const { grupo, myRole, isMember, ranking, members } = data
  const isAdmin = myRole === "ADMIN"
  const currentUserId = session?.user?.id ?? null

  const tabs: { key: Tab; label: string }[] = [
    { key: "mercados", label: "Mercados" },
    { key: "ranking", label: "Ranking" },
    { key: "membros", label: `Membros (${grupo.memberCount})` },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <Link
        href="/grupos"
        className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: "var(--text-muted)" }}
      >
        <ArrowLeft size={14} />
        Meus Grupos
      </Link>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-start gap-4">
          <div
            className="text-4xl w-14 h-14 flex items-center justify-center rounded-2xl flex-shrink-0"
            style={{ background: "var(--bg)", fontSize: 32 }}
          >
            {grupo.coverEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {grupo.name}
              </h1>
              {isAdmin && (
                <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
                  admin
                </span>
              )}
              {!grupo.isPublic && (
                <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: "rgba(85,85,112,0.2)", color: "var(--text-muted)" }}>
                  privado
                </span>
              )}
            </div>
            {grupo.description && (
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{grupo.description}</p>
            )}
            <span className="flex items-center gap-1 text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              <Users size={12} />
              {grupo.memberCount} membros
            </span>
          </div>
        </div>

        {/* Join / Invite */}
        <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          {!isMember ? (
            <button onClick={handleJoin} disabled={joining} className="btn-primary">
              {joining ? <Loader2 size={16} className="animate-spin" /> : "Entrar no Grupo"}
            </button>
          ) : grupo.inviteCode ? (
            <div className="flex items-center gap-2">
              <input
                readOnly
                className="input-base flex-1 text-xs font-mono"
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/grupo/join/${grupo.inviteCode}`}
              />
              <button
                onClick={copyInviteLink}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors flex-shrink-0"
                style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
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
        {activeTab === "mercados" && (
          <GrupoMercadosList
            slug={slug}
            isMember={isMember}
            isAdmin={isAdmin}
            currentUserId={currentUserId}
          />
        )}

        {activeTab === "ranking" && (
          <GrupoRanking ranking={ranking} currentUserId={currentUserId} />
        )}

        {activeTab === "membros" && (
          <div className="flex flex-col gap-2">
            {members.map((m) => (
              <div
                key={m.userId}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
                >
                  {m.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {m.name}
                    {m.userId === currentUserId && (
                      <span className="ml-1 text-xs" style={{ color: "var(--text-muted)" }}>(você)</span>
                    )}
                  </p>
                </div>
                {m.role === "ADMIN" && (
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
                    admin
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
