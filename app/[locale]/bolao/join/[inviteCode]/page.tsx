"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useRouter, Link } from "@/navigation"
import { Loader2, Users, Calendar } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface BolaoInfo {
  name: string
  coverEmoji: string
  description: string | null
  memberCount: number
  endsAt: string | null
  slug: string
  isAlreadyMember: boolean
}

export default function JoinBolaoPage() {
  const params = useParams()
  const inviteCode = params?.inviteCode as string
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bolao, setBolao] = useState<BolaoInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/bolaos/join/${inviteCode}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setBolao(data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [inviteCode])

  async function handleJoin() {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/bolao/join/${inviteCode}`)
      return
    }
    setJoining(true)
    setError(null)
    try {
      const res = await fetch(`/api/bolaos/join/${inviteCode}`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao entrar no bolão")
      router.push(`/bolao/${bolao!.slug}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setJoining(false)
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    )
  }

  if (error || !bolao) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="text-4xl mb-4">🔮</div>
        <h1 className="font-display text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Convite inválido
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          {error ?? "Este link de convite não é válido ou já expirou."}
        </p>
        <Link href="/" className="btn-primary">
          Ir para o PredLab
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 animate-fade-in">
      <div
        className="w-full max-w-sm rounded-2xl p-8 text-center"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {/* Logo */}
        <div className="mb-6">
          <img src="/logo-horizontal.svg" alt="PredLab" height={36} className="mx-auto" style={{ height: 36 }} />
        </div>

        <p className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
          Foste convidado para
        </p>

        {/* Bolão info */}
        <div
          className="rounded-xl p-5 mb-6"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          <div className="text-4xl mb-3">{bolao.coverEmoji}</div>
          <h2 className="font-display text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            {bolao.name}
          </h2>
          {bolao.description && (
            <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>{bolao.description}</p>
          )}
          <div className="flex items-center justify-center gap-4">
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

        {bolao.isAlreadyMember ? (
          <div>
            <p className="text-sm mb-4" style={{ color: "var(--green)" }}>Já és membro deste bolão!</p>
            <Link href={`/bolao/${bolao.slug}`} className="btn-primary block">
              Ver Bolão
            </Link>
          </div>
        ) : session ? (
          <div>
            {error && <p className="text-sm mb-3" style={{ color: "var(--red)" }}>{error}</p>}
            <button onClick={handleJoin} disabled={joining} className="btn-primary w-full mb-3">
              {joining ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Entrar no Bolão →"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Link
              href={`/auth/signup?callbackUrl=/bolao/join/${inviteCode}`}
              className="btn-primary block text-center"
            >
              Criar conta grátis para participar
            </Link>
            <Link
              href={`/auth/signin?callbackUrl=/bolao/join/${inviteCode}`}
              className="btn-ghost block text-center text-sm"
            >
              Já tenho conta — Entrar
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
