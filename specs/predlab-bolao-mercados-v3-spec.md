# PREDLAB — SPEC COMPLETO v3
# Bolão Tradicional + Mercados de Grupo (Separados)

## Contexto e decisões arquitecturais

Este spec **substitui** a abordagem anterior onde bolões e mercados de grupo
estavam misturados na mesma área. São dois produtos distintos com lógicas
opostas e devem ser áreas separadas no app.

### Bolão Tradicional `/boloes`
- Palpite simples: quem ganha? qual placar?
- Pontuação por acerto de resultado ou placar exacto
- Modelo familiar para qualquer brasileiro
- Admin preenche resultados manualmente
- Funciona para qualquer evento: Copa, Brasileirão, eleições, BBB, F1...

### Mercados de Grupo `/grupos`
- Questão + probabilidade 1-99%
- Raciocínio e evidências
- Score tipo Brier
- Já parcialmente implementado — apenas reorganizar e separar

---

## PARTE 1 — BOLÃO TRADICIONAL

### 1.1 Conceito de pontuação

Sistema clássico de bolão brasileiro:

```
Placar exacto:     10 pontos  (ex: chutou 2×1 e foi 2×1)
Resultado certo:    5 pontos  (ex: chutou 2×1, foi 3×1 — vitória certa)
Empate certo:       5 pontos  (ex: chutou 1×1 e foi 0×0 — empate certo)
Nenhum:             0 pontos
```

Para eventos não-esportivos (eleições, BBB, etc.) usar pontuação binária:
```
Acertou:   10 pontos
Errou:      0 pontos
```

---

### 1.2 Schema Prisma — Bolão Tradicional

Adicionar ao `prisma/schema.prisma`:

```prisma
model Bolao {
  id              String      @id @default(cuid())
  name            String
  description     String?
  slug            String      @unique
  inviteCode      String      @unique @default(cuid())
  creatorId       String
  type            BolaoType   @default(SPORTS)   // SPORTS | CUSTOM
  coverEmoji      String      @default("🏆")
  isPublic        Boolean     @default(false)
  maxMembers      Int?
  endsAt          DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Prémio (dinheiro fora da plataforma)
  hasPrize          Boolean     @default(false)
  prizeDescription  String?
  prizePixKey       String?
  prizePool         String?
  prizeDistribution String?
  prizeStatus       PrizeStatus @default(PENDING)
  prizeWinnerId     String?

  // Pontuação personalizada (opcional)
  pointsExact       Int @default(10)
  pointsResult      Int @default(5)

  creator   User          @relation("BolaoCreator", fields: [creatorId], references: [id])
  members   BolaoMember[]
  jogos     BolaoJogo[]
  payments  BolaoPayment[]

  @@map("bolaos")
}

enum BolaoType {
  SPORTS   // jogos com placar (futebol, basquete, etc.)
  CUSTOM   // eventos custom sem placar (eleições, BBB, etc.)
}

enum PrizeStatus {
  PENDING
  FINISHED
  PAID
}

model BolaoMember {
  id        String    @id @default(cuid())
  bolaoId   String
  userId    String
  role      BolaoRole @default(MEMBER)
  nickname  String?
  joinedAt  DateTime  @default(now())

  bolao   Bolao  @relation(fields: [bolaoId], references: [id], onDelete: Cascade)
  user    User   @relation(fields: [userId], references: [id])
  palpites BolaoPalpite[]

  @@unique([bolaoId, userId])
  @@map("bolao_members")
}

enum BolaoRole {
  ADMIN
  MEMBER
}

model BolaoJogo {
  id           String      @id @default(cuid())
  bolaoId      String
  name         String      // "Brasil vs Argentina" ou "Quem vence o BBB?"
  description  String?
  homeTeam     String?     // "Brasil" (null para CUSTOM)
  awayTeam     String?     // "Argentina" (null para CUSTOM)
  options      String?     // JSON — para CUSTOM: ["Lula","Bolsonaro","Outro"]
  scheduledAt  DateTime    // data/hora do evento
  phase        String?     // "Fase de Grupos", "Semifinal", etc.
  status       JogoStatus  @default(SCHEDULED)
  
  // Resultado (preenchido pelo admin após o jogo)
  resultHome   Int?        // placar casa (SPORTS)
  resultAway   Int?        // placar visitante (SPORTS)
  resultOption String?     // opção vencedora (CUSTOM)
  resolvedAt   DateTime?
  resolvedById String?

  bolao    Bolao          @relation(fields: [bolaoId], references: [id], onDelete: Cascade)
  palpites BolaoPalpite[]

  @@map("bolao_jogos")
}

enum JogoStatus {
  SCHEDULED   // agendado
  LIVE        // a decorrer
  FINISHED    // encerrado — admin já preencheu resultado
  CANCELLED   // cancelado — sem penalização
}

model BolaoPalpite {
  id        String   @id @default(cuid())
  jogoId    String
  memberId  String
  
  // SPORTS: placar
  palpiteHome Int?
  palpiteAway Int?
  
  // CUSTOM: opção escolhida
  palpiteOption String?
  
  // Calculado após resolução
  pontos    Int?     // null = ainda não calculado
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  jogo   BolaoJogo   @relation(fields: [jogoId], references: [id], onDelete: Cascade)
  member BolaoMember @relation(fields: [memberId], references: [id], onDelete: Cascade)

  @@unique([jogoId, memberId])
  @@map("bolao_palpites")
}

model BolaoPayment {
  id          String        @id @default(cuid())
  bolaoId     String
  userId      String
  amount      Float
  status      PaymentStatus @default(PENDING)
  confirmedBy String?
  confirmedAt DateTime?
  note        String?
  createdAt   DateTime      @default(now())

  bolao Bolao @relation(fields: [bolaoId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id])

  @@unique([bolaoId, userId])
  @@map("bolao_payments")
}

enum PaymentStatus {
  PENDING
  CONFIRMED
  REJECTED
}
```

Adicionar ao model `User`:
```prisma
bolaosCreated  Bolao[]       @relation("BolaoCreator")
bolaoMembers   BolaoMember[]
bolaoPayments  BolaoPayment[]
```

---

### 1.3 APIs — Bolão Tradicional

#### POST /api/boloes
Criar bolão.

```typescript
// Body
{
  name: string
  description?: string
  type: BolaoType          // SPORTS | CUSTOM
  coverEmoji?: string
  endsAt?: string
  maxMembers?: number
  isPublic?: boolean
  hasPrize?: boolean
  prizeDescription?: string
  prizePixKey?: string
  prizeDistribution?: string
  pointsExact?: number     // default 10
  pointsResult?: number    // default 5
}

// Resposta
{
  id, slug, inviteCode,
  inviteUrl: "https://predlab.app/bolao/join/{inviteCode}"
}
```

---

#### GET /api/boloes
Listar bolões do utilizador.

```typescript
// Resposta
{
  boloes: [{
    id, name, slug, coverEmoji, type,
    memberCount: number,
    myRole: BolaoRole,
    totalJogos: number,
    jogosResolvidos: number,
    myPontos: number,
    myPosition: number,
    leader: { name, pontos }
  }]
}
```

---

#### GET /api/boloes/[slug]
Detalhes completos + ranking.

```typescript
// Resposta
{
  bolao: { id, name, description, type, coverEmoji, endsAt, hasPrize, ... },
  isMember: boolean,
  myRole: BolaoRole | null,
  ranking: [{
    position: number,
    userId, name, image, nickname,
    totalPontos: number,
    palpitesExactos: number,    // quantos placares exactos
    palpitesResultado: number,  // quantos resultados certos
    palpitesErrados: number,
    totalPalpites: number,
    paymentStatus: PaymentStatus | null
  }],
  jogos: [...]   // lista de jogos com palpite do utilizador
}
```

---

#### POST /api/boloes/join/[inviteCode]
Entrar no bolão.

---

#### GET /api/boloes/[slug]/jogos
Listar jogos do bolão.

```typescript
// Resposta
{
  jogos: [{
    id, name, homeTeam, awayTeam, options,
    scheduledAt, phase, status,
    resultHome, resultAway, resultOption,
    meuPalpite: {
      palpiteHome, palpiteAway, palpiteOption, pontos
    } | null,
    totalPalpites: number,       // quantos membros já palpitaram
    totalMembros: number
  }]
}
```

---

#### POST /api/boloes/[slug]/jogos
Criar jogo no bolão. Só ADMIN.

```typescript
// Body — SPORTS
{
  type: "SPORTS",
  homeTeam: "Brasil",
  awayTeam: "Argentina",
  scheduledAt: "2026-06-15T18:00:00Z",
  phase: "Fase de Grupos"
}

// Body — CUSTOM
{
  type: "CUSTOM",
  name: "Quem vence as eleições 2026?",
  options: ["Lula", "Bolsonaro", "Outro"],
  scheduledAt: "2026-10-04T20:00:00Z"
}
```

---

#### PATCH /api/boloes/[slug]/jogos/[jogoId]/resultado
Admin preenche resultado após o jogo. Só ADMIN.

```typescript
// Body — SPORTS
{
  resultHome: 2,
  resultAway: 1
}

// Body — CUSTOM
{
  resultOption: "Lula"
}

// Lógica após salvar:
// 1. Marcar jogo como FINISHED
// 2. Para cada palpite do jogo:
//    SPORTS:
//      placar exacto (home e away iguais) → pontos = pointsExact
//      resultado certo (vitória/empate correcto) → pontos = pointsResult
//      errou → pontos = 0
//    CUSTOM:
//      acertou opção → pontos = pointsExact
//      errou → pontos = 0
// 3. Recalcular ranking do bolão
// 4. Enviar notificação a todos os membros com resultado
```

---

#### POST /api/boloes/[slug]/jogos/[jogoId]/palpite
Membro submete palpite.

```typescript
// Body — SPORTS
{
  palpiteHome: 2,
  palpiteAway: 0
}

// Body — CUSTOM
{
  palpiteOption: "Lula"
}

// Validações:
// - Jogo tem de estar SCHEDULED
// - Não pode palpitar após scheduledAt (jogo já começou)
// - Upsert: se já palpitou, actualiza (só antes do início)
```

---

#### PATCH /api/boloes/[slug]/payments/[userId]
Admin confirma/rejeita pagamento.

```typescript
// Body
{
  status: PaymentStatus,
  note?: string
}
```

---

#### POST /api/boloes/[slug]/declare-winner
Admin declara vencedor do prémio.

---

### 1.4 Páginas — Bolão Tradicional

#### /boloes
Lista de bolões do utilizador + botão "Criar bolão".

```
┌──────────────────────────────────────────────────┐
│  Meus Bolões                        [+ Criar]    │
├──────────────────────────────────────────────────┤
│  🏆 Copa 2026                                    │
│  24 membros · Você está em 3º · 45 pts           │
│  12/64 jogos resolvidos                          │
│  [Ver bolão →]                                   │
├──────────────────────────────────────────────────┤
│  ⚽ Brasileirão 2026                             │
│  8 membros · Você está em 1º · 120 pts 🥇        │
│  [Ver bolão →]                                   │
└──────────────────────────────────────────────────┘
```

---

#### /bolao/[slug]
Página principal do bolão com 4 tabs:

```
[Ranking]  [Jogos]  [Membros]  [Pagamentos]
```

**Tab Ranking:**
```
┌──────────────────────────────────────────────────────────────┐
│  #    Nome          Pontos   Exactos   Resultados   Pagamento │
├──────────────────────────────────────────────────────────────┤
│  🥇   João Silva    145 pts    8          12          ✅      │
│  🥈   Ana Costa     130 pts    6          14          ✅      │
│  🥉   Pedro Ramos   115 pts    5          11          ⏳      │
│   4   Maria         100 pts    4           9          ✅      │
└──────────────────────────────────────────────────────────────┘
```

**Tab Jogos:**
```
┌──────────────────────────────────────────────────┐
│  📅 Fase de Grupos                               │
│                                                  │
│  ✅ Brasil 2 × 1 Argentina          15 Jun       │
│     Meu palpite: 2×1 🎯 +10 pts                  │
│                                                  │
│  ⏳ Portugal vs Espanha             18 Jun       │
│     Meu palpite: 2×0  [Alterar até 18/06 18h]   │
│                                                  │
│  🔒 França vs Alemanha             20 Jun        │
│     Palpite encerrado — jogo em breve            │
│                                                  │
│  📅 Itália vs Holanda              22 Jun        │
│     [Fazer palpite →]                            │
└──────────────────────────────────────────────────┘
```

**Tab Membros:**
Lista de membros com avatar, nickname, pontuação e botão de remover (só admin).

**Tab Pagamentos:**
Só visível se `hasPrize = true`.
```
┌──────────────────────────────────────────────────┐
│  💰 Pagamentos · Entrada R$30                    │
│  Arrecadado: R$60 / R$720 · 2/24 confirmados    │
│                                                  │
│  João Silva     R$30   ✅ Confirmado  15/03      │
│  Ana Costa      R$30   ✅ Confirmado  15/03      │
│  Pedro Ramos    R$30   ⏳ Pendente    [Já paguei]│
│  Maria Oliveira R$30   ❌ Rejeitado              │
│                                                  │
│  Pix: 11999999999 (Bruno Teo) [📋 Copiar]       │
└──────────────────────────────────────────────────┘
```

Admin vê botões [✅ Confirmar] [❌ Rejeitar] por membro.

---

#### /bolao/join/[inviteCode]
Página de entrada via convite.

Não autenticado:
```
┌──────────────────────────────────────────────────┐
│  🏆 Foste convidado para:                        │
│  Copa 2026                                       │
│  24 membros · Entrada: R$30                      │
│                                                  │
│  [Criar conta grátis]  [Já tenho conta]          │
└──────────────────────────────────────────────────┘
```

Autenticado:
```
┌──────────────────────────────────────────────────┐
│  🏆 Copa 2026 · 24 membros                       │
│  [Entrar no bolão →]                             │
└──────────────────────────────────────────────────┘
```

---

#### Modal de criar bolão
Passo 1 — Tipo:
```
Que tipo de bolão queres criar?

[⚽ Esportivo]        [🗳️ Evento personalizado]
Futebol, F1,          Eleições, BBB,
basquete...           Oscar, qualquer coisa
```

Passo 2 — Detalhes:
```
Nome do bolão *
[Copa 2026 — Petrobras Recife        ]

Emoji de capa
[🏆] [⚽] [🏅] [🎯] [🔮] [🗳️]

Descrição (opcional)
[                                    ]

Data de encerramento
[dd/mm/aaaa]

Limite de membros (opcional)
[____]

[ ] Bolão público

Pontuação (opcional, padrão recomendado)
Placar exacto: [10] pts
Resultado certo: [5] pts
```

Passo 3 — Prémio (opcional):
```
[ ] Este bolão tem prémio em dinheiro

  Valor de entrada: R$ [____]
  Chave Pix: [_________________]
  Distribuição:
    1º lugar [60]%
    2º lugar [30]%
    3º lugar [10]%

  ℹ️ O PredLab não processa pagamentos.
  Os participantes pagam directamente a ti via Pix.
```

---

#### Modal de criar jogo (admin)
```
Tipo de jogo
( ) Esportivo — com placar
( ) Evento personalizado — sem placar

─── Se Esportivo ───
Time da casa *    Time visitante *
[Brasil      ]    [Argentina   ]
Fase (opcional)
[Fase de Grupos]
Data e hora *
[15/06/2026] [18:00]

─── Se Personalizado ───
Questão *
[Quem vence as eleições 2026?]
Opções (mín. 2) *
[Lula          ] [+ Adicionar]
[Bolsonaro     ]
[Outro         ]
Data do evento *
[04/10/2026]
```

---

#### Modal de palpite (membro)

SPORTS:
```
⚽ Brasil vs Argentina
Fase de Grupos · 15 Jun 18h

  Brasil   [2]  ×  [1]  Argentina
           ↑ insere o placar que achas

Palpites dos outros ficam ocultos até o jogo começar.
[Guardar palpite →]
```

CUSTOM:
```
🗳️ Quem vence as eleições 2026?
Resultado declarado em: 04/10/2026

  ( ) Lula
  ( ) Bolsonaro
  ( ) Outro

[Guardar palpite →]
```

---

#### Modal de resultado (admin)

SPORTS:
```
⚽ Brasil vs Argentina
Qual foi o resultado?

  Brasil   [__]  ×  [__]  Argentina

[Confirmar resultado →]

⚠️ Esta acção calcula os pontos de todos os membros.
Não pode ser desfeita.
```

CUSTOM:
```
🗳️ Quem vence as eleições 2026?
Qual foi o resultado?

  ( ) Lula
  ( ) Bolsonaro
  ( ) Outro

[Confirmar resultado →]
```

---

### 1.5 Componentes a criar

| Componente | Descrição |
|-----------|-----------|
| `BolaoCard.tsx` | Card na listagem /boloes |
| `BolaoRanking.tsx` | Tabela de ranking com medalhas |
| `BolaoJogoCard.tsx` | Card de jogo com status e palpite |
| `BolaoJogosList.tsx` | Lista de jogos agrupados por fase |
| `BolaoMembros.tsx` | Lista de membros |
| `BolaoPayments.tsx` | Gestão de pagamentos |
| `CreateBolaoModal.tsx` | Modal de criação (3 passos) |
| `CreateJogoModal.tsx` | Modal de criar jogo (admin) |
| `PalpiteModal.tsx` | Modal de palpitar (membro) |
| `ResultadoModal.tsx` | Modal de resultado (admin) |
| `BolaoInvite.tsx` | Componente de convite com link |

---

### 1.6 Notificações do bolão

```
Novo membro:
"👋 [Nome] entrou no teu bolão [Nome do Bolão]"

Novo jogo adicionado:
"⚽ Novo jogo no bolão [Nome]: Brasil vs Argentina (15 Jun 18h)"

Lembrete de palpite (2h antes):
"⏰ Faltam 2h para Brasil vs Argentina. Ainda não palpitaste!"

Resultado registado:
"🎯 Resultado: Brasil 2 × 1 Argentina
   O teu palpite foi 2×1 — PLACAR EXACTO! +10 pts 🎉"
ou
"⚽ Resultado: Brasil 2 × 1 Argentina
   O teu palpite foi 1×0 — resultado certo! +5 pts"
ou
"❌ Resultado: Brasil 2 × 1 Argentina
   O teu palpite foi 0×2 — sem pontos desta vez."

Subida no ranking:
"📈 Subiste para 2º lugar no bolão [Nome]!"

Pagamento confirmado:
"✅ O teu pagamento foi confirmado no bolão [Nome]"
```

---

## PARTE 2 — MERCADOS DE GRUPO

### 2.1 Conceito

Área separada do bolão. Qualquer utilizador cria um grupo, convida amigos, e dentro do grupo qualquer membro pode criar questões com probabilidade. É o Polymarket privado do grupo.

Diferença fundamental do bolão:
- Não há "resultado certo" ou "errado" simples
- O score é contínuo (quem estava mais calibrado)
- Foco em raciocínio e probabilidades, não em palpites

---

### 2.2 Schema Prisma — Mercados de Grupo

```prisma
model Grupo {
  id          String   @id @default(cuid())
  name        String
  description String?
  slug        String   @unique
  inviteCode  String   @unique @default(cuid())
  creatorId   String
  coverEmoji  String   @default("🔮")
  isPublic    Boolean  @default(false)
  maxMembers  Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  creator  User           @relation("GrupoCreator", fields: [creatorId], references: [id])
  members  GrupoMember[]
  mercados GrupoMercado[]

  @@map("grupos")
}

model GrupoMember {
  id       String    @id @default(cuid())
  grupoId  String
  userId   String
  role     GrupoRole @default(MEMBER)
  joinedAt DateTime  @default(now())

  grupo    Grupo          @relation(fields: [grupoId], references: [id], onDelete: Cascade)
  user     User           @relation(fields: [userId], references: [id])
  votos    GrupoMercadoVoto[]

  @@unique([grupoId, userId])
  @@map("grupo_members")
}

enum GrupoRole {
  ADMIN
  MEMBER
}

model GrupoMercado {
  id           String           @id @default(cuid())
  grupoId      String
  creatorId    String
  question     String           // "Lula vence as eleições 2026?"
  description  String?
  category     Category?
  expiresAt    DateTime
  resolvedAt   DateTime?
  resolution   GrupoResolution?
  resolvedById String?
  isOpen       Boolean          @default(true)
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  grupo      Grupo              @relation(fields: [grupoId], references: [id], onDelete: Cascade)
  creator    User               @relation("MercadoCreator", fields: [creatorId], references: [id])
  resolvedBy User?              @relation("MercadoResolver", fields: [resolvedById], references: [id])
  votos      GrupoMercadoVoto[]

  @@map("grupo_mercados")
}

model GrupoMercadoVoto {
  id          String   @id @default(cuid())
  mercadoId   String
  memberId    String
  probability Int      // 1-99
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  mercado GrupoMercado @relation(fields: [mercadoId], references: [id], onDelete: Cascade)
  member  GrupoMember  @relation(fields: [memberId], references: [id], onDelete: Cascade)

  @@unique([mercadoId, memberId])
  @@map("grupo_mercado_votos")
}

enum GrupoResolution {
  SIM
  NAO
  CANCELADO
}
```

Adicionar ao model `User`:
```prisma
gruposCreated    Grupo[]        @relation("GrupoCreator")
grupoMembers     GrupoMember[]
mercadosCriados  GrupoMercado[] @relation("MercadoCreator")
mercadosResolvidos GrupoMercado[] @relation("MercadoResolver")
```

---

### 2.3 APIs — Mercados de Grupo

#### POST /api/grupos
Criar grupo.

```typescript
// Body
{
  name: string
  description?: string
  coverEmoji?: string
  isPublic?: boolean
  maxMembers?: number
}
```

---

#### GET /api/grupos
Listar grupos do utilizador.

---

#### GET /api/grupos/[slug]
Detalhes + ranking de forecasters.

```typescript
// Resposta
{
  grupo: { id, name, description, coverEmoji },
  isMember: boolean,
  myRole: GrupoRole | null,
  ranking: [{
    position: number,
    userId, name, image,
    totalVotos: number,
    mercadosResolvidos: number,
    acertos: number,           // votos na direcção certa
    scoreCalibração: number,   // score Brier médio 0-100
  }],
  mercados: [...]
}
```

---

#### POST /api/grupos/join/[inviteCode]
Entrar no grupo via convite.

---

#### GET /api/grupos/[slug]/mercados
Listar mercados.

```typescript
// Query: ?status=open|resolved|all
// Resposta
{
  mercados: [{
    id, question, description, category,
    expiresAt, resolvedAt, resolution, isOpen,
    creatorName,
    totalVotos: number,
    totalMembros: number,
    mediaGrupo: number | null,   // probabilidade média
    meuVoto: number | null,
    // Após resolução:
    acertei: boolean | null,
    melhorForecaster: {
      name: string,
      probability: number,
      erro: number             // distância da resposta correcta
    } | null
  }]
}
```

---

#### POST /api/grupos/[slug]/mercados
Criar mercado interno. Qualquer membro.

```typescript
// Body
{
  question: string    // máx 200 chars
  description?: string
  category?: Category
  expiresAt: string
}
```

---

#### POST /api/grupos/[slug]/mercados/[mercadoId]/votar
Submeter ou actualizar voto.

```typescript
// Body
{ probability: number }  // 1-99

// Validações:
// - Mercado aberto (isOpen = true)
// - Não resolvido
// - Não expirado
// - Upsert se já votou
```

---

#### PATCH /api/grupos/[slug]/mercados/[mercadoId]/resolver
Resolver mercado. Só criador do mercado ou admin do grupo.

```typescript
// Body
{
  resolution: GrupoResolution  // SIM | NAO | CANCELADO
  note?: string
}

// Lógica após resolução:
// 1. Marcar isOpen = false, gravar resolvedAt
// 2. Para cada voto:
//    Se SIM: acertou quem votou >= 50
//    Se NAO: acertou quem votou < 50
//    Score Brier = 1 - (probability/100 - outcome)²
//    outcome = 1 se SIM, 0 se NAO
// 3. Calcular melhor forecaster (menor erro absoluto)
// 4. Notificar todos os membros
```

---

#### DELETE /api/grupos/[slug]/mercados/[mercadoId]
Apagar mercado. Só criador e apenas se ainda sem votos.

---

### 2.4 Páginas — Mercados de Grupo

#### /grupos
Lista de grupos do utilizador.

```
┌──────────────────────────────────────────────────┐
│  Meus Grupos                        [+ Criar]    │
├──────────────────────────────────────────────────┤
│  🔮 Galera do trabalho                           │
│  12 membros · 8 mercados abertos                 │
│  Teu score: 78% calibração · 3º lugar            │
│  [Ver grupo →]                                   │
├──────────────────────────────────────────────────┤
│  🏛️ Politólogos Amadores                        │
│  5 membros · 3 mercados abertos                  │
│  [Ver grupo →]                                   │
└──────────────────────────────────────────────────┘
```

---

#### /grupo/[slug]
Página do grupo com 3 tabs:

```
[Mercados]  [Ranking]  [Membros]
```

**Tab Mercados:**
```
┌──────────────────────────────────────────────────────┐
│  📊 Mercados do Grupo          [+ Criar mercado]     │
├──────────────────────────────────────────────────────┤
│  🟢 Abertos (3)                                      │
│                                                      │
│  "Lula vence as eleições 2026?"                      │
│  Criado por Bruno · Encerra 5 Out 2026               │
│  ████████████░░░░ 67%  média · 10/12 votaram         │
│  Meu voto: 72%  [✏️ Alterar]                         │
│                                                      │
│  "Bitcoin > $200k até Dezembro?"                     │
│  Criado por Ana · Encerra 31 Dez 2026                │
│  ██████░░░░░░░░░░ 38%  média · 12/12 votaram         │
│  [Votar →]                                           │
├──────────────────────────────────────────────────────┤
│  🔒 Resolvidos (5)                                   │
│                                                      │
│  ✅ SIM "Time sobe pra Série A?"                     │
│  Média: 72% · Resolução: SIM                         │
│  🏆 Melhor: Pedro (82%) · Meu voto: 65% ✅ Acertei  │
└──────────────────────────────────────────────────────┘
```

**Tab Ranking:**
```
┌────────────────────────────────────────────────────┐
│  #   Nome         Calibração   Acertos   Mercados  │
├────────────────────────────────────────────────────┤
│  🥇  Ana Silva    81%           9/10      10       │
│  🥈  João Costa   74%           8/10      9        │
│  🥉  Bruno Teo    72%           7/10      10       │
└────────────────────────────────────────────────────┘
```

---

#### /grupo/join/[inviteCode]
Página de entrada similar ao bolão.

---

#### Modal de criar mercado
```
┌──────────────────────────────────────────────────┐
│  📊 Novo mercado do grupo                        │
│                                                  │
│  Questão *                                       │
│  [Lula vence as eleições 2026?        ]          │
│                                                  │
│  Descrição (opcional)                            │
│  [Contexto adicional...               ]          │
│                                                  │
│  Categoria                                       │
│  [🏛️ Política                        ▼]          │
│                                                  │
│  Data de resolução *                             │
│  [05/10/2026]                                    │
│                                                  │
│  💡 Após esta data, o criador ou admin           │
│     declara o resultado (Sim ou Não).            │
│                                                  │
│  [Cancelar]          [Criar mercado →]           │
└──────────────────────────────────────────────────┘
```

---

#### Modal de votar
```
┌──────────────────────────────────────────────────┐
│  "Lula vence as eleições 2026?"                  │
│  Criado por Bruno · Encerra 5 Out 2026           │
│  Média do grupo: 67% (10 votos)                  │
│                                                  │
│  Qual é a tua probabilidade?                     │
│                                                  │
│  Muito improvável ←─────────→ Muito provável     │
│  [slider 1-99]                        72%        │
│                                                  │
│  [Submeter voto →]                               │
│                                                  │
│  ℹ️ Podes alterar até à data de encerramento.    │
└──────────────────────────────────────────────────┘
```

---

#### Modal de resolver
```
┌──────────────────────────────────────────────────┐
│  Resolver mercado                                │
│  "Lula vence as eleições 2026?"                  │
│                                                  │
│  [✅ SIM — aconteceu]                            │
│  [❌ NÃO — não aconteceu]                        │
│  [⚪ Cancelado — mercado inválido]               │
│                                                  │
│  Nota (opcional)                                 │
│  [Lula venceu no 2º turno com 51%    ]           │
│                                                  │
│  [Resolver →]                                    │
└──────────────────────────────────────────────────┘
```

---

### 2.5 Componentes a criar

| Componente | Descrição |
|-----------|-----------|
| `GrupoCard.tsx` | Card na listagem /grupos |
| `GrupoRanking.tsx` | Ranking de forecasters com score calibração |
| `GrupoMercadoCard.tsx` | Card de mercado com barra de probabilidade |
| `GrupoMercadosList.tsx` | Lista separada em abertos/resolvidos |
| `GrupoMembros.tsx` | Lista de membros |
| `CreateGrupoModal.tsx` | Modal de criar grupo |
| `CreateMercadoModal.tsx` | Modal de criar mercado |
| `VotarModal.tsx` | Modal de votar com slider |
| `ResolverMercadoModal.tsx` | Modal de resolver |
| `GrupoInvite.tsx` | Link de convite |

---

### 2.6 Notificações dos mercados

```
Novo mercado no grupo:
"📊 [Nome] criou um mercado: 'Lula vence as eleições 2026?'"

Mercado a encerrar (24h antes):
"⏰ O mercado '[Questão]' encerra amanhã. Ainda não votaste!"

Mercado resolvido:
"🎯 Resultado: SIM — 'Lula vence as eleições 2026?'
   Média do grupo era 67% — grupo acertou!
   🏆 Melhor forecaster: Pedro (82%)"

Se acertou:
"✅ Acertaste! O teu voto era 72%."

Se errou:
"❌ Erraste. O teu voto era 28%."
```

---

## PARTE 3 — NAVEGAÇÃO GLOBAL

### 3.1 Navbar — novos links

```
predlab  |  Dashboard  Bolões  Grupos  Rankings  |  [perfil]
```

Separar claramente:
- **Bolões** → `/boloes` — palpites tradicionais
- **Grupos** → `/grupos` — mercados de probabilidade

---

### 3.2 Dashboard — cards de acesso rápido

Adicionar ao dashboard existente:

```
┌─────────────────┐  ┌─────────────────┐
│  🏆 Meus Bolões │  │  🔮 Meus Grupos │
│  3 activos      │  │  2 activos      │
│  [Ver →]        │  │  [Ver →]        │
└─────────────────┘  └─────────────────┘
```

---

## PARTE 4 — LIMPEZA DO CÓDIGO ACTUAL

O Claude Code implementou bolões e mercados misturados. Antes de implementar
este spec, executar estas limpezas:

1. **Remover** a tab "Mercados" de dentro da página `/bolao/[slug]`
2. **Remover** o model `BolaoPredicao` do schema (previsões individuais dentro do bolão — não faz sentido no modelo novo)
3. **Remover** o model `GrupoMercado` que estava dentro do bolão e substituir pelo novo model `GrupoMercado` dentro do `Grupo`
4. **Manter** o model `BolaoMember`, `BolaoPayment` e a lógica de convite — continuam válidos
5. **Actualizar** a navbar para ter links separados Bolões e Grupos

---

## PARTE 5 — ORDEM DE IMPLEMENTAÇÃO

### Bloco 0 — Limpeza (fazer primeiro)
1. Remover tab Mercados de /bolao/[slug]
2. Limpar models desnecessários do schema
3. `npx prisma db push && npx prisma generate`

### Bloco 1 — Schema completo
4. Adicionar todos os models novos ao schema
5. `npx prisma db push && npx prisma generate`

### Bloco 2 — Bolão Tradicional (APIs)
6. `POST /api/boloes` — criar
7. `GET /api/boloes` — listar
8. `GET /api/boloes/[slug]` — detalhes + ranking
9. `POST /api/boloes/join/[inviteCode]` — entrar
10. `GET /api/boloes/[slug]/jogos` — listar jogos
11. `POST /api/boloes/[slug]/jogos` — criar jogo (admin)
12. `POST /api/boloes/[slug]/jogos/[jogoId]/palpite` — palpitar
13. `PATCH /api/boloes/[slug]/jogos/[jogoId]/resultado` — resultado (admin)
14. `PATCH /api/boloes/[slug]/payments/[userId]` — pagamentos

### Bloco 3 — Bolão Tradicional (UI)
15. Página `/boloes` com lista e botão criar
16. Componente `BolaoCard.tsx`
17. Modal `CreateBolaoModal.tsx` (3 passos)
18. Página `/bolao/[slug]` com 4 tabs
19. Componente `BolaoRanking.tsx`
20. Componente `BolaoJogosList.tsx` + `BolaoJogoCard.tsx`
21. Modal `PalpiteModal.tsx` (SPORTS + CUSTOM)
22. Modal `CreateJogoModal.tsx` (admin)
23. Modal `ResultadoModal.tsx` (admin)
24. Componente `BolaoPayments.tsx`
25. Página `/bolao/join/[inviteCode]`

### Bloco 4 — Grupos (APIs)
26. `POST /api/grupos` — criar
27. `GET /api/grupos` — listar
28. `GET /api/grupos/[slug]` — detalhes + ranking
29. `POST /api/grupos/join/[inviteCode]` — entrar
30. `GET + POST /api/grupos/[slug]/mercados` — listar + criar
31. `POST /api/grupos/[slug]/mercados/[id]/votar` — votar
32. `PATCH /api/grupos/[slug]/mercados/[id]/resolver` — resolver

### Bloco 5 — Grupos (UI)
33. Página `/grupos` com lista e botão criar
34. Componente `GrupoCard.tsx`
35. Modal `CreateGrupoModal.tsx`
36. Página `/grupo/[slug]` com 3 tabs
37. Componente `GrupoMercadosList.tsx` + `GrupoMercadoCard.tsx`
38. Modal `CreateMercadoModal.tsx`
39. Modal `VotarModal.tsx`
40. Modal `ResolverMercadoModal.tsx`
41. Componente `GrupoRanking.tsx`
42. Página `/grupo/join/[inviteCode]`

### Bloco 6 — Navegação
43. Actualizar navbar com links Bolões e Grupos
44. Actualizar dashboard com cards de acesso rápido

---

## NOTAS FINAIS IMPORTANTES

- **Palpite de bolão ≠ previsão de probabilidade** — nunca misturar os dois
- **Bloqueio de palpite** — após `scheduledAt` do jogo, palpite fica bloqueado
- **Resultado manual** — admin preenche sempre, sem integração com API externa por enquanto
- **Score do grupo** (calibração) é independente do score global do PredLab
- **Convites separados** — `/bolao/join/` para bolões, `/grupo/join/` para grupos
- **Cancelado** não penaliza ninguém — nem em bolão nem em mercado de grupo
