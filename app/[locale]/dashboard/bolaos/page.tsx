"use client"

import { useState, useEffect } from "react"
import { Plus, Loader2, Users } from "lucide-react"
import { BolaoCard } from "@/components/bolaos/BolaoCard"
import { CreateBolaoModal } from "@/components/bolaos/CreateBolaoModal"

interface BolaoSummary {
  id: string
  name: string
  slug: string
  coverEmoji: string
  memberCount: number
  myRole: "ADMIN" | "MEMBER"
  myPosition: number | null
  myScore: number
  topForecaster: { name: string; score: number } | null
  recentActivity: number
}

export default function BolaosPage() {
  const [bolaos, setBolaos] = useState<BolaoSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetch("/api/bolaos")
      .then((r) => r.json())
      .then((data) => setBolaos(data.bolaos ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Os meus Bolões
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Grupos de previsão com amigos e comunidades
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Criar</span>
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--text-muted)" }} />
        </div>
      ) : bolaos.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl text-center"
          style={{ border: "1px dashed var(--border)", color: "var(--text-muted)" }}
        >
          <Users size={40} className="mb-4" style={{ opacity: 0.4 }} />
          <p className="font-display text-lg mb-1" style={{ color: "var(--text-secondary)" }}>
            Ainda não tens bolões
          </p>
          <p className="text-sm mb-4">
            Cria o primeiro e convida os teus amigos!
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            Criar Bolão
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {bolaos.map((b) => (
            <BolaoCard key={b.id} bolao={b} />
          ))}
        </div>
      )}

      {showCreate && <CreateBolaoModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
