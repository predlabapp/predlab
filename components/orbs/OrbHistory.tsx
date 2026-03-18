"use client"

import { useEffect, useState } from "react"

type Transaction = {
  id: string
  amount: number
  reason: string
  description: string | null
  createdAt: string
}

function formatRelative(date: string) {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffH = Math.floor(diffMs / (1000 * 60 * 60))
  const diffD = Math.floor(diffH / 24)

  if (diffH < 1) return "agora"
  if (diffH < 24) return `há ${diffH}h`
  if (diffD === 1) return "ontem"
  return `há ${diffD} dias`
}

type Props = {
  initialTransactions?: Transaction[]
  showLoadMore?: boolean
}

export function OrbHistory({ initialTransactions, showLoadMore }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions ?? [])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(initialTransactions?.length ?? 0)
  const [loading, setLoading] = useState(!initialTransactions)

  useEffect(() => {
    if (initialTransactions) return
    fetch("/api/orbs/transactions?page=1&limit=20")
      .then((r) => r.json())
      .then((d) => {
        setTransactions(d.transactions ?? [])
        setTotal(d.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const loadMore = async () => {
    const next = page + 1
    setLoading(true)
    const res = await fetch(`/api/orbs/transactions?page=${next}&limit=20`)
    const d = await res.json()
    setTransactions((prev) => [...prev, ...(d.transactions ?? [])])
    setTotal(d.total ?? 0)
    setPage(next)
    setLoading(false)
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: "var(--border)" }} />
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
        Ainda sem transações.
      </p>
    )
  }

  return (
    <div>
      <div className="space-y-1">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg"
            style={{ background: "var(--bg-card)" }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate" style={{ color: "var(--text-primary)" }}>
                {tx.description ?? tx.reason}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {formatRelative(tx.createdAt)}
              </p>
            </div>
            <span
              className="font-mono font-semibold text-sm ml-3 shrink-0"
              style={{ color: tx.amount > 0 ? "var(--green)" : "var(--red)" }}
            >
              {tx.amount > 0 ? "+" : ""}{tx.amount} 🔮
            </span>
          </div>
        ))}
      </div>

      {showLoadMore && transactions.length < total && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="mt-4 w-full py-2 text-sm rounded-lg transition-colors"
          style={{
            background: "var(--bg-card)",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
          }}
        >
          {loading ? "A carregar..." : `Ver mais (${total - transactions.length} restantes)`}
        </button>
      )}
    </div>
  )
}
