import { BadgeSource, OrbReason } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { awardOrbs } from "@/lib/orbs"

export type BadgeDef = {
  label: string
  emoji: string
  description: string
  orbs: number          // 0 = não dá orbs automáticos
  purchasable?: boolean
  cost?: number
}

export const BADGE_DEFS: Record<string, BadgeDef> = {
  // Automáticos
  newcomer:          { label: "Newcomer",            emoji: "🌱", description: "Conta criada",                      orbs: 0 },
  first_prediction:  { label: "First Shot",          emoji: "🎯", description: "Primeira previsão criada",          orbs: 50 },
  first_correct:     { label: "Primeiro Acerto",     emoji: "✅", description: "Primeira previsão correcta",        orbs: 50 },
  sharp_shooter:     { label: "Sharp Shooter",       emoji: "🔫", description: "Erro < 10% numa previsão",          orbs: 100 },
  streak_7:          { label: "On Fire",             emoji: "🔥", description: "Streak de 7 dias",                  orbs: 100 },
  streak_30:         { label: "Imparável",           emoji: "🔥🔥", description: "Streak de 30 dias",              orbs: 500 },
  streak_100:        { label: "Lendário",            emoji: "⚡", description: "Streak de 100 dias",                orbs: 2000 },
  level_2:           { label: "Aprendiz",            emoji: "📚", description: "Nível 2 atingido",                  orbs: 0 },
  level_3:           { label: "Analista",            emoji: "🔍", description: "Nível 3 atingido",                  orbs: 0 },
  level_4:           { label: "Estrategista",        emoji: "🧠", description: "Nível 4 atingido",                  orbs: 0 },
  level_5:           { label: "Visionário",          emoji: "🦅", description: "Nível 5 atingido",                  orbs: 0 },
  level_6:           { label: "Oráculo",             emoji: "🔮", description: "Nível 6 atingido",                  orbs: 0 },
  bolao_winner:      { label: "Campeão",             emoji: "🏆", description: "Ganhou um bolão",                   orbs: 0 },
  contrarian:        { label: "Contrarian",          emoji: "🎲", description: "Divergência > 30% e acertou",       orbs: 0 },
  centurian:         { label: "Centurião",           emoji: "💯", description: "100 previsões criadas",             orbs: 0 },
  oracle:            { label: "Oráculo",             emoji: "🔮", description: "50 previsões correctas",            orbs: 0 },
  on_fire:           { label: "Em Chamas",           emoji: "🔥", description: "5 acertos seguidos",               orbs: 0 },
  eagle_flight:      { label: "Voo de Águia",        emoji: "🦅", description: "Acertou com prob < 30%",           orbs: 0 },

  // Comprável
  badge_verificado:  { label: "Analista Verificado", emoji: "🔍", description: "Badge premium",  orbs: 0, purchasable: true, cost: 500 },
  badge_oraculo:     { label: "Oráculo de Ouro",     emoji: "🔮", description: "Badge raro",     orbs: 0, purchasable: true, cost: 2000 },
}

export async function awardBadge(
  userId: string,
  badgeKey: string,
  source: BadgeSource = BadgeSource.AUTOMATIC
): Promise<boolean> {
  const def = BADGE_DEFS[badgeKey]
  if (!def) return false

  try {
    await prisma.userBadge.create({ data: { userId, badgeKey, source } })
  } catch {
    return false // já tem
  }

  if (def.orbs > 0) {
    await awardOrbs(
      userId,
      def.orbs,
      OrbReason.BADGE_EARNED,
      `${def.emoji} Badge conquistado: ${def.label}`
    )
  }

  return true
}

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const awarded: string[] = []

  const [user, predictions, existingBadges] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, longestStreak: true, level: true },
    }),
    prisma.prediction.findMany({
      where: { userId },
      select: { resolution: true, probability: true, category: true, createdAt: true, resolvedAt: true },
    }),
    prisma.userBadge.findMany({ where: { userId }, select: { badgeKey: true } }),
  ])

  if (!user) return []

  const earned = new Set(existingBadges.map((b) => b.badgeKey))
  const grant = async (key: string) => {
    if (!earned.has(key) && (await awardBadge(userId, key))) {
      awarded.push(key)
      earned.add(key)
    }
  }

  const total = predictions.length
  const resolved = predictions.filter((p) => p.resolution)
  const correct = predictions.filter((p) => p.resolution === "CORRECT")

  if (total >= 1)   await grant("first_prediction")
  if (total >= 100) await grant("centurian")
  if (correct.length >= 1)  await grant("first_correct")
  if (correct.length >= 50) await grant("oracle")

  if (user.longestStreak >= 7)   await grant("streak_7")
  if (user.longestStreak >= 30)  await grant("streak_30")
  if (user.longestStreak >= 100) await grant("streak_100")

  if (user.level >= 2) await grant("level_2")
  if (user.level >= 3) await grant("level_3")
  if (user.level >= 4) await grant("level_4")
  if (user.level >= 5) await grant("level_5")
  if (user.level >= 6) await grant("level_6")

  const last5 = resolved.slice(-5)
  if (last5.length === 5 && last5.every((p) => p.resolution === "CORRECT")) {
    await grant("on_fire")
  }

  if (correct.some((p) => p.probability < 30)) await grant("eagle_flight")

  return awarded
}
