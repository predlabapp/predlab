import { OrbReason } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { awardOrbs, getLevelProgress } from "@/lib/orbs"
import { awardBadge, checkAndAwardBadges } from "@/lib/badges"

export { awardOrbs, awardBadge, checkAndAwardBadges }
export { BADGE_DEFS as BADGES } from "@/lib/badges"

// ---------------------------------------------------------------------------
// Level info (compatibilidade)
// ---------------------------------------------------------------------------

export const LEVELS = [
  { level: 1, label: "Iniciante",    emoji: "🌱", minXP: 0 },
  { level: 2, label: "Aprendiz",     emoji: "📚", minXP: 500 },
  { level: 3, label: "Analista",     emoji: "🔍", minXP: 1500 },
  { level: 4, label: "Estrategista", emoji: "🧠", minXP: 4000 },
  { level: 5, label: "Visionário",   emoji: "🦅", minXP: 10000 },
  { level: 6, label: "Oráculo",      emoji: "🔮", minXP: 25000 },
]

export function getLevelInfo(level: number) {
  return LEVELS.find((l) => l.level === level) ?? LEVELS[0]
}

export { getLevelProgress }

// ---------------------------------------------------------------------------
// Streak
// ---------------------------------------------------------------------------

const STREAK_MILESTONES: Record<number, { orbs: number; badge?: string }> = {
  3:   { orbs: 30 },
  7:   { orbs: 100, badge: "streak_7" },
  30:  { orbs: 500, badge: "streak_30" },
  100: { orbs: 2000, badge: "streak_100" },
}

export async function updateStreak(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, longestStreak: true, lastActivityAt: true },
  })
  if (!user) return

  const now = new Date()
  const last = user.lastActivityAt

  let newStreak = 1
  if (last) {
    const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return
    if (diffDays === 1) newStreak = user.currentStreak + 1
  }

  const newLongest = Math.max(newStreak, user.longestStreak)

  await prisma.user.update({
    where: { id: userId },
    data: { currentStreak: newStreak, longestStreak: newLongest, lastActivityAt: now },
  })

  const milestone = STREAK_MILESTONES[newStreak]
  if (milestone) {
    await awardOrbs(
      userId,
      milestone.orbs,
      OrbReason.STREAK_MILESTONE,
      `🔥 Streak de ${newStreak} dias!`
    )
    if (milestone.badge) await awardBadge(userId, milestone.badge)
  } else if (newStreak > 0 && newStreak % 3 === 0) {
    await awardOrbs(userId, 30, OrbReason.STREAK_BONUS, `🔥 ${newStreak} dias seguidos!`)
  }
}

// ---------------------------------------------------------------------------
// On prediction created
// ---------------------------------------------------------------------------

export async function onPredictionCreated(
  userId: string,
  predictionId: string
): Promise<void> {
  await Promise.all([
    updateStreak(userId),
    awardOrbs(userId, 5, OrbReason.PREDICTION_CORRECT, "📝 Previsão criada", predictionId),
  ])

  const count = await prisma.prediction.count({ where: { userId } })
  if (count === 1) {
    await awardOrbs(userId, 50, OrbReason.FIRST_PREDICTION, "🎯 Primeira previsão! Bom começo.", predictionId)
    await awardBadge(userId, "first_prediction")
  }

  await checkAndAwardBadges(userId)
}

// ---------------------------------------------------------------------------
// On prediction resolved
// ---------------------------------------------------------------------------

export async function onPredictionResolved(
  userId: string,
  predictionId: string,
  resolution: string,
  probability: number,
  _coinsAllocated: number | null
): Promise<void> {
  await updateStreak(userId)

  if (resolution === "CORRECT") {
    await awardOrbs(userId, 50, OrbReason.PREDICTION_CORRECT, "✅ Previsão correcta!", predictionId)

    // Bónus de precisão (prob muito próxima do resultado = chutou alto e acertou)
    const error = Math.abs(probability / 100 - 1)
    if (error < 0.10) {
      await awardOrbs(userId, 100, OrbReason.PREDICTION_EXACT, "🎯 Previsão muito precisa!", predictionId)
      await awardBadge(userId, "sharp_shooter")
    }
  } else if (resolution === "INCORRECT") {
    await awardOrbs(userId, -10, OrbReason.PREDICTION_INCORRECT, "❌ Previsão incorrecta", predictionId)
  }

  await checkAndAwardBadges(userId)
}
