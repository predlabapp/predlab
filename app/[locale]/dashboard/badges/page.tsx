import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BADGE_DEFS } from "@/lib/badges"
import { ArrowLeft } from "lucide-react"
import { Link } from "@/navigation"

export default async function BadgesPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const [userBadges, user] = await Promise.all([
    prisma.userBadge.findMany({
      where: { userId: session.user.id },
      select: { badgeKey: true, source: true, earnedAt: true },
      orderBy: { earnedAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { orbs: true },
    }),
  ])

  const earned = new Set(userBadges.map((b) => b.badgeKey))

  const automatic = Object.entries(BADGE_DEFS).filter(([, d]) => !d.purchasable)
  const purchasable = Object.entries(BADGE_DEFS).filter(([, d]) => d.purchasable)

  const earnedList = automatic.filter(([key]) => earned.has(key))
  const lockedList = automatic.filter(([key]) => !earned.has(key))

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: "var(--text-muted)" }}
      >
        <ArrowLeft size={14} />
        Voltar
      </Link>

      <h1 className="font-display text-2xl font-bold mb-6">🏅 Meus Badges</h1>

      {/* Earned */}
      <section className="mb-6">
        <h2 className="text-sm font-mono uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          Conquistados ({earnedList.length})
        </h2>
        {earnedList.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>
            Ainda nenhum badge conquistado. Continue a criar previsões!
          </p>
        ) : (
          <div className="space-y-2">
            {earnedList.map(([key, def]) => {
              const badge = userBadges.find((b) => b.badgeKey === key)
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <span className="text-2xl">{def.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {def.label}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {def.description}
                    </p>
                  </div>
                  {badge && (
                    <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                      {badge.source === "PURCHASED" ? "🛍️ Comprado" : "✅ Automático"}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Locked */}
      {lockedList.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-mono uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            Por conquistar ({lockedList.length})
          </h2>
          <div className="space-y-2">
            {lockedList.map(([key, def]) => (
              <div
                key={key}
                className="flex items-center gap-3 px-4 py-3 rounded-lg"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  opacity: 0.45,
                }}
              >
                <span className="text-2xl grayscale">{def.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {def.label}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {def.description}
                  </p>
                </div>
                <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>🔒</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Purchasable */}
      <section>
        <h2 className="text-sm font-mono uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          Disponíveis para comprar
        </h2>
        <div className="space-y-2">
          {purchasable.map(([key, def]) => {
            const isOwned = earned.has(key)
            const canAfford = (user?.orbs ?? 0) >= (def.cost ?? 0)
            return (
              <div
                key={key}
                className="flex items-center gap-3 px-4 py-3 rounded-lg"
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${isOwned ? "var(--green)" : "var(--border)"}`,
                }}
              >
                <span className="text-2xl">{def.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {def.label}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {def.description}
                  </p>
                </div>
                {isOwned ? (
                  <span className="text-xs shrink-0" style={{ color: "var(--green)" }}>✅ Adquirido</span>
                ) : (
                  <Link
                    href="/dashboard/orbs"
                    className="shrink-0 px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-colors"
                    style={{
                      background: canAfford ? "var(--accent-dim)" : "var(--border)",
                      color: canAfford ? "var(--accent)" : "var(--text-muted)",
                    }}
                  >
                    {def.cost} 🔮
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
