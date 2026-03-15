"use client"

import { useState } from "react"
import { Copy, Check, RefreshCw, Loader2 } from "lucide-react"

interface Props {
  inviteCode: string
  slug: string
  isAdmin: boolean
  onRegenerate?: (newCode: string) => void
}

export function BolaoInvite({ inviteCode, slug, isAdmin, onRegenerate }: Props) {
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : "https://predlab.app"}/bolao/join/${inviteCode}`

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRegenerate() {
    if (!confirm("Regenerar o código invalida o link anterior. Continuar?")) return
    setRegenerating(true)
    try {
      const res = await fetch(`/api/bolaos/${slug}/regenerate-invite`, { method: "POST" })
      const data = await res.json()
      if (res.ok && onRegenerate) {
        onRegenerate(data.inviteCode)
      }
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        Link de convite
      </p>
      <div className="flex gap-2">
        <div
          className="flex-1 px-3 py-2 rounded-lg font-mono text-xs truncate"
          style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
        >
          {inviteUrl}
        </div>
        <button
          onClick={handleCopy}
          className="px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm transition-colors"
          style={{ background: copied ? "var(--accent-dim)" : "var(--bg)", border: "1px solid var(--border)", color: copied ? "var(--accent)" : "var(--text-secondary)" }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copiado!" : "Copiar"}
        </button>
        {isAdmin && (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm transition-colors"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            title="Regenerar código"
          >
            {regenerating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          </button>
        )}
      </div>
    </div>
  )
}
