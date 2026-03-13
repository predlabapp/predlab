import { prisma } from "@/lib/prisma"

// ---------------------------------------------------------------------------
// Levels
// ---------------------------------------------------------------------------

export const LEVELS = [
  { level: 1, label: "Iniciante",    emoji: "🌱", minResolved: 0,   minScore: 0  },
  { level: 2, label: "Aprendiz",     emoji: "📚", minResolved: 10,  minScore: 0  },
  { level: 3, label: "Analista",     emoji: "🔍", minResolved: 25,  minScore: 55 },
  { level: 4, label: "Estrategista", emoji: "🧠", minResolved: 50,  minScore: 65 },
  { level: 5, label: "Visionário",   emoji: "🦅", minResolved: 100, minScore: 75 },
  { level: 6, label: "Oráculo",      emoji: "🔮", minResolved: 200, minScore: 85 },
]

export function calculateLevel(resolvedCount: number, score: number): number {
  let level = 1
  for (const def of LEVELS) {
    if (resolvedCount >= def.minResolved && score >= def.minScore) {
      level = def.level
    }
  }
  return level
}

export function getLevelInfo(level: number) {
  return LEVELS.find((l) => l.level === level) ?? LEVELS[0]
}

// ---------------------------------------------------------------------------
// XP per action
// ---------------------------------------------------------------------------

const XP_TABLE: Record<string, number> = {
  create_prediction:  10,
  resolve_prediction: 20,
  add_evidence:        5,
  streak_7:           50,
  streak_30:         150,
  badge_earned:       25,
}

export function xpForAction(action: string): number {
  return XP_TABLE[action] ?? 0
}

// ---------------------------------------------------------------------------
// Coins
// ---------------------------------------------------------------------------

export async function awardCoins(
  userId: string,
  amount: number,
  reason: string,
  predictionId?: string
): Promise<void> {
  await prisma.$transaction([
    prisma.coinTransaction.create({
      data: { userId, amount, reason, predictionId },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        predictionCoins: { increment: amount },
        ...(amount > 0
          ? { totalCoinsEarned: { increment: amount } }
          : { totalCoinsLost: { increment: Math.abs(amount) } }),
      },
    }),
  ])
}

// ---------------------------------------------------------------------------
// Streak
// ---------------------------------------------------------------------------

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
    const diffDays = Math.floor(
      (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (diffDays === 0) return // already counted today
    if (diffDays === 1) newStreak = user.currentStreak + 1
    // diffDays > 1 → streak reset to 1
  }

  const newLongest = Math.max(newStreak, user.longestStreak)

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActivityAt: now,
    },
  })

  // Streak milestone coin rewards
  if (newStreak === 7) await awardCoins(userId, 50, "streak_7")
  if (newStreak === 30) await awardCoins(userId, 200, "streak_30")
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

export const BADGES: Record<
  string,
  { label: string; emoji: string; coins: number; description: string }
> = {
  // Primeiros passos
  first_prediction:  { label: "Primeiro Palpite",   emoji: "🎯", coins: 100, description: "Criou a primeira previsão" },
  first_correct:     { label: "Primeiro Acerto",    emoji: "✅", coins: 100, description: "Primeira previsão CORRECT" },
  streak_7:          { label: "Uma Semana",          emoji: "📅", coins: 50,  description: "Streak de 7 dias" },

  // Acurácia
  on_fire:           { label: "Em Chamas",           emoji: "🔥", coins: 150, description: "5 acertos seguidos" },
  cold_blood:        { label: "Sangue Frio",         emoji: "❄️", coins: 200, description: "10 previsões sem INCORRECT" },
  rare_consistency:  { label: "Consistência Rara",   emoji: "💎", coins: 500, description: "Score > 80% com 50+ previsões" },
  elite:             { label: "Elite",               emoji: "🏆", coins: 1000, description: "Score > 90% com 100+ previsões" },

  // Ousadia
  eagle_flight:      { label: "Voo de Águia",        emoji: "🦅", coins: 300, description: "Acertou com probabilidade < 30%" },
  against_all:       { label: "Contra Tudo",         emoji: "💥", coins: 500, description: "Acertou com probabilidade < 15%" },
  oracle:            { label: "Oráculo",             emoji: "🤯", coins: 750, description: "3 acertos seguidos com prob < 30%" },

  // Volume
  analyst:           { label: "Analista",            emoji: "📊", coins: 100, description: "50 previsões criadas" },
  scientist:         { label: "Cientista",           emoji: "🔬", coins: 200, description: "100 previsões criadas" },
  visionary:         { label: "Visionário",          emoji: "🌌", coins: 400, description: "200 previsões criadas" },

  // Tempo
  long_term:         { label: "Longo Prazo",         emoji: "🌍", coins: 200, description: "Previsão resolvida com 1+ ano de antecedência" },
  patience:          { label: "Paciência",           emoji: "⏳", coins: 400, description: "Previsão resolvida com 2+ anos de antecedência" },

  // Temático
  brazil_focus:      { label: "Brasil em Foco",      emoji: "🇧🇷", coins: 100, description: "10 previsões de GEOPOLITICS resolvidas" },
  sports_analyst:    { label: "Analista Esportivo",  emoji: "⚽", coins: 100, description: "10 previsões de SPORTS resolvidas" },
  tech_guru:         { label: "Guru Tech",           emoji: "💻", coins: 100, description: "10 previsões de TECHNOLOGY resolvidas" },
  mental_trader:     { label: "Trader Mental",       emoji: "📈", coins: 100, description: "10 previsões de MARKETS ou ECONOMY resolvidas" },
  geopolitical:      { label: "Geopolítico",         emoji: "🌍", coins: 100, description: "10 previsões de GEOPOLITICS resolvidas" },
}

async function grantBadge(userId: string, badgeKey: string): Promise<boolean> {
  const def = BADGES[badgeKey]
  if (!def) return false

  try {
    await prisma.userBadge.create({ data: { userId, badgeKey } })
    await awardCoins(userId, def.coins, "badge_earned")
    return true
  } catch {
    // @@unique constraint — badge already earned
    return false
  }
}

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const awarded: string[] = []

  const [user, predictions, existingBadges] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, longestStreak: true },
    }),
    prisma.prediction.findMany({
      where: { userId },
      select: {
        resolution: true,
        probability: true,
        category: true,
        createdAt: true,
        resolvedAt: true,
      },
    }),
    prisma.userBadge.findMany({
      where: { userId },
      select: { badgeKey: true },
    }),
  ])

  if (!user) return []

  const earned = new Set(existingBadges.map((b) => b.badgeKey))
  const has = (key: string) => earned.has(key)
  const grant = async (key: string) => {
    if (!has(key) && (await grantBadge(userId, key))) {
      awarded.push(key)
      earned.add(key)
    }
  }

  const total = predictions.length
  const resolved = predictions.filter((p) => p.resolution)
  const correct = predictions.filter((p) => p.resolution === "CORRECT")
  const incorrect = predictions.filter((p) => p.resolution === "INCORRECT")

  // --- Primeiros passos ---
  if (total >= 1) await grant("first_prediction")
  if (correct.length >= 1) await grant("first_correct")
  if (user.longestStreak >= 7) await grant("streak_7")

  // --- Volume ---
  if (total >= 50) await grant("analyst")
  if (total >= 100) await grant("scientist")
  if (total >= 200) await grant("visionary")

  // --- Acurácia ---
  const scorePercent = resolved.length > 0
    ? (correct.length / resolved.length) * 100
    : 0

  if (resolved.length >= 50 && scorePercent >= 80) await grant("rare_consistency")
  if (resolved.length >= 100 && scorePercent >= 90) await grant("elite")

  // Sangue Frio: 10 previsões sem INCORRECT (nas últimas 10 resolvidas)
  const last10 = resolved.slice(-10)
  if (last10.length === 10 && last10.every((p) => p.resolution !== "INCORRECT")) {
    await grant("cold_blood")
  }

  // Em Chamas: 5 acertos seguidos (nas últimas 5 resolvidas)
  const last5 = resolved.slice(-5)
  if (last5.length === 5 && last5.every((p) => p.resolution === "CORRECT")) {
    await grant("on_fire")
  }

  // --- Ousadia ---
  const correctLow30 = correct.filter((p) => p.probability < 30)
  const correctLow15 = correct.filter((p) => p.probability < 15)

  if (correctLow30.length >= 1) await grant("eagle_flight")
  if (correctLow15.length >= 1) await grant("against_all")

  // Oráculo: 3 acertos seguidos com prob < 30
  const lastCorrects = correct.slice(-3)
  if (
    lastCorrects.length === 3 &&
    lastCorrects.every((p) => p.probability < 30)
  ) {
    await grant("oracle")
  }

  // --- Tempo ---
  for (const p of correct) {
    if (!p.resolvedAt) continue
    const months =
      (p.resolvedAt.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
    if (months >= 24) { await grant("patience"); break }
    if (months >= 12) { await grant("long_term"); break }
  }

  // --- Temático ---
  const resolvedByCategory = (cat: string) =>
    resolved.filter((p) => p.resolution === "CORRECT" && p.category === cat).length

  if (resolvedByCategory("SPORTS") >= 10) await grant("sports_analyst")
  if (resolvedByCategory("TECHNOLOGY") >= 10) await grant("tech_guru")
  if (resolvedByCategory("GEOPOLITICS") >= 10) {
    await grant("brazil_focus")
    await grant("geopolitical")
  }
  const marketsResolved =
    resolvedByCategory("MARKETS") + resolvedByCategory("ECONOMY")
  if (marketsResolved >= 10) await grant("mental_trader")

  return awarded
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
    prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: xpForAction("create_prediction") } },
    }),
  ])

  // First prediction bonus
  const count = await prisma.prediction.count({ where: { userId } })
  if (count === 1) {
    await awardCoins(userId, 100, "first_prediction", predictionId)
  }

  await checkAndAwardBadges(userId)
  await syncLevel(userId)
}

// ---------------------------------------------------------------------------
// On prediction resolved
// ---------------------------------------------------------------------------

export async function onPredictionResolved(
  userId: string,
  predictionId: string,
  resolution: string,
  probability: number,
  coinsAllocated: number | null
): Promise<void> {
  await Promise.all([
    updateStreak(userId),
    prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: xpForAction("resolve_prediction") } },
    }),
  ])

  if (resolution === "CORRECT") {
    let base = 100
    if (probability < 50) base = 200
    if (probability < 30) base = 500

    const total = base + (coinsAllocated ?? 0)
    await awardCoins(userId, total, "prediction_correct", predictionId)

    if (coinsAllocated && coinsAllocated > 0) {
      await prisma.prediction.update({
        where: { id: predictionId },
        data: { coinsResult: total },
      })
    }
  } else if (resolution === "INCORRECT" && coinsAllocated && coinsAllocated > 0) {
    await awardCoins(userId, -coinsAllocated, "prediction_incorrect", predictionId)
    await prisma.prediction.update({
      where: { id: predictionId },
      data: { coinsResult: -coinsAllocated },
    })
  }

  await checkAndAwardBadges(userId)
  await syncLevel(userId)
}

// ---------------------------------------------------------------------------
// Sync level based on resolved count + score
// ---------------------------------------------------------------------------

async function syncLevel(userId: string): Promise<void> {
  const [resolved, correct] = await Promise.all([
    prisma.prediction.count({ where: { userId, resolution: { not: null } } }),
    prisma.prediction.count({ where: { userId, resolution: "CORRECT" } }),
  ])

  const score = resolved > 0 ? (correct / resolved) * 100 : 0
  const newLevel = calculateLevel(resolved, score)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { level: true },
  })
  if (!user) return

  if (newLevel > user.level) {
    await prisma.user.update({
      where: { id: userId },
      data: { level: newLevel },
    })
    await awardCoins(userId, 200, "level_up")
  }
}
