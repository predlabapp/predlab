# STRATEGY.md — Visão Estratégica & Roadmap de Execução

## O que estamos a construir e porquê

O **Prediction Journal** não é apenas um app de previsões pessoais.
É a camada de treino e reputação que precede o mercado de previsões brasileiro.
É o Duolingo do pensamento probabilístico.

### O contexto de mercado (pesquisado em Março 2026)
- Polymarket e Kalshi dominam globalmente mas são em inglês, exigem cripto/cartão internacional
- No Brasil, ainda não existe nenhum player consolidado e autorizado
- Pelo menos 3 iniciativas brasileiras em desenvolvimento (a mais avançada em beta privado)
- A CVM acabou de aprovar os primeiros produtos preditivos para listagem no Brasil
- O Polymarket já tem 190+ mercados sobre o Brasil, incluindo a eleição de 2026

### O nosso posicionamento
Não somos concorrentes do Polymarket nem das iniciativas brasileiras.
Somos a **camada anterior** — onde os brasileiros aprendem a pensar probabilisticamente antes de colocar dinheiro real.

```
Prediction Journal (treino gratuito + gamificado)
         ↓
Utilizador ganha confiança + Forecast Score + Ranking
         ↓
Migra para plataforma real (parceria futura)
```

---

## Princípios de integridade (NÃO NEGOCIÁVEIS)

### 1. Previsões são imutáveis após criação
- Título, probabilidade, categoria, data de expiração: **read-only após criação**
- Endpoint PATCH rejeita alterações a estes campos com 403
- Remover da UI qualquer campo de edição destes dados

### 2. Janela de arrependimento de 10 minutos
- Único momento em que apagar é permitido: dentro de 10 minutos após `createdAt`
- Após 10 minutos: DELETE retorna 403
- UI mostra contador regressivo: "Pode apagar ainda por X min"
- Após 10 minutos: botão desaparece completamente

### 3. Resolução manual permitida, mas auditável
- Badge visual diferencia resolução manual vs automática via Polymarket:
  - `✓ Correto · resolvido pelo autor`
  - `✓ Correto · verificado automaticamente ⚡`

### 4. O que PODE ser alterado após criação
- Adicionar notas/evidências (com timestamp visível)
- Tornar pública/privada (`isPublic`)
- Resolver (uma vez — não pode desfazer)

---

## Sistema de Gamificação — O Duolingo das Previsões

### Filosofia central
A **perda é mais motivadora que o ganho**.
Não é "ganha XP hoje". É "não percas o teu streak de 12 dias".
Cada mecânica deve criar urgência de voltar ao app.

---

### Níveis de Forecaster

```
Nível 1 — 🌱 Iniciante        0 previsões resolvidas
Nível 2 — 📚 Aprendiz         10 resolvidas
Nível 3 — 🔍 Analista         25 resolvidas + score > 55%
Nível 4 — 🧠 Estrategista     50 resolvidas + score > 65%
Nível 5 — 🦅 Visionário       100 resolvidas + score > 75%
Nível 6 — 🔮 Oráculo          200 resolvidas + score > 85%
```

O nível aparece no perfil público, nos cards de partilha, e nos rankings.

---

### Sistema de Streak

Ação que conta para o streak diário (qualquer uma):
- Criar uma nova previsão
- Resolver uma previsão expirada
- Adicionar evidência a uma previsão existente

Notificações:
- Streak em risco: *"🔥 O teu streak de 14 dias está em risco. Faz algo antes da meia-noite."*
- Streak perdido: *"😢 O teu streak de 14 dias acabou. Começa um novo hoje."*

---

### Conquistas / Badges

```
PRIMEIROS PASSOS
🎯 Primeiro Palpite          — criar primeira previsão
✅ Primeiro Acerto           — primeira previsão CORRECT
📅 Uma Semana               — streak de 7 dias

ACURÁCIA
🔥 Em Chamas                — 5 acertos seguidos
❄️ Sangue Frio              — 10 previsões sem nenhum INCORRECT
💎 Consistência Rara        — Forecast Score > 80% com 50+ previsões
🏆 Elite                    — Forecast Score > 90% com 100+ previsões

OUSADIA
🦅 Voo de Águia             — acertou com probabilidade < 30%
💥 Contra Tudo              — acertou com probabilidade < 15%
⚡ Contra o Mercado         — acertou com divergência > 40% do Polymarket
🤯 Oráculo                  — 3 acertos seguidos com prob < 30%

VOLUME
📊 Analista                 — 50 previsões criadas
🔬 Cientista                — 100 previsões criadas
🌌 Visionário               — 200 previsões criadas

TEMPO
🌍 Longo Prazo              — previsão resolvida com 1+ ano de antecedência
⏳ Paciência                — previsão resolvida com 2+ anos de antecedência

TEMÁTICO
🇧🇷 Brasil em Foco          — 10 previsões sobre eventos brasileiros
⚽ Analista Esportivo        — 10 previsões de esportes resolvidas
💻 Guru Tech                — 10 previsões de tecnologia resolvidas
📈 Trader Mental            — 10 previsões de mercados/economia resolvidas
🌍 Geopolítico              — 10 previsões de geopolítica resolvidas

SOCIAL
🌟 Influencer               — 100 visualizações no perfil público
📢 Viral                    — previsão partilhada 50+ vezes
🤝 Referência               — 10 utilizadores registados pelo teu link
```

Cada badge é partilhável individualmente nas redes sociais.

---

### Sistema de Coins (economia virtual completa)

#### Ganhar coins
| Ação | Coins |
|------|-------|
| Criar conta | +500 PC |
| Criar primeira previsão | +100 PC |
| Streak 7 dias | +50 PC |
| Streak 30 dias | +200 PC |
| CORRECT (prob 50-70%) | +100 PC base + coins apostados |
| CORRECT (prob 30-50%) | +200 PC base + coins apostados |
| CORRECT (prob < 30%) | +500 PC base + coins apostados |
| CORRECT automático (Polymarket) | bónus +50 PC |
| Badge conquistado | +25 a +500 PC (por raridade) |
| Subir de nível | +200 PC |
| Top 3 liga semanal | +500 PC |
| Top 1 liga semanal | +1000 PC |

#### Perder coins
| Situação | Coins |
|----------|-------|
| Previsão INCORRECT | -coins apostados |
| Streak perdido | -20 PC |

#### Gastar coins (prestígio — não pay-to-win)
| Item | Custo |
|------|-------|
| Badge de perfil exclusivo | 500 PC |
| Tema de perfil premium | 1000 PC |
| Destaque no feed público 24h | 200 PC |
| Moldura especial no card de partilha | 300 PC |

#### Schema Prisma a adicionar
```prisma
model User {
  // ... campos existentes ...
  predictionCoins     Int       @default(500)
  totalCoinsEarned    Int       @default(0)
  totalCoinsLost      Int       @default(0)
  currentStreak       Int       @default(0)
  longestStreak       Int       @default(0)
  lastActivityAt      DateTime?
  level               Int       @default(1)
  xp                  Int       @default(0)
  city                String?
  state               String?
  country             String?   @default("BR")
  badges              UserBadge[]
  coinTransactions    CoinTransaction[]
}

model Prediction {
  // ... campos existentes ...
  coinsAllocated      Int?
  coinsResult         Int?
  resolutionType      ResolutionType?
}

model UserBadge {
  id          String   @id @default(cuid())
  userId      String
  badgeKey    String
  earnedAt    DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
  @@unique([userId, badgeKey])
  @@map("user_badges")
}

model CoinTransaction {
  id           String   @id @default(cuid())
  userId       String
  amount       Int      // positivo = ganhou, negativo = perdeu
  reason       String   // "prediction_correct", "streak_7", "badge_earned", etc.
  predictionId String?
  createdAt    DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id])
  @@map("coin_transactions")
}

model RankingSnapshot {
  id        String   @id @default(cuid())
  userId    String
  rankType  String   // "global_score", "category_TECHNOLOGY", "country_BR", "city_SP", etc.
  period    String   // "week_2026_10", "month_2026_03", "alltime"
  score     Float
  rank      Int
  updatedAt DateTime @default(now())
  @@unique([userId, rankType, period])
  @@map("ranking_snapshots")
}

enum ResolutionType {
  MANUAL
  AUTOMATIC
}
```

---

## Sistema de Rankings

### Filosofia
Cada ranking é uma razão diferente para alguém querer ganhar e partilhar.
*"Melhor forecaster de tecnologia em São Paulo este mês"* — específico o suficiente para criar identidade.

### Arquitetura completa

```
RANKINGS GLOBAIS
├── 🏆 Forecast Score geral (mínimo 10 previsões resolvidas)
├── 💰 Coins acumulados
├── 🔥 Streak mais longo
└── ⚡ Mais previsões contra o mercado acertadas

RANKINGS POR CATEGORIA
├── 🌍 Geopolítica
├── ⚽ Esportes
├── 💻 Tecnologia
├── 🏛️ Política
├── 📈 Economia & Mercados
├── 🚀 Startups
├── 🔬 Ciência
├── 🎭 Cultura
└── 🇧🇷 Eventos Brasileiros (categoria especial)

RANKINGS GEOGRÁFICOS
├── Por país
├── Por estado (Brasil)
└── Por cidade

RANKINGS TEMPORAIS (aplicados a todos acima)
├── Esta semana
├── Este mês
├── Este ano
└── Todos os tempos

RANKINGS ESPECIAIS
├── 💥 Previsões mais ousadas acertadas (prob < 30%)
├── ⚡ Maior divergência acertada vs Polymarket
├── 📅 Previsões de mais longo prazo acertadas
└── 🔥 Maior série de acertos consecutivos
```

### Ligas semanais (estilo Duolingo)
- Utilizadores agrupados em ligas de 30 por nível
- Ranking por coins ganhos na semana
- Top 10 sobem de liga, bottom 5 descem
- Reset toda segunda-feira
- Notificação sexta: *"Estás em Xº lugar. Faltam 2 dias."*
- Notificação domingo: *"Última chance de subir de liga."*

### Implementação técnica
Não calcular em tempo real. Atualizar `RankingSnapshot` a cada resolução de previsão + cron job diário.

---

## Partilha Viral — Cards para todas as redes

### X (Twitter)
```
🔮 Fiz esta previsão em Janeiro 2024:
"Bitcoin > $150k até Dezembro 2025"

A minha probabilidade: 72%
Polymarket dizia: 41% (divergência de 31%)

Resultado: ✅ CORRETO

Forecast Score: 84% · 🦅 Visionário
predictionjournal.com/p/brunoteo
```

### LinkedIn
```
Em Janeiro de 2024 registei publicamente esta previsão
com 72% de probabilidade, quando o consenso era 41%.

O resultado confirmou-se 18 meses depois.

Forecast Score acumulado: 84% (top 3% global em Tecnologia)

Registo todas as previsões publicamente em @PredictionJournal
— sem edições, sem exclusões. A reputação que se constrói ali é real.
```

### Instagram / TikTok — Card visual gerado via `@vercel/og`
```
┌──────────────────────────────────────┐
│  🔮 PREDICTION JOURNAL               │
│                                      │
│  "Bitcoin > $150k até Dez 2025"      │
│                                      │
│  Minha aposta    ████████████  72%   │
│  Polymarket      ████████░░░░  41%   │
│                                      │
│  ✅ CORRETO · Janeiro 2024           │
│                                      │
│  Forecast Score: 84%  🦅 Visionário  │
│  @brunoteo · predictionjournal.com   │
└──────────────────────────────────────┘
```

Formatos: 1:1 (Instagram/X), 9:16 (Stories/TikTok), 1.91:1 (LinkedIn)

### Rota a criar: `/api/og/prediction/[id]`
```bash
npm install @vercel/og
```

### Modal de partilha
Ao clicar "Partilhar" em qualquer previsão, abrir modal com:
- Preview do card visual
- Botões: X, LinkedIn, Instagram, WhatsApp, Copiar link
- Texto pré-formatado por rede (editável antes de partilhar)

---

## Notificações inteligentes

```
STREAK
"🔥 O teu streak de 14 dias está em risco. Faz algo antes da meia-noite."
"😢 O teu streak de 14 dias acabou. Começa um novo hoje."

PREVISÕES EXPIRANDO
"⏰ Tens 3 previsões a expirar esta semana sem resolução."
"📅 'Bitcoin > $150k' expira amanhã. Tens razão?"

MERCADO
"📈 O Polymarket mudou 18% na tua previsão sobre Bitcoin."
"⚡ O mercado agora concorda mais contigo (+12%). O teu edge aumentou."

RANKING
"🏆 Estás em 3º lugar na liga esta semana. Faltam 2 dias."
"🎯 Subiste para 2º lugar em Tecnologia este mês!"
"⚠️ Estás nos últimos 5 da liga. Risco de descer de divisão."

CONQUISTAS
"🦅 Conquistaste o badge Voo de Águia! Partilha este momento."
"🔥 5 acertos seguidos! Estás Em Chamas."
```

---

## Roadmap de execução para o Claude Code

### PRIORIDADE 1 — Integridade (fazer PRIMEIRO)

**1.1 — Bloquear edição de campos core**
- Endpoint PATCH: rejeitar `title`, `probability`, `category`, `expiresAt` com 403
- Remover estes campos do `updateSchema` Zod
- Remover da UI qualquer campo de edição destes dados

**1.2 — Janela de 10 minutos para apagar**
- Endpoint DELETE: verificar `createdAt`, rejeitar após 10 min com 403
- UI: contador regressivo nos primeiros 10 minutos
- Após 10 minutos: botão desaparece completamente

**1.3 — Badge manual vs automático**
- Adicionar `resolutionType: ResolutionType?` no schema
- Badge visual diferente no card

---

### PRIORIDADE 2 — Schema de gamificação
Adicionar ao `prisma/schema.prisma` todos os campos descritos acima:
- Campos em User: coins, streak, level, xp, city, state, country
- Campos em Prediction: coinsAllocated, coinsResult, resolutionType
- Novos models: UserBadge, CoinTransaction, RankingSnapshot
- Rodar: `npx prisma db push && npx prisma generate`

---

### PRIORIDADE 3 — Lógica de gamificação

Criar `lib/gamification.ts` com:
- `calculateLevel(xp: number): number`
- `calculateXpForAction(action: string): number`
- `checkBadgesToAward(userId: string): Promise<string[]>`
- `updateStreak(userId: string): Promise<void>`
- `awardCoins(userId: string, amount: number, reason: string, predictionId?: string): Promise<void>`

Chamar estas funções ao:
- Criar previsão
- Resolver previsão
- Login diário

---

### PRIORIDADE 4 — Market Matching
Ver `MARKET_MATCHING_SPEC.md` — já completamente especificado.

---

### PRIORIDADE 5 — Rankings

**Página `/dashboard/rankings`:**
- Tabs: Global / Por Categoria / Por Localização / Especiais
- Filtro temporal: Semana / Mês / Ano / Sempre
- Top 100 por ranking
- Posição do utilizador atual destacada

**Página `/dashboard/league`:**
- Liga semanal do utilizador
- 30 utilizadores do mesmo nível
- Progresso da semana em coins

---

### PRIORIDADE 6 — Partilha viral

**Instalar:** `npm install @vercel/og`

**Criar rota:** `/api/og/prediction/[id]`
- Card visual com título, probabilidade, vs Polymarket, resultado, score, nível
- Formatos: 1:1 e 9:16

**Modal de partilha:**
- Preview do card
- Botões para cada rede
- Texto pré-formatado editável

**Badge partilhável:** `/api/og/badge/[badgeKey]/[userId]`

---

### PRIORIDADE 7 — Perfil público `/p/[username]`
- Previsões públicas
- Forecast Score por categoria
- Badges ganhos
- Nível e streak
- Posição nos rankings

---

## O que NÃO construir agora
- Chat ou comentários
- App mobile nativa
- Qualquer coisa com dinheiro real
- Sistema de seguir utilizadores
- Notificações push (começar com in-app)

---

## Copy de marketing

**Tagline:**
> "Toda a gente palpita. Poucos têm coragem de registar."

**Sub:**
> "Regista as tuas previsões com probabilidade e data. Acompanha a tua acurácia. Sobe no ranking. Partilha os acertos."

**Para partilha viral:**
> "Toda a gente tem opiniões sobre o futuro. Eu registo as minhas com probabilidade e data. O meu Forecast Score é 84%. Tens coragem de fazer o mesmo?"

**Anti-barreiras:**
> "Não precisas de cripto nem de cartão internacional. Treina o teu pensamento probabilístico gratuitamente."
