import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { PublicProfile } from "@/components/profile/PublicProfile"
import type { Metadata } from "next"
import { calculateAccuracyScore } from "@/lib/utils"

interface Props {
  params: { username: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: { name: true, username: true, bio: true },
  })

  if (!user) return { title: "Perfil — PredLab" }

  const displayName = user.name ?? user.username ?? "Forecaster"
  return {
    title: `${displayName} — PredLab`,
    description:
      user.bio ?? `Forecast Score e previsões de ${displayName} no PredLab.`,
  }
}

export default async function ProfilePage({ params }: Props) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    include: {
      predictions: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          probability: true,
          category: true,
          expiresAt: true,
          resolvedAt: true,
          resolution: true,
          isPublic: true,
          shareToken: true,
          polymarketProbability: true,
          tags: true,
          description: true,
          evidence: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          polymarketSlug: true,
          polymarketQuestion: true,
          polymarketUrl: true,
          polymarketUpdatedAt: true,
          resolutionType: true,
          coinsAllocated: true,
          coinsResult: true,
        },
      },
      badges: {
        orderBy: { earnedAt: "asc" },
        select: { badgeKey: true, earnedAt: true },
      },
    },
  })

  if (!user) notFound()

  return (
    <PublicProfile
      user={{
        id: user.id,
        name: user.name,
        username: user.username,
        bio: user.bio,
        level: user.level,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        predictionCoins: user.predictionCoins,
        predictions: user.predictions as any,
        badges: user.badges,
      }}
    />
  )
}
