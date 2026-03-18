import { OrbReason } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export { OrbReason }

const LEVEL_XP = [0, 500, 1500, 4000, 10000, 25000]

export const LEVEL_NAMES: Record<number, string> = {
  1: "🌱 Iniciante",
  2: "📚 Aprendiz",
  3: "🔍 Analista",
  4: "🧠 Estrategista",
  5: "🦅 Visionário",
  6: "🔮 Oráculo",
}

export function getLevelName(level: number): string {
  return LEVEL_NAMES[level] ?? "🌱 Iniciante"
}

export function getLevelProgress(xp: number): {
  level: number
  xpCurrent: number
  xpNext: number
  progress: number
} {
  let level = 1
  for (let i = LEVEL_XP.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP[i]) { level = i + 1; break }
  }
  level = Math.min(level, 6)
  const xpCurrent = LEVEL_XP[level - 1] ?? 0
  const xpNext = LEVEL_XP[level] ?? LEVEL_XP[LEVEL_XP.length - 1]
  const progress = level >= 6 ? 100 : Math.round(((xp - xpCurrent) / (xpNext - xpCurrent)) * 100)
  return { level, xpCurrent: xp - xpCurrent, xpNext: xpNext - xpCurrent, progress }
}

export async function awardOrbs(
  userId: string,
  amount: number,
  reason: OrbReason,
  description?: string,
  predictionId?: string
): Promise<void> {
  await prisma.$transaction([
    prisma.orbTransaction.create({
      data: { userId, amount, reason, description, predictionId },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        orbs: { increment: amount },
        xp: amount > 0 ? { increment: amount } : undefined,
        ...(amount > 0
          ? { totalOrbsEarned: { increment: amount } }
          : { totalOrbsLost: { increment: Math.abs(amount) } }),
      },
    }),
  ])

  if (amount > 0) await checkLevelUp(userId)
}

export async function spendOrbs(
  userId: string,
  amount: number,
  reason: OrbReason,
  description: string
): Promise<{ success: boolean; message?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { orbs: true },
  })
  if (!user || user.orbs < amount) {
    return { success: false, message: "Orbs insuficientes" }
  }
  await awardOrbs(userId, -amount, reason, description)
  return { success: true }
}

async function checkLevelUp(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, level: true },
  })
  if (!user) return

  const { level: newLevel } = getLevelProgress(user.xp)
  if (newLevel > user.level) {
    await prisma.user.update({
      where: { id: userId },
      data: { level: newLevel },
    })
    // award sem recursão — usa prisma directo
    await prisma.$transaction([
      prisma.orbTransaction.create({
        data: {
          userId,
          amount: 200,
          reason: OrbReason.LEVEL_UP,
          description: `🎉 Subiste para ${getLevelName(newLevel)}!`,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          orbs: { increment: 200 },
          xp: { increment: 200 },
          totalOrbsEarned: { increment: 200 },
        },
      }),
    ])
  }
}
