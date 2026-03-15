"use client"

import { useState } from "react"
import Image from "next/image"
import { Loader2, Shield, UserMinus, Share2 } from "lucide-react"

interface Member {
  userId: string
  name: string
  image: string | null
  nickname: string | null
  role: "ADMIN" | "MEMBER"
  joinedAt?: string
}

interface Props {
  slug: string
  members: Member[]
  currentUserId: string | null
  creatorId: string
  isAdmin: boolean
  inviteCode: string | null
  onRefresh: () => void
}

export function BolaoMembers({ slug, members, currentUserId, creatorId, isAdmin, inviteCode, onRefresh }: Props) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [copiedShare, setCopiedShare] = useState(false)

  async function handlePromote(userId: string, name: string) {
    if (!confirm(`Promover ${name} a admin?`)) return
    setActionLoading(`promote-${userId}`)
    await fetch(`/api/bolaos/${slug}/members/${userId}/promote`, { method: "POST" })
    await onRefresh()
    setActionLoading(null)
  }

  async function handleRemove(userId: string, name: string) {
    const isSelf = userId === currentUserId
    if (!confirm(isSelf ? "Tens a certeza que queres sair deste bolão?" : `Remover ${name} do bolão?`)) return
    setActionLoading(`remove-${userId}`)
    await fetch(`/api/bolaos/${slug}/members/${userId}`, { method: "DELETE" })
    if (isSelf) {
      // Redirect after leaving
      window.location.href = "/dashboard/bolaos"
    } else {
      await onRefresh()
      setActionLoading(null)
    }
  }

  async function handleCopyShareLink() {
    const url = `${window.location.origin}/bolao/${slug}`
    await navigator.clipboard.writeText(url)
    setCopiedShare(true)
    setTimeout(() => setCopiedShare(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary + share */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {members.length} membro{members.length !== 1 ? "s" : ""}
          {" · "}
          {members.filter((m) => m.role === "ADMIN").length} admin{members.filter((m) => m.role === "ADMIN").length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={handleCopyShareLink}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: "var(--bg)", border: "1px solid var(--border)", color: copiedShare ? "var(--accent)" : "var(--text-muted)" }}
        >
          <Share2 size={12} />
          {copiedShare ? "Copiado!" : "Partilhar bolão"}
        </button>
      </div>

      {/* Member list */}
      <div className="flex flex-col gap-2">
        {members.map((m) => {
          const isMe = m.userId === currentUserId
          const isCreator = m.userId === creatorId
          const canPromote = isAdmin && !isCreator && m.role !== "ADMIN"
          const canRemove = (isAdmin && !isCreator) || isMe

          return (
            <div
              key={m.userId}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: isMe ? "var(--accent-glow)" : "var(--bg)",
                border: `1px solid ${isMe ? "var(--accent-dim)" : "var(--border)"}`,
              }}
            >
              {/* Avatar */}
              {m.image ? (
                <Image src={m.image} alt={m.name} width={36} height={36} className="rounded-full flex-shrink-0" />
              ) : (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
                >
                  {m.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm" style={{ color: isMe ? "var(--accent)" : "var(--text-primary)" }}>
                    {m.nickname ?? m.name}
                  </span>
                  {isMe && (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>(você)</span>
                  )}
                  {m.role === "ADMIN" && (
                    <span
                      className="flex items-center gap-1 font-mono text-xs px-1.5 py-0.5 rounded"
                      style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
                    >
                      <Shield size={10} />
                      admin
                    </span>
                  )}
                  {isCreator && (
                    <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                      criador
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {canPromote && (
                  <button
                    onClick={() => handlePromote(m.userId, m.name)}
                    disabled={actionLoading === `promote-${m.userId}`}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                    style={{ background: "rgba(124,106,247,0.1)", border: "1px solid var(--accent-dim)", color: "var(--accent)" }}
                    title="Promover a admin"
                  >
                    {actionLoading === `promote-${m.userId}` ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <><Shield size={11} /> Admin</>
                    )}
                  </button>
                )}
                {canRemove && (
                  <button
                    onClick={() => handleRemove(m.userId, m.name)}
                    disabled={actionLoading === `remove-${m.userId}`}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                    style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "var(--red)" }}
                    title={isMe ? "Sair do bolão" : "Remover membro"}
                  >
                    {actionLoading === `remove-${m.userId}` ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <><UserMinus size={11} /> {isMe ? "Sair" : "Remover"}</>
                    )}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
