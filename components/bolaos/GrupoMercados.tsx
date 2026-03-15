"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Loader2 } from "lucide-react"
import { GrupoMercadoCard } from "./GrupoMercadoCard"
import { CreateMercadoModal } from "./CreateMercadoModal"

interface Props {
  slug: string
  isMember: boolean
  currentUserId: string | null
  isAdmin: boolean
}

export function GrupoMercados({ slug, isMember, currentUserId, isAdmin }: Props) {
  const [mercados, setMercados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/bolaos/${slug}/mercados`)
    const data = await res.json()
    setMercados(data.mercados ?? [])
    setLoading(false)
  }, [slug])

  useEffect(() => { load() }, [load])

  const open = mercados.filter((m) => m.isOpen && !m.resolvedAt)
  const resolved = mercados.filter((m) => !!m.resolvedAt)

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          {mercados.length === 0 ? "Nenhum mercado ainda" : `${open.length} aberto${open.length !== 1 ? "s" : ""} · ${resolved.length} resolvido${resolved.length !== 1 ? "s" : ""}`}
        </p>
        {isMember && (
          <button
            onClick={() => setShowCreate(true)}
            className="btn-ghost flex items-center gap-1.5 text-sm"
          >
            <Plus size={14} />
            Criar mercado
          </button>
        )}
      </div>

      {/* Empty state */}
      {mercados.length === 0 && (
        <div className="text-center py-10" style={{ color: "var(--text-muted)" }}>
          <p className="text-sm mb-3">Nenhum mercado criado ainda.</p>
          {isMember && (
            <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
              Criar primeiro mercado
            </button>
          )}
        </div>
      )}

      {/* Open markets */}
      {open.length > 0 && (
        <div>
          <p className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: "var(--green)" }}>
            Abertos ({open.length})
          </p>
          <div className="flex flex-col gap-3">
            {open.map((m) => (
              <GrupoMercadoCard
                key={m.id}
                mercado={m}
                slug={slug}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onRefresh={load}
              />
            ))}
          </div>
        </div>
      )}

      {/* Resolved markets */}
      {resolved.length > 0 && (
        <div>
          <p className="text-xs font-mono uppercase tracking-wider mb-2 mt-2" style={{ color: "var(--text-muted)" }}>
            Resolvidos ({resolved.length})
          </p>
          <div className="flex flex-col gap-3">
            {resolved.map((m) => (
              <GrupoMercadoCard
                key={m.id}
                mercado={m}
                slug={slug}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onRefresh={load}
              />
            ))}
          </div>
        </div>
      )}

      {showCreate && (
        <CreateMercadoModal
          slug={slug}
          onClose={() => setShowCreate(false)}
          onCreated={load}
        />
      )}
    </div>
  )
}
