"use client"

import { useState, useEffect, useCallback } from "react"
import { CATEGORIES } from "@/lib/utils"
import type { RankingEntry } from "@/app/api/rankings/route"
import { Trophy, Flame, Coins, TrendingUp, Medal } from "lucide-react"
import { Category } from "@prisma/client"

type TabType = "global_score" | "category" | "coins" | "streak"
type Period = "alltime" | "year" | "month" | "week"

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "global_score", label: "Score Global", icon: Trophy },
  { id: "category", label: "Por Categoria", icon: TrendingUp },
  { id: "coins", label: "Coins", icon: Coins },
  { id: "streak", label: "Streak", icon: Flame },
]

const PERIODS: { id: Period; label: string }[] = [
  { id: "alltime", label: "Sempre" },
  { id: "year", label: "Este ano" },
  { id: "month", label: "Este mês" },
  { id: "week", label: "Esta semana" },
]

function levelLabel(level: number) {
  const LEVELS = [
    { level: 1, emoji: "🌱" },
    { level: 2, emoji: "📚" },
    { level: 3, emoji: "🔍" },
    { level: 4, emoji: "🧠" },
    { level: 5, emoji: "🦅" },
    { level: 6, emoji: "🔮" },
  ]
  return LEVELS.find((l) => l.level === level)?.emoji ?? "🌱"
}

function scoreLabel(tab: TabType, score: number): string {
  if (tab === "coins") return `${score.toLocaleString()} PC`
  if (tab === "streak") return `${score} dias`
  return `${score}%`
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold bg-[rgba(251,191,36,0.15)] text-[var(--yellow)]">
        🥇
      </span>
    )
  if (rank === 2)
    return (
      <span className="w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold bg-[rgba(156,163,175,0.15)] text-[#9ca3af]">
        🥈
      </span>
    )
  if (rank === 3)
    return (
      <span className="w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold bg-[rgba(180,120,70,0.15)] text-[#b47846]">
        🥉
      </span>
    )
  return (
    <span className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-mono font-bold text-[var(--text-muted)]">
      {rank}
    </span>
  )
}

function EntryRow({
  entry,
  tab,
}: {
  entry: RankingEntry
  tab: TabType
}) {
  const displayName = entry.name ?? entry.username ?? "Utilizador"

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
        entry.isCurrentUser
          ? "border-[var(--accent)] bg-[var(--accent-glow)]"
          : "border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-bright)]"
      }`}
    >
      <RankBadge rank={entry.rank} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--text-primary)] truncate">
            {displayName}
            {entry.isCurrentUser && (
              <span className="ml-1.5 text-xs text-[var(--accent)]">(tu)</span>
            )}
          </span>
          <span className="text-xs shrink-0">{levelLabel(entry.level)}</span>
        </div>
        {entry.resolved != null && (
          <p className="text-xs text-[var(--text-muted)] font-mono">
            {entry.correct}/{entry.resolved} acertos
          </p>
        )}
      </div>

      <span
        className="text-sm font-bold font-mono shrink-0"
        style={{ color: entry.isCurrentUser ? "var(--accent)" : "var(--text-primary)" }}
      >
        {scoreLabel(tab, entry.score)}
      </span>
    </div>
  )
}

export function RankingsClient() {
  const [tab, setTab] = useState<TabType>("global_score")
  const [period, setPeriod] = useState<Period>("alltime")
  const [category, setCategory] = useState<Category>("TECHNOLOGY")
  const [entries, setEntries] = useState<RankingEntry[]>([])
  const [me, setMe] = useState<RankingEntry | null>(null)
  const [loading, setLoading] = useState(true)

  const hasPeriod = tab === "global_score" || tab === "category"

  const fetchRankings = useCallback(async () => {
    setLoading(true)
    const type =
      tab === "category" ? `category_${category}` : tab
    const params = new URLSearchParams({ type, period })
    const res = await fetch(`/api/rankings?${params}`)
    if (res.ok) {
      const data = await res.json()
      setEntries(data.entries)
      setMe(data.me)
    }
    setLoading(false)
  }, [tab, period, category])

  useEffect(() => {
    fetchRankings()
  }, [fetchRankings])

  const meOutside = me && !entries.find((e) => e.isCurrentUser)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold gradient-text mb-1">Rankings</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Os melhores forecasters da comunidade
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs rounded-md transition-all ${
              tab === t.id
                ? "bg-[var(--accent)] text-white font-medium"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <t.icon size={13} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Category selector */}
      {tab === "category" && (
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="input-base mb-4"
        >
          {Object.entries(CATEGORIES).map(([key, val]) => (
            <option key={key} value={key}>
              {val.emoji} {val.label}
            </option>
          ))}
        </select>
      )}

      {/* Period filter */}
      {hasPeriod && (
        <div className="flex gap-1.5 mb-5">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                period === p.id
                  ? "bg-[var(--accent-dim)] text-[var(--accent)] font-medium border border-[var(--accent)]"
                  : "text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--border-bright)]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] animate-pulse"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <Medal size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">
            {hasPeriod && period !== "alltime"
              ? "Ainda não há previsões resolvidas neste período."
              : "Ainda não há dados suficientes para este ranking."}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {tab === "global_score" || tab === "category"
              ? "Resolve pelo menos 10 previsões para aparecer aqui."
              : ""}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <EntryRow key={entry.userId} entry={entry} tab={tab} />
          ))}
        </div>
      )}

      {/* Current user outside top N */}
      {(tab === "global_score" || tab === "category") && !loading && (
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          {meOutside && me ? (
            <>
              <p className="text-xs text-[var(--text-muted)] mb-2 text-center">A tua posição</p>
              <EntryRow entry={me} tab={tab} />
            </>
          ) : !me && !entries.find((e) => e.isCurrentUser) ? (
            <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-dashed border-[var(--border)]">
              <span className="text-sm">🏅</span>
              <p className="text-xs text-[var(--text-muted)]">
                <span className="text-[var(--yellow)] font-mono font-medium">Em qualificação</span>
                {" "}· Precisa de 10 previsões verificadas pelo Polymarket para entrar no ranking
              </p>
            </div>
          ) : null}
        </div>
      )}

      {!loading && (tab === "global_score" || tab === "category") && (
        <div className="mt-5 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-center">
          <p className="text-xs text-[var(--text-muted)]">
            ⚡ Rankings usam apenas previsões verificadas automaticamente pelo Polymarket · mínimo 10 para qualificar
          </p>
        </div>
      )}
    </div>
  )
}
