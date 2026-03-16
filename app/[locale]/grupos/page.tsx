"use client"

import { useState, useEffect } from "react"
import { Plus, Loader2, Brain } from "lucide-react"
import { GrupoCard } from "@/components/grupos/GrupoCard"
import { CreateGrupoModal } from "@/components/grupos/CreateGrupoModal"

interface GrupoSummary {
  id: string
  name: string
  slug: string
  coverEmoji: string
  memberCount: number
  totalMercados: number
  mercadosAbertos: number
  myRole: "ADMIN" | "MEMBER"
}

export default function GruposPage() {
  const [grupos, setGrupos] = useState<GrupoSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetch("/api/grupos")
      .then((r) => r.json())
      .then((data) => setGrupos(data.grupos ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Meus Grupos
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Mercados de probabilidade com amigos
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

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--text-muted)" }} />
        </div>
      ) : grupos.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl text-center"
          style={{ border: "1px dashed var(--border)", color: "var(--text-muted)" }}
        >
          <Brain size={40} className="mb-4" style={{ opacity: 0.4 }} />
          <p className="font-display text-lg mb-1" style={{ color: "var(--text-secondary)" }}>
            Você ainda não tem grupos
          </p>
          <p className="text-sm mb-4">
            Crie um grupo e convide amigos para prever o futuro juntos!
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            Criar Grupo
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {grupos.map((g) => (
            <GrupoCard key={g.id} grupo={g} />
          ))}
        </div>
      )}

      {showCreate && <CreateGrupoModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
