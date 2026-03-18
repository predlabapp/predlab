type Props = {
  level: number
  levelName: string
  xpCurrent: number
  xpNext: number
  xpProgress: number
  compact?: boolean
}

export function LevelBadge({ level, levelName, xpCurrent, xpNext, xpProgress, compact }: Props) {
  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full"
        style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
      >
        {levelName}
      </span>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {levelName}
        </span>
        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          {xpCurrent.toLocaleString()} / {xpNext.toLocaleString()} XP
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border-bright)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${xpProgress}%`, background: "var(--accent)" }}
        />
      </div>
      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
        {xpProgress}% para o próximo nível
      </p>
    </div>
  )
}
