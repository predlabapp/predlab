# BOLAO_SPEC.md — Sistema de Bolões & Grupos

## Visão geral

Permitir que utilizadores criem grupos privados (bolões) onde amigos, colegas ou comunidades competem entre si fazendo previsões sobre os mesmos eventos. Cada bolão tem ranking interno, badges e partilha viral.

**Fase 1 (implementar agora):** Bolões sociais sem dinheiro real
**Fase 2 (futuro):** Bolões com prémio em dinheiro real + Escrow

---

## Casos de uso principais

- Grupo de amigos faz bolão da Copa do Mundo 2026
- Empresa cria bolão interno sobre eleições presidenciais 2026
- Família aposta quem acerta mais previsões sobre o Brasileirão
- Comunidade do X/WhatsApp compete em previsões de crypto/tech

---

## Schema Prisma — novos models

Adicionar ao `prisma/schema.prisma`:

```prisma
model Bolao {
  id            String      @id @default(cuid())
  name          String
  description   String?
  slug          String      @unique  // URL amigável ex: "bolao-copa-2026"
  inviteCode    String      @unique @default(cuid())
  creatorId     String
  isPublic      Boolean     @default(false)
  coverEmoji    String      @default("🔮")
  category      Category?   // categoria principal do bolão
  endsAt        DateTime?   // data de encerramento do bolão
  maxMembers    Int?        // limite de participantes (null = ilimitado)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  creator     User            @relation("BolaoCreator", fields: [creatorId], references: [id])
  members     BolaoMember[]
  predictions BolaoPredicao[]

  @@map("bolaos")
}

model BolaoMember {
  id        String   @id @default(cuid())
  bolaoId   String
  userId    String
  role      BolaoRole @default(MEMBER)
  joinedAt  DateTime  @default(now())
  nickname  String?   // apelido dentro do bolão

  bolao Bolao @relation(fields: [bolaoId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([bolaoId, userId])
  @@map("bolao_members")
}

model BolaoPredicao {
  id           String  @id @default(cuid())
  bolaoId      String
  predictionId String  // FK para Prediction existente
  addedById    String
  createdAt    DateTime @default(now())

  bolao      Bolao      @relation(fields: [bolaoId], references: [id], onDelete: Cascade)
  prediction Prediction @relation(fields: [predictionId], references: [id])
  addedBy    User       @relation(fields: [addedById], references: [id])

  @@unique([bolaoId, predictionId])
  @@map("bolao_predicoes")
}

enum BolaoRole {
  ADMIN   // criador ou promovido a admin
  MEMBER  // membro normal
}
```

Também adicionar ao model `User`:
```prisma
bolaosCreated  Bolao[]         @relation("BolaoCreator")
bolaoMembers   BolaoMember[]
bolaoPredicoes BolaoPredicao[]
```

Adicionar ao model `Prediction`:
```prisma
bolaoPredicoes BolaoPredicao[]
```

Após alterações:
```bash
npx prisma db push
npx prisma generate
```

---

## APIs necessárias

### POST /api/bolaos
Criar um novo bolão.

```typescript
// Body
{
  name: string          // "Bolão Copa 2026"
  description?: string
  category?: Category
  endsAt?: string       // ISO date
  maxMembers?: number
  isPublic?: boolean
  coverEmoji?: string
}

// Resposta
{
  id: string
  slug: string
  inviteCode: string    // código para convidar amigos
  inviteUrl: string     // https://predlab.app/bolao/join/{inviteCode}
}
```

Lógica:
- Gerar `slug` único a partir do nome (ex: "Bolão Copa 2026" → "bolao-copa-2026-abc123")
- Criador entra automaticamente como `ADMIN`
- Gerar `inviteCode` único

---

### GET /api/bolaos
Listar bolões do utilizador autenticado.

```typescript
// Resposta
{
  bolaos: [
    {
      id, name, slug, coverEmoji,
      memberCount: number,
      myRole: BolaoRole,
      myScore: number,      // posição no ranking
      topForecaster: { name, score },
      recentActivity: number  // previsões nas últimas 24h
    }
  ]
}
```

---

### GET /api/bolaos/[slug]
Detalhes de um bolão + ranking completo.

```typescript
// Resposta
{
  bolao: { id, name, description, coverEmoji, endsAt, isPublic },
  myRole: BolaoRole | null,
  isMember: boolean,
  ranking: [
    {
      position: number,
      userId: string,
      name: string,
      image: string | null,
      nickname: string | null,
      totalPredictions: number,
      resolvedPredictions: number,
      correctPredictions: number,
      scoreVerified: number,    // só previsões verificadas pelo Polymarket
      scoreGeneral: number,     // todas as previsões
      streak: number,
      badges: string[]
    }
  ],
  predictions: [...]   // previsões partilhadas no bolão
}
```

---

### POST /api/bolaos/join/[inviteCode]
Entrar num bolão via código de convite.

```typescript
// Sem body necessário — usa o utilizador autenticado

// Resposta
{
  bolao: { id, name, slug }
  message: "Entraste no bolão!"
}
```

Validações:
- Utilizador não pode entrar duas vezes
- Verificar `maxMembers` se definido
- Bolão não pode estar encerrado (`endsAt` no passado)

---

### POST /api/bolaos/[slug]/predictions
Partilhar uma previsão existente no bolão.

```typescript
// Body
{
  predictionId: string
}
```

Validações:
- Utilizador tem de ser membro do bolão
- Previsão tem de pertencer ao utilizador autenticado
- Previsão não pode já estar no bolão

---

### DELETE /api/bolaos/[slug]/predictions/[predictionId]
Remover previsão do bolão (só o dono da previsão ou admin do bolão).

---

### GET /api/bolaos/[slug]/ranking
Ranking calculado dos membros do bolão.

Lógica de pontuação:
```typescript
// Para cada membro, calcular:
// 1. Previsões partilhadas no bolão que foram resolvidas
// 2. Calcular score usando sistema Brier existente
// 3. Bonus: +10 pts por previsão verificada automaticamente (Polymarket)
// 4. Ordenar por scoreVerified primeiro, depois scoreGeneral como desempate
```

---

### PATCH /api/bolaos/[slug]
Editar bolão (só ADMIN).

```typescript
// Body — apenas campos editáveis
{
  name?: string
  description?: string
  endsAt?: string
  maxMembers?: number
  isPublic?: boolean
  coverEmoji?: string
}
```

---

### DELETE /api/bolaos/[slug]
Apagar bolão (só criador).

---

### POST /api/bolaos/[slug]/members/[userId]/promote
Promover membro a ADMIN (só criador original).

---

### DELETE /api/bolaos/[slug]/members/[userId]
Remover membro do bolão (ADMIN pode remover qualquer membro, membro pode sair).

---

### POST /api/bolaos/[slug]/regenerate-invite
Gerar novo código de convite (invalida o anterior). Só ADMIN.

---

## Páginas a criar

### /dashboard/bolaos
Lista de bolões do utilizador.

Layout:
```
┌─────────────────────────────────────────┐
│  Os meus Bolões                [+ Criar] │
├─────────────────────────────────────────┤
│  🏆 Bolão Copa 2026                     │
│  24 membros · Você está em 3º lugar     │
│  [Ver bolão]                            │
├─────────────────────────────────────────┤
│  ⚽ Bolão Brasileirão                   │
│  8 membros · Você está em 1º lugar 🥇   │
│  [Ver bolão]                            │
└─────────────────────────────────────────┘
```

---

### /bolao/[slug]
Página pública/privada do bolão com ranking.

Secções:
1. **Header** — nome, emoji, descrição, membros, datas
2. **Ranking** — tabela com posição, nome, score, previsões certas
3. **Previsões do bolão** — lista de previsões partilhadas pelos membros
4. **Botão de convite** — copiar link ou código

Layout do ranking:
```
┌────────────────────────────────────────────────────────┐
│  #   Nome           Certas  Score ⚡  Score ✍️  Streak │
├────────────────────────────────────────────────────────┤
│  🥇  Bruno Teo       12/15    84%      79%      🔥14   │
│  🥈  Ana Silva        9/14    76%      71%      🔥7    │
│  🥉  João Costa       8/12    72%      68%      🔥3    │
│   4  Maria Ramos      7/11    68%      65%      ——     │
└────────────────────────────────────────────────────────┘
```

---

### /bolao/join/[inviteCode]
Página de entrada no bolão via convite.

Para utilizadores não autenticados:
```
┌─────────────────────────────────────────┐
│  🔮 Foste convidado para:               │
│                                         │
│  🏆 Bolão Copa 2026                     │
│  24 membros já participam               │
│                                         │
│  [Criar conta grátis para participar]   │
│  [Já tenho conta — Entrar]              │
└─────────────────────────────────────────┘
```

Para utilizadores autenticados:
```
┌─────────────────────────────────────────┐
│  🔮 Bolão Copa 2026                     │
│  24 membros                             │
│                                         │
│  [Entrar no bolão →]                    │
└─────────────────────────────────────────┘
```

Após entrar → redirecionar para `/bolao/[slug]`

---

### Modal de criar bolão
Aberto a partir de `/dashboard/bolaos` ou botão na navbar.

Campos:
- Nome do bolão (obrigatório)
- Emoji de capa (picker simples)
- Descrição (opcional)
- Categoria principal (dropdown)
- Data de encerramento (opcional)
- Limite de membros (opcional)
- Público ou privado

---

## Componentes a criar

### `BolaoCard.tsx`
Card do bolão na lista — nome, emoji, membros, posição do utilizador.

### `BolaoRanking.tsx`
Tabela de ranking com medalhas 🥇🥈🥉 para top 3.

### `BolaoInvite.tsx`
Componente de partilha do convite — botão copiar link + QR code opcional.

### `AddPredictionToBolao.tsx`
Modal para seleccionar previsão existente e adicionar ao bolão.
Mostrar lista das previsões do utilizador com checkbox.

---

## Loop viral — como funciona na prática

```
1. Bruno cria "Bolão Copa 2026"
2. Sistema gera link: predlab.app/bolao/join/ABC123XYZ
3. Bruno partilha no WhatsApp/X com os amigos
4. Amigos clicam → vêem o bolão → criam conta → entram
5. Cada membro partilha as suas previsões no bolão
6. Quando uma previsão resolve, o ranking actualiza automaticamente
7. Quem está em 1º lugar partilha o card de ranking no X
   → novos curiosos clicam → criam conta → mais bolões
```

---

## Card de partilha do ranking

Quando utilizador está em 1º lugar ou sobe de posição, oferecer partilha:

```
┌──────────────────────────────────────┐
│  🔮 PREDLAB                          │
│                                      │
│  🏆 Bolão Copa 2026                  │
│  Estou em 1º lugar!                  │
│                                      │
│  Score: 84% ⚡  |  12/15 certas      │
│  24 participantes                    │
│                                      │
│  Entra no bolão →                    │
│  predlab.app/bolao/join/ABC123       │
└──────────────────────────────────────┘
```

Gerar via `/api/og/bolao/[slug]` com `@vercel/og`.

---

## Notificações in-app (eventos do bolão)

- "🎉 [Nome] entrou no teu bolão [Nome do Bolão]"
- "📈 [Nome] subiu para 2º lugar em [Nome do Bolão]"
- "⚡ Uma previsão do bolão foi resolvida automaticamente"
- "🏆 O bolão [Nome] encerrou! [Nome] ganhou!"
- "👋 Foste convidado para [Nome do Bolão]"

---

## Integração com sistema existente

### Score do bolão vs Score global
- Score no bolão = calculado apenas com previsões partilhadas nesse bolão
- Score global = todas as previsões do utilizador (não muda)
- São independentes — um utilizador pode ter score alto globalmente mas baixo num bolão específico

### Resolução automática
- Quando uma previsão é resolvida (manual ou automática via Polymarket), o ranking do bolão actualiza automaticamente
- Não requer acção adicional do utilizador

### Coins
- Ganhar posição num bolão não gera coins extra (fase 1)
- Fase 2: coins de prémio quando bolão tem entrada paga

---

## Fase 2 — Bolões com dinheiro (futuro, não implementar agora)

Documentado aqui apenas para não perder o contexto.

**Modelo Escrow:**
- Criador define valor de entrada (ex: R$20 por pessoa)
- Cada membro deposita via Pix para conta Escrow do PredLab
- No final, vencedor(es) recebem o pool menos taxa da plataforma (ex: 5%)
- PredLab nunca "ganha" — é apenas facilitador neutro

**Questões regulatórias a resolver antes:**
- Classificação legal (aposta, jogo, competição de habilidade?)
- Registro na Receita Federal como processador de pagamentos
- KYC obrigatório para transações acima de R$X
- Termos de serviço específicos para esta modalidade

**Stack para fase 2:**
- Stripe ou Pagar.me para processamento
- Conta de custódia em banco parceiro
- Sistema de KYC (Serpro ou similar)

---

## Ordem de implementação recomendada

1. Schema Prisma + migrate
2. API: POST /api/bolaos (criar)
3. API: POST /api/bolaos/join/[inviteCode] (entrar)
4. API: GET /api/bolaos (listar)
5. API: GET /api/bolaos/[slug] (detalhes + ranking)
6. API: POST /api/bolaos/[slug]/predictions (partilhar previsão)
7. Página /dashboard/bolaos (lista + botão criar)
8. Página /bolao/[slug] (ranking + previsões)
9. Página /bolao/join/[inviteCode] (entrada via convite)
10. Modal de criar bolão
11. Componente AddPredictionToBolao
12. Card de partilha OG via /api/og/bolao/[slug]
13. Notificações in-app

---

## Notas importantes

- Bolão privado: só membros vêem o ranking e as previsões
- Bolão público: qualquer pessoa pode ver, mas precisa de conta para entrar
- Admin pode editar o bolão, remover membros, gerar novo código de convite
- Membro pode sair do bolão a qualquer momento
- Apagar bolão remove todos os dados relacionados (cascade)
- Previsões partilhadas no bolão continuam a existir no perfil do utilizador — apenas a associação ao bolão é removida
