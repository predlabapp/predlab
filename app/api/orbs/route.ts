import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getLevelProgress, getLevelName } from "@/lib/orbs"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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
        take: 10,
        select: { id: true, amount: true, reason: true, description: true, createdAt: true },
      },
    },
  })

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { level, xpCurrent, xpNext, progress } = getLevelProgress(user.xp)

  return NextResponse.json({
    orbs: user.orbs,
    totalEarned: user.totalOrbsEarned,
    totalLost: user.totalOrbsLost,
    level,
    levelName: getLevelName(level),
    xp: user.xp,
    xpCurrent,
    xpNext,
    xpProgress: progress,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    recentTransactions: user.orbTransactions,
  })
}
