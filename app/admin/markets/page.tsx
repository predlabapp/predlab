"use client"

import { useState, useEffect } from "react"
import { Trash2, Plus, ToggleLeft, ToggleRight } from "lucide-react"
import { CATEGORIES } from "@/lib/utils"
import { Category } from "@prisma/client"

type Market = {
  id: string
  question: string
  probability: number
  category: Category
  endDate: string | null
  url: string | null
  active: boolean
  createdAt: string
}

const ADMIN_PASSWORD = typeof window !== "undefined"
  ? prompt("Admin password:") ?? ""
  : ""

export default function AdminMarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    question: "",
    probability: 50,
    category: "OTHER" as Category,
    endDate: "",
    url: "",
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ADMIN_PASSWORD}`,
  }

  async function load() {
    const res = await fetch("/api/admin/markets", { headers })
    if (res.ok) setMarkets(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg("")
    const res = await fetch("/api/admin/markets", {
      method: "POST",
      headers,
      body: JSON.stringify({
        question: form.question,
        probability: form.probability,
        category: form.category,
        endDate: form.endDate || null,
        url: form.url || null,
      }),
    })
    if (res.ok) {
      setMsg("✅ Mercado criado!")
      setForm({ question: "", probability: 50, category: "OTHER", endDate: "", url: "" })
      load()
    } else {
      setMsg("❌ Erro ao criar.")
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Apagar este mercado?")) return
    await fetch(`/api/admin/markets/${id}`, { method: "DELETE", headers })
    load()
  }

  async function handleToggle(id: string, active: boolean) {
    await fetch(`/api/admin/markets/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ active: !active }),
    })
    load()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" style={{ color: "var(--text-primary)" }}>
      <h1 className="font-display text-2xl font-bold mb-6">🛠️ Mercados Personalizados</h1>

      {/* Create form */}
      <div className="card mb-8">
        <h2 className="font-semibold mb-4">Criar novo mercado</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Pergunta *</label>
            <textarea
              value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
              className="input-base resize-none h-20 w-full"
              placeholder="ex: O Bitcoin vai atingir $150k antes de 2027?"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Probabilidade (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range" min={1} max={99} value={form.probability}
                  onChange={e => setForm(f => ({ ...f, probability: Number(e.target.value) }))}
                  className="flex-1"
                />
                <span className="font-mono text-sm w-10 text-right">{form.probability}%</span>
              </div>
            </div>

            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Categoria</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                className="input-base w-full"
              >
                {Object.entries(CATEGORIES).map(([key, val]) => (
                  <option key={key} value={key}>{val.emoji} {val.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Data de encerramento</label>
              <input
                type="date" value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="input-base w-full"
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>URL externo (opcional)</label>
              <input
                type="url" value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                className="input-base w-full"
                placeholder="https://..."
              />
            </div>
          </div>

          {msg && <p className="text-sm">{msg}</p>}

          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Plus size={15} />
            {saving ? "A criar..." : "Criar Mercado"}
          </button>
        </form>
      </div>

      {/* List */}
      <h2 className="font-semibold mb-3">Mercados existentes ({markets.length})</h2>
      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>A carregar...</p>
      ) : markets.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>Nenhum mercado criado ainda.</p>
      ) : (
        <div className="space-y-2">
          {markets.map(m => (
            <div key={m.id} className="card flex items-start gap-3" style={{ opacity: m.active ? 1 : 0.5 }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.question}</p>
                <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span className="font-mono">{m.probability}%</span>
                  <span>{CATEGORIES[m.category]?.emoji} {CATEGORIES[m.category]?.label}</span>
                  {m.endDate && <span>até {new Date(m.endDate).toLocaleDateString("pt-BR")}</span>}
                  <span style={{ color: m.active ? "var(--green)" : "var(--red)" }}>
                    {m.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleToggle(m.id, m.active)} title={m.active ? "Desactivar" : "Activar"}>
                  {m.active
                    ? <ToggleRight size={20} style={{ color: "var(--green)" }} />
                    : <ToggleLeft size={20} style={{ color: "var(--text-muted)" }} />
                  }
                </button>
                <button onClick={() => handleDelete(m.id)} title="Apagar">
                  <Trash2 size={16} style={{ color: "var(--red)" }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
