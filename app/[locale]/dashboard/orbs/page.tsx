import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getLevelProgress, getLevelName } from "@/lib/orbs"
import { ArrowLeft, Zap } from "lucide-react"
import { Link } from "@/navigation"
import { LevelBadge } from "@/components/orbs/LevelBadge"
import { StreakBadge } from "@/components/orbs/StreakBadge"
import { OrbHistory } from "@/components/orbs/OrbHistory"
import { OrbShop } from "@/components/orbs/OrbShop"

export default async function OrbsPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      orbs: true,
      totalOrbsEarned: true,
      totalOrbsLost: true,
      level: true,
      xp: true,
      currentStreak: true,
      longestStreak: true,
      orbTransactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, amount: true, reason: true, description: true, createdAt: true },
      },
    },
  })

  if (!user) return null

  const { level, xpCurrent, xpNext, progress } = getLevelProgress(user.xp)
  const levelName = getLevelName(level)

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

      <h1 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
        🔮 Meus Orbs
      </h1>

      {/* Balance card */}
      <div
        className="card mb-4 text-center py-6"
        style={{ background: "linear-gradient(135deg, var(--bg-card) 0%, rgba(124,106,247,0.08) 100%)" }}
      >
        <p className="font-mono text-5xl font-bold mb-1" style={{ color: "var(--accent)" }}>
          {user.orbs.toLocaleString()}
        </p>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Orbs disponíveis</p>

        <div className="flex justify-center gap-6 text-sm">
          <div>
            <p className="font-mono font-semibold" style={{ color: "var(--green)" }}>
              +{user.totalOrbsEarned.toLocaleString()}
            </p>
            <p style={{ color: "var(--text-muted)" }}>Total ganho</p>
          </div>
          <div className="w-px" style={{ background: "var(--border)" }} />
          <div>
            <p className="font-mono font-semibold" style={{ color: "var(--red)" }}>
              -{user.totalOrbsLost.toLocaleString()}
            </p>
            <p style={{ color: "var(--text-muted)" }}>Total gasto</p>
          </div>
        </div>
      </div>

      {/* Level + Streak row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={15} style={{ color: "var(--accent)" }} />
            <span className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Nível {level}
            </span>
          </div>
          <LevelBadge
            level={level}
            levelName={levelName}
            xpCurrent={xpCurrent}
            xpNext={xpNext}
            xpProgress={progress}
          />
        </div>

        <div className="card flex items-center">
          <StreakBadge currentStreak={user.currentStreak} longestStreak={user.longestStreak} />
        </div>
      </div>

      {/* Recent history */}
      <div className="mb-6">
        <h2 className="text-sm font-mono uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          📋 Histórico recente
        </h2>
        <OrbHistory
          initialTransactions={user.orbTransactions.map((t) => ({
            ...t,
            createdAt: t.createdAt.toISOString(),
          }))}
          showLoadMore
        />
      </div>

      {/* Shop */}
      <div>
        <h2 className="text-sm font-mono uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          🛍️ Loja de Orbs
        </h2>
        <OrbShop currentOrbs={user.orbs} />
      </div>
    </div>
  )
}
