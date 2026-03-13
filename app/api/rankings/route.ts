import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateAccuracyScore } from "@/lib/utils"
import { Category, Resolution } from "@prisma/client"

export type RankingEntry = {
  rank: number
  userId: string
  name: string | null
  username: string | null
  level: number
  score: number
  resolved?: number
  correct?: number
  isCurrentUser: boolean
}

type Period = "week" | "month" | "year" | "alltime"
type RankType = "global_score" | "coins" | "streak" | `category_${string}`

function getPeriodStart(period: Period): Date | null {
  const now = new Date()
  if (period === "week") {
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0)
  }
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1)
  if (period === "year") return new Date(now.getFullYear(), 0, 1)
  return null
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = (searchParams.get("type") ?? "global_score") as RankType
  const period = (searchParams.get("period") ?? "alltime") as Period
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100)

  // --- Coins ranking (no period) ---
  if (type === "coins") {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, username: true, level: true, predictionCoins: true },
      orderBy: { predictionCoins: "desc" },
      take: limit,
    })

    const result: RankingEntry[] = users.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      name: u.name,
      username: u.username,
      level: u.level,
      score: u.predictionCoins,
      isCurrentUser: u.id === session.user.id,
    }))

    const myPos = await getMyPosition(session.user.id, result, () =>
      coinPosition(session.user.id, prisma)
    )
    return NextResponse.json({ entries: result, me: myPos })
  }

  // --- Streak ranking (no period) ---
  if (type === "streak") {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, username: true, level: true, longestStreak: true },
      orderBy: { longestStreak: "desc" },
      take: limit,
    })

    const result: RankingEntry[] = users.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      name: u.name,
      username: u.username,
      level: u.level,
      score: u.longestStreak,
      isCurrentUser: u.id === session.user.id,
    }))

    const myPos = await getMyPosition(session.user.id, result, () =>
      streakPosition(session.user.id, prisma)
    )
    return NextResponse.json({ entries: result, me: myPos })
  }

  // --- Score-based rankings (global or by category) ---
  const category = type.startsWith("category_")
    ? (type.replace("category_", "") as Category)
    : null
  const minResolved = category ? 5 : 10
  const periodStart = getPeriodStart(period)

  // Rankings only use AUTOMATIC (Polymarket-verified) resolutions
  const predictionWhere = {
    resolution: { not: null as Resolution | null },
    resolutionType: "AUTOMATIC" as const,
    ...(periodStart ? { resolvedAt: { gte: periodStart } } : {}),
    ...(category ? { category } : {}),
  }

  // Minimum 10 verified predictions to qualify
  const grouped = await prisma.prediction.groupBy({
    by: ["userId"],
    where: predictionWhere,
    _count: { id: true },
    having: { id: { _count: { gte: minResolved } } },
  })

  if (grouped.length === 0) {
    return NextResponse.json({ entries: [], me: null })
  }

  const userIds = grouped.map((g) => g.userId)

  // Fetch actual predictions to compute Brier score
  const predictions = await prisma.prediction.findMany({
    where: { userId: { in: userIds }, ...predictionWhere },
    select: { userId: true, probability: true, resolution: true },
  })

  // Group by user and compute scores
  const byUser = new Map<string, Array<{ probability: number; resolution: Resolution | null }>>()
  for (const p of predictions) {
    const arr = byUser.get(p.userId) ?? []
    arr.push(p)
    byUser.set(p.userId, arr)
  }

  const scored = Array.from(byUser.entries())
    .map(([userId, preds]) => {
      const resolved = preds.filter((p) => p.resolution !== null && p.resolution !== "CANCELLED")
      const correct = resolved.filter((p) => p.resolution === "CORRECT").length
      return {
        userId,
        score: calculateAccuracyScore(preds),
        resolved: resolved.length,
        correct,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  // Fetch user info
  const users = await prisma.user.findMany({
    where: { id: { in: scored.map((s) => s.userId) } },
    select: { id: true, name: true, username: true, level: true },
  })
  const userMap = new Map(users.map((u) => [u.id, u]))

  const result: RankingEntry[] = scored.map((s, i) => {
    const u = userMap.get(s.userId)
    return {
      rank: i + 1,
      userId: s.userId,
      name: u?.name ?? null,
      username: u?.username ?? null,
      level: u?.level ?? 1,
      score: s.score,
      resolved: s.resolved,
      correct: s.correct,
      isCurrentUser: s.userId === session.user.id,
    }
  })

  // Current user's position if outside top N
  const meInList = result.find((e) => e.isCurrentUser)
  let me: RankingEntry | null = meInList ?? null

  if (!meInList) {
    const myPreds = await prisma.prediction.findMany({
      where: { userId: session.user.id, ...predictionWhere, resolutionType: "AUTOMATIC" },
      select: { probability: true, resolution: true },
    })
    const myResolved = myPreds.filter(
      (p) => p.resolution !== null && p.resolution !== "CANCELLED"
    )
    if (myResolved.length >= minResolved) {
      const myScore = calculateAccuracyScore(myPreds)
      const myRank =
        scored.filter((s) => s.score > myScore).length + 1
      const myUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, username: true, level: true },
      })
      if (myUser) {
        me = {
          rank: myRank,
          userId: myUser.id,
          name: myUser.name,
          username: myUser.username,
          level: myUser.level,
          score: myScore,
          resolved: myResolved.length,
          correct: myResolved.filter((p) => p.resolution === "CORRECT").length,
          isCurrentUser: true,
        }
      }
    }
  }

  return NextResponse.json({ entries: result, me })
}

// Helpers for coin/streak positions
async function coinPosition(userId: string, db: typeof prisma) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, username: true, level: true, predictionCoins: true },
  })
  if (!user) return null
  const rank =
    (await db.user.count({ where: { predictionCoins: { gt: user.predictionCoins } } })) + 1
  return {
    rank,
    userId: user.id,
    name: user.name,
    username: user.username,
    level: user.level,
    score: user.predictionCoins,
    isCurrentUser: true,
  } as RankingEntry
}

async function streakPosition(userId: string, db: typeof prisma) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, username: true, level: true, longestStreak: true },
  })
  if (!user) return null
  const rank =
    (await db.user.count({ where: { longestStreak: { gt: user.longestStreak } } })) + 1
  return {
    rank,
    userId: user.id,
    name: user.name,
    username: user.username,
    level: user.level,
    score: user.longestStreak,
    isCurrentUser: true,
  } as RankingEntry
}

async function getMyPosition(
  userId: string,
  entries: RankingEntry[],
  fallback: () => Promise<RankingEntry | null>
): Promise<RankingEntry | null> {
  const inList = entries.find((e) => e.userId === userId)
  if (inList) return inList
  return fallback()
}
