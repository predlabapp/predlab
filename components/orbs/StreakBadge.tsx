type Props = {
  currentStreak: number
  longestStreak: number
  compact?: boolean
}

export function StreakBadge({ currentStreak, longestStreak, compact }: Props) {
  const emoji = currentStreak >= 30 ? "🔥🔥" : currentStreak >= 7 ? "🔥" : "📅"

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-mono">
        {emoji} {currentStreak}d
      </span>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xl">{emoji}</span>
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {currentStreak} {currentStreak === 1 ? "dia" : "dias"} seguidos
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Recorde: {longestStreak} dias
          </p>
        </div>
      </div>
    </div>
  )
}
