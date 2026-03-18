# ORBS_SPEC.md — Sistema de Rewards com Orbs

## Visão geral

Orbs são a moeda interna do PredLab. Recompensam utilizadores por actividade,
acertos, streaks e engagement. Não têm valor monetário — são usados para
desbloquear cosméticos, badges e posições especiais.

O nome vem da bola de cristal do logo — cada Orb é um fragmento de previsão.

---

## Renomeação obrigatória

O schema actual usa `predictionCoins`. Renomear tudo para `orbs`:

```prisma
// ANTES              → DEPOIS
predictionCoins       → orbs
totalCoinsEarned      → totalOrbsEarned
totalCoinsLost        → totalOrbsLost
CoinTransaction       → OrbTransaction
```

---

## Schema Prisma — actualizar e completar

### Model User — campos a renomear/adicionar

```prisma
model User {
  // ... campos existentes ...

  // Orbs
  orbs            Int @default(500)    // saldo actual
  totalOrbsEarned Int @default(0)      // total ganho histórico
  totalOrbsLost   Int @default(0)      // total gasto histórico

  // Níveis e XP
  level           Int @default(1)
  xp              Int @default(0)

  // Streaks
  currentStreak   Int @default(0)
  longestStreak   Int @default(0)
  lastActivityAt  DateTime?

  // Relações
  orbTransactions OrbTransaction[]
  userBadges      UserBadge[]
}
```

---

### Model OrbTransaction (renomear de CoinTransaction)

```prisma
model OrbTransaction {
  id           String          @id @default(cuid())
  userId       String
  amount       Int             // positivo = ganhou, negativo = gastou
  reason       OrbReason
  description  String?         // texto amigável ex: "Previsão correcta!"
  predictionId String?         // ligado a uma previsão (opcional)
  createdAt    DateTime        @default(now())

  user User @relation(fields: [userId], references: [id])

  @@map("orb_transactions")
}

enum OrbReason {
  // Ganhos
  SIGNUP_BONUS          // bónus de criação de conta
  PREDICTION_CORRECT    // previsão correcta
  PREDICTION_EXACT      // previsão muito precisa (prob muito próxima do resultado)
  STREAK_BONUS          // bónus de streak
  STREAK_MILESTONE      // marco de streak (7, 30, 100 dias)
  LEVEL_UP              // subiu de nível
  FIRST_PREDICTION      // primeira previsão criada
  BOLAO_WIN             // ganhou bolão (1º lugar)
  BOLAO_TOP3            // top 3 num bolão
  DAILY_LOGIN           // login diário
  SHARE_PREDICTION      // partilhou previsão

  // Gastos
  BADGE_PURCHASE        // comprou badge na loja
  THEME_PURCHASE        // comprou tema premium
  BOOST_PURCHASE        // comprou boost (futuro)
}
```

---

### Model UserBadge (manter, melhorar)

```prisma
model UserBadge {
  id        String   @id @default(cuid())
  userId    String
  badgeKey  String   // ex: "streak_7", "first_correct", "oraculo"
  earnedAt  DateTime @default(now())
  source    BadgeSource @default(AUTOMATIC)

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, badgeKey])
  @@map("user_badges")
}

enum BadgeSource {
  AUTOMATIC   // conquistado automaticamente
  PURCHASED   // comprado com Orbs
}
```

---

## Tabela de ganhos de Orbs

```
Acção                              Orbs    Condição
─────────────────────────────────────────────────────
Criar conta                        +500    Uma vez
Primeira previsão criada           +50     Uma vez
Login diário                       +10     1x por dia
Criar previsão                     +5      Por previsão
Previsão correcta (prob ≥ 50%)     +50     Após resolução
Previsão muito precisa             +100    Erro < 10% do resultado
  ex: chutou 75%, resultado SIM
  → Brier score ≥ 0.90
Streak 3 dias                      +30     Marco
Streak 7 dias                      +100    Marco + badge
Streak 30 dias                     +500    Marco + badge especial
Streak 100 dias                    +2000   Marco + badge raro
Subir de nível                     +200    Por nível
Ganhar bolão (1º lugar)            +300    Por bolão
Top 3 num bolão                    +100    Por bolão
Partilhar previsão                 +20     1x por previsão
```

---

## Tabela de gastos de Orbs

```
Item                               Custo   Tipo
────────────────────────────────────────────────
Badge "Analista Verificado"        500     Cosmético
Badge "Oráculo de Ouro"            2000    Cosmético raro
Tema "Neon Purple"                 1000    Visual
Tema "Matrix Green"                1000    Visual
Tema "Solar Gold"                  1500    Visual
Frame de perfil "Cristal"          800     Visual
Frame de perfil "Chamas"           1200    Visual
```

---

## Níveis e XP

XP é ganho junto com Orbs mas são coisas separadas.
Cada acção ganha XP proporcional aos Orbs.

```
Nível   Nome           XP necessário
──────────────────────────────────────
1       🌱 Iniciante   0
2       📚 Aprendiz    500
3       🔍 Analista    1.500
4       🧠 Estrategista 4.000
5       🦅 Visionário  10.000
6       🔮 Oráculo     25.000
```

XP ganho = mesma quantidade que Orbs ganhos nessa acção.
Ex: ganhou +100 Orbs por previsão exacta → ganhou +100 XP também.

---

## Lógica de Streak

Streak conta dias consecutivos com pelo menos 1 actividade:
- Criar previsão, ou
- Resolver previsão, ou
- Votar num mercado de grupo, ou
- Login no app

```typescript
// lib/streak.ts
async function updateStreak(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const now = new Date()
  const lastActivity = user.lastActivityAt

  if (!lastActivity) {
    // Primeiro dia
    await setStreak(userId, 1, now)
    return
  }

  const diffDays = differenceInDays(now, lastActivity)

  if (diffDays === 0) {
    // Já teve actividade hoje — não faz nada
    return
  }

  if (diffDays === 1) {
    // Dia seguinte — incrementa streak
    const newStreak = user.currentStreak + 1
    await setStreak(userId, newStreak, now)
    await checkStreakMilestones(userId, newStreak)
    return
  }

  // Mais de 1 dia sem actividade — reset
  if (user.currentStreak > 0) {
    await awardOrbs(userId, -20, OrbReason.STREAK_BONUS,
      "Streak perdido 😢")
  }
  await setStreak(userId, 1, now)
}

async function checkStreakMilestones(userId: string, streak: number) {
  const milestones = { 3: 30, 7: 100, 30: 500, 100: 2000 }
  const badges = { 7: "streak_7", 30: "streak_30", 100: "streak_100" }

  if (milestones[streak]) {
    await awardOrbs(userId, milestones[streak],
      OrbReason.STREAK_MILESTONE,
      `🔥 Streak de ${streak} dias!`)
  }
  if (badges[streak]) {
    await awardBadge(userId, badges[streak])
  }
}
```

---

## Função core — awardOrbs

```typescript
// lib/orbs.ts

export async function awardOrbs(
  userId: string,
  amount: number,
  reason: OrbReason,
  description?: string,
  predictionId?: string
) {
  // 1. Criar transação
  await prisma.orbTransaction.create({
    data: { userId, amount, reason, description, predictionId }
  })

  // 2. Actualizar saldo e histórico
  await prisma.user.update({
    where: { id: userId },
    data: {
      orbs: { increment: amount },
      totalOrbsEarned: amount > 0 ? { increment: amount } : undefined,
      totalOrbsLost: amount < 0 ? { increment: Math.abs(amount) } : undefined,
      xp: amount > 0 ? { increment: amount } : undefined,
    }
  })

  // 3. Verificar level up
  await checkLevelUp(userId)
}

export async function spendOrbs(
  userId: string,
  amount: number,
  reason: OrbReason,
  description: string
): Promise<{ success: boolean; message?: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (user.orbs < amount) {
    return { success: false, message: "Orbs insuficientes" }
  }

  await awardOrbs(userId, -amount, reason, description)
  return { success: true }
}

async function checkLevelUp(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const levels = [0, 500, 1500, 4000, 10000, 25000]

  let newLevel = 1
  for (let i = levels.length - 1; i >= 0; i--) {
    if (user.xp >= levels[i]) { newLevel = i + 1; break }
  }

  if (newLevel > user.level) {
    await prisma.user.update({
      where: { id: userId },
      data: { level: newLevel }
    })
    await awardOrbs(userId, 200, OrbReason.LEVEL_UP,
      `🎉 Subiste para nível ${newLevel}!`)
    // Notificação de level up
    await createNotification(userId,
      `🎉 Novo nível! Chegaste a ${getLevelName(newLevel)}`)
  }
}
```

---

## Hooks de integração — onde chamar awardOrbs

### Ao criar conta
```typescript
// app/api/auth/[...nextauth]/route.ts — evento signIn
// ou no onboarding
await awardOrbs(userId, 500, OrbReason.SIGNUP_BONUS,
  "🔮 Bem-vindo ao PredLab! Aqui estão os teus primeiros Orbs.")
await awardBadge(userId, "newcomer")
await updateStreak(userId)
```

---

### Ao criar previsão
```typescript
// app/api/predictions/route.ts — POST
await awardOrbs(userId, 5, OrbReason.PREDICTION_CORRECT,
  "📝 Previsão criada")
await updateStreak(userId)

// Primeira previsão
const count = await prisma.prediction.count({ where: { userId } })
if (count === 1) {
  await awardOrbs(userId, 50, OrbReason.FIRST_PREDICTION,
    "🎯 Primeira previsão! Bom começo.")
  await awardBadge(userId, "first_prediction")
}
```

---

### Ao resolver previsão (automático ou manual)
```typescript
// lib/resolution.ts — chamado após resolução

async function onPredictionResolved(prediction: Prediction) {
  const isCorrect = checkIfCorrect(prediction)

  if (!isCorrect) return

  // Bónus base por acerto
  await awardOrbs(prediction.userId, 50, OrbReason.PREDICTION_CORRECT,
    "✅ Previsão correcta!")

  // Bónus extra por precisão (erro < 10%)
  const error = Math.abs(prediction.probability / 100 -
    (prediction.resolution === "CORRECT" ? 1 : 0))

  if (error < 0.10) {
    await awardOrbs(prediction.userId, 100, OrbReason.PREDICTION_EXACT,
      "🎯 Previsão muito precisa! Bónus de precisão.")
    await awardBadge(prediction.userId, "sharp_shooter")
  }

  await updateStreak(prediction.userId)
}
```

---

### Ao partilhar previsão
```typescript
// app/api/predictions/[id]/share/route.ts — POST
// (só 1x por previsão)
const alreadyShared = await checkAlreadyShared(userId, predictionId)
if (!alreadyShared) {
  await awardOrbs(userId, 20, OrbReason.SHARE_PREDICTION,
    "📤 Partilhaste uma previsão!")
}
```

---

## APIs necessárias

### GET /api/orbs
Saldo e histórico do utilizador autenticado.

```typescript
// Resposta
{
  orbs: number,
  totalEarned: number,
  totalLost: number,
  level: number,
  levelName: string,       // "Analista"
  xp: number,
  xpNextLevel: number,     // XP para próximo nível
  xpProgress: number,      // 0-100%
  currentStreak: number,
  longestStreak: number,
  recentTransactions: [{
    id, amount, reason, description,
    createdAt
  }]
}
```

---

### GET /api/orbs/transactions
Histórico completo de transações paginado.

```typescript
// Query: ?page=1&limit=20
// Resposta
{
  transactions: [{ id, amount, reason, description, createdAt }],
  total: number,
  page: number
}
```

---

### GET /api/badges
Badges do utilizador + badges disponíveis para comprar.

```typescript
// Resposta
{
  earned: [{ badgeKey, earnedAt, source }],
  available: [{
    key, name, description, emoji,
    cost: number | null,   // null = não comprável, só ganhar
    owned: boolean
  }]
}
```

---

### POST /api/orbs/spend
Gastar Orbs na loja.

```typescript
// Body
{
  item: string    // "badge_verificado" | "theme_neon" | etc.
}

// Resposta
{
  success: boolean,
  message?: string,   // "Orbs insuficientes"
  newBalance?: number
}
```

---

## Componentes de UI

### OrbBalance — mostrar na navbar

```
┌─────────────────────┐
│  🔮 1.240 Orbs      │
└─────────────────────┘
```

Mostrar sempre visível na navbar ao lado do avatar.
Ao clicar → abre `/dashboard/orbs`.

---

### OrbToast — animação ao ganhar

Quando utilizador ganha Orbs, mostrar toast animado:

```
┌──────────────────────────────────┐
│  🔮 +100 Orbs                   │
│  Previsão muito precisa! 🎯      │
└──────────────────────────────────┘
```

Toast aparece no canto inferior direito, dura 3 segundos.
Animação: slide up + fade out.

---

### LevelBadge — mostrar no perfil e rankings

```
🔍 Analista  ████████░░  65% para Estrategista
```

---

### StreakBadge — mostrar no dashboard

```
🔥 14 dias seguidos
Maior streak: 45 dias
```

---

## Página /dashboard/orbs

Carteira completa do utilizador.

```
┌──────────────────────────────────────────────────┐
│  🔮 Meus Orbs                                    │
│                                                  │
│        1.240 Orbs disponíveis                    │
│        Total ganho: 3.450  ·  Total gasto: 2.210 │
│                                                  │
│  Nível: 🔍 Analista                              │
│  ████████████████░░░░░░░░  65% → Estrategista   │
│                                                  │
│  🔥 Streak actual: 14 dias                       │
│     Recorde: 45 dias                             │
├──────────────────────────────────────────────────┤
│  📋 Histórico recente                            │
│                                                  │
│  +50   ✅ Previsão correcta         hoje 14h     │
│  +100  🎯 Previsão muito precisa    hoje 14h     │
│  +10   📅 Login diário              hoje 09h     │
│  +30   🔥 Streak de 3 dias!         ontem       │
│  +5    📝 Previsão criada           ontem       │
│  -500  🛍️ Badge "Analista"          3 dias      │
│                                                  │
│  [Ver histórico completo →]                      │
├──────────────────────────────────────────────────┤
│  🛍️ Loja de Orbs                                │
│                                                  │
│  [Badge Analista    500 🔮]  [Tema Neon  1000 🔮]│
│  [Badge Oráculo    2000 🔮]  [Tema Matrix 1000 🔮]│
└──────────────────────────────────────────────────┘
```

---

## Página /dashboard/badges

```
┌──────────────────────────────────────────────────┐
│  🏅 Meus Badges                                  │
├──────────────────────────────────────────────────┤
│  Conquistados (8)                                │
│                                                  │
│  🌱 Newcomer        Conta criada                 │
│  🎯 First Shot      Primeira previsão            │
│  🔥 On Fire         Streak de 7 dias             │
│  ✅ Sharp Shooter   Previsão com erro < 10%      │
│  ...                                             │
├──────────────────────────────────────────────────┤
│  Disponíveis para comprar                        │
│                                                  │
│  🔍 Analista Verificado   500 🔮  [Comprar]      │
│  🔮 Oráculo de Ouro      2000 🔮  [Comprar]      │
└──────────────────────────────────────────────────┘
```

---

## Lista completa de badges automáticos

```
Badge               Condição                      Emoji
────────────────────────────────────────────────────────
newcomer            Criar conta                   🌱
first_prediction    Primeira previsão             🎯
first_correct       Primeira previsão correcta    ✅
sharp_shooter       Erro < 10% numa previsão      🔫
streak_7            Streak de 7 dias              🔥
streak_30           Streak de 30 dias             🔥🔥
streak_100          Streak de 100 dias            ⚡
level_2             Atingir nível 2               📚
level_3             Atingir nível 3               🔍
level_4             Atingir nível 4               🧠
level_5             Atingir nível 5               🦅
level_6             Atingir nível 6               🔮
bolao_winner        Ganhar bolão                  🏆
contrarian          Divergência > 30% e acertar  🎲
centurian           100 previsões criadas         💯
oracle              50 previsões correctas        🔮
```

---

## Ficheiros a criar / modificar

| Ficheiro | Acção |
|----------|-------|
| `prisma/schema.prisma` | Renomear coins→orbs + adicionar OrbTransaction, UserBadge completos |
| `lib/orbs.ts` | **Criar** — funções awardOrbs, spendOrbs, checkLevelUp |
| `lib/streak.ts` | **Criar** — funções updateStreak, checkStreakMilestones |
| `lib/badges.ts` | **Criar** — funções awardBadge, getBadgeDefinitions |
| `lib/gamification.ts` | **Modificar** — usar novas funções de orbs.ts e streak.ts |
| `app/api/orbs/route.ts` | **Criar** — GET saldo e histórico |
| `app/api/orbs/transactions/route.ts` | **Criar** — GET histórico paginado |
| `app/api/orbs/spend/route.ts` | **Criar** — POST gastar Orbs |
| `app/api/badges/route.ts` | **Criar** — GET badges |
| `app/dashboard/orbs/page.tsx` | **Criar** — página carteira |
| `app/dashboard/badges/page.tsx` | **Criar** — página badges |
| `components/orbs/OrbBalance.tsx` | **Criar** — saldo na navbar |
| `components/orbs/OrbToast.tsx` | **Criar** — animação ao ganhar |
| `components/orbs/LevelBadge.tsx` | **Criar** — badge de nível |
| `components/orbs/StreakBadge.tsx` | **Criar** — badge de streak |
| `components/orbs/OrbHistory.tsx` | **Criar** — lista de transações |
| `components/orbs/OrbShop.tsx` | **Criar** — loja básica |
| `components/Navbar.tsx` | **Modificar** — adicionar OrbBalance |

---

## Ordem de implementação

### Bloco 1 — Base
1. Renomear schema: coins → orbs, CoinTransaction → OrbTransaction
2. Adicionar campos em falta (reason enum, description, badgeKey, source)
3. `npx prisma db push && npx prisma generate`

### Bloco 2 — Lógica core
4. Criar `lib/orbs.ts` com awardOrbs, spendOrbs, checkLevelUp
5. Criar `lib/streak.ts` com updateStreak, checkStreakMilestones
6. Criar `lib/badges.ts` com awardBadge, lista de badges
7. Actualizar `lib/gamification.ts` para usar as novas funções

### Bloco 3 — Hooks de integração
8. Signup → bónus de boas-vindas + badge newcomer
9. Criar previsão → +5 Orbs + streak + primeiro palpite
10. Resolver previsão → bónus correcta + bónus precisão
11. Partilhar previsão → +20 Orbs

### Bloco 4 — APIs
12. GET /api/orbs
13. GET /api/orbs/transactions
14. POST /api/orbs/spend
15. GET /api/badges

### Bloco 5 — UI
16. Componente OrbBalance na navbar
17. Componente OrbToast (animação)
18. Componente LevelBadge
19. Componente StreakBadge
20. Página /dashboard/orbs
21. Página /dashboard/badges
22. Componente OrbShop básico
