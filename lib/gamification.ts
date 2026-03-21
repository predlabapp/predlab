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
  await updateStreak(userId)

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

  // Fetch prediction details and user data in parallel
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [prediction, user, resolvedCount, correctCount, todayRewardCount] = await Promise.all([
    prisma.prediction.findUnique({
      where: { id: predictionId },
      select: { polymarketProbability: true, createdAt: true, expiresAt: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true, level: true },
    }),
    prisma.prediction.count({ where: { userId, resolution: { not: null } } }),
    prisma.prediction.count({ where: { userId, resolution: "CORRECT" } }),
    prisma.orbTransaction.count({
      where: {
        userId,
        reason: { in: [OrbReason.PREDICTION_CORRECT, OrbReason.PREDICTION_INCORRECT] },
        createdAt: { gte: todayStart },
      },
    }),
  ])

  if (!prediction || !user) return

  // --- Eligibility checks ---

  // 1. Account must be ≥30 days old
  const accountAgeDays = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (accountAgeDays < 30) return

  // 2. Must have ≥5 resolved predictions total
  if (resolvedCount < 5) return

  // 3. Accuracy ≥40%
  const accuracy = resolvedCount > 0 ? correctCount / resolvedCount : 0
  if (accuracy < 0.4) return

  // 4. No conviction zone: 45-55% probability
  if (probability >= 45 && probability <= 55) return

  // 5. Max 5 reward-eligible predictions per day
  if (todayRewardCount >= 5) return

  // --- Divergence and direction ---
  const polyProb = prediction.polymarketProbability

  let divergence = 0
  // Default: no market → treat as correct/incorrect directly
  let correctDirection = resolution === "CORRECT"

  if (polyProb !== null && polyProb !== undefined) {
    divergence = Math.abs(probability - polyProb)
    // Predicted above market → correct if event happened (CORRECT)
    // Predicted below market → correct if event didn't happen (INCORRECT)
    correctDirection = probability > polyProb
      ? resolution === "CORRECT"
      : resolution === "INCORRECT"
  }

  // --- Tier ---
  let baseReward: number
  let penalty: number
  let tierLabel: string

  if (divergence >= 20) {
    baseReward = 10; penalty = -3; tierLabel = "ousada"
  } else if (divergence >= 5) {
    baseReward = 3; penalty = -1; tierLabel = "neutra"
  } else {
    baseReward = 1; penalty = -1; tierLabel = "segura"
  }

  // --- Multipliers ---
  const levelMultiplier = user.level <= 2 ? 1.0 : user.level <= 4 ? 1.2 : 1.5

  const daysUntilExpiry = Math.floor(
    (prediction.expiresAt.getTime() - prediction.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  )
  const anticipationMultiplier =
    daysUntilExpiry > 180 ? 1.5 :
    daysUntilExpiry > 90  ? 1.25 :
    daysUntilExpiry > 30  ? 1.0 : 0.5

  // --- Award or penalize ---
  const marketLabel = polyProb != null ? `mercado ${Math.round(polyProb)}%` : "sem mercado"

  if (correctDirection) {
    const probMultiplier = probability / 100
    const finalReward = Math.max(1, Math.round(baseReward * probMultiplier * levelMultiplier * anticipationMultiplier))
    await awardOrbs(
      userId,
      finalReward,
      OrbReason.PREDICTION_CORRECT,
      `✅ Previsão ${tierLabel} correcta! (tu: ${probability}% vs ${marketLabel})`,
      predictionId
    )
  } else {
    await awardOrbs(
      userId,
      penalty,
      OrbReason.PREDICTION_INCORRECT,
      `❌ Previsão ${tierLabel} incorrecta (tu: ${probability}% vs ${marketLabel})`,
      predictionId
    )
  }

  await checkAndAwardBadges(userId)
}
