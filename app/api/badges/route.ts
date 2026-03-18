import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BADGE_DEFS } from "@/lib/badges"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userBadges = await prisma.userBadge.findMany({
    where: { userId: session.user.id },
    select: { badgeKey: true, source: true, earnedAt: true },
    orderBy: { earnedAt: "desc" },
  })

  const earned = new Set(userBadges.map((b) => b.badgeKey))

  const badges = Object.entries(BADGE_DEFS).map(([key, def]) => ({
    key,
    label: def.label,
    emoji: def.emoji,
    description: def.description,
    purchasable: def.purchasable ?? false,
    cost: def.cost ?? null,
    earned: earned.has(key),
    earnedAt: userBadges.find((b) => b.badgeKey === key)?.earnedAt ?? null,
    source: userBadges.find((b) => b.badgeKey === key)?.source ?? null,
  }))

  return NextResponse.json({ badges })
}
