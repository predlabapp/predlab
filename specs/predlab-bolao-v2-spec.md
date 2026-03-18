# BOLAO_V2_SPEC.md — Pagamentos + Mercados Internos de Grupo

## Contexto

Este spec é um complemento ao `BOLAO_SPEC.md` (Fase 1) e ao `BOLAO_PAGAMENTO_SPEC.md`.
A Fase 1 do bolão já foi implementada. Este spec adiciona duas novas features:

1. **Registo de pagamentos** — o admin confirma quem pagou a entrada do bolão
2. **Mercados internos de grupo** — qualquer membro cria questões tipo Polymarket, privadas ao grupo

---

## PARTE 1 — Registo de Pagamentos do Bolão

### Schema Prisma — novo model

Adicionar ao `prisma/schema.prisma`:

```prisma
model BolaoPayment {
  id          String        @id @default(cuid())
  bolaoId     String
  userId      String
  amount      Float         // valor em BRL ex: 20.00
  status      PaymentStatus @default(PENDING)
  confirmedBy String?       // userId do admin que confirmou
  confirmedAt DateTime?
  note        String?       // ex: "Pix recebido às 14h"
  createdAt   DateTime      @default(now())

  bolao     Bolao @relation(fields: [bolaoId], references: [id], onDelete: Cascade)
  user      User  @relation(fields: [userId], references: [id])
  confirmer User? @relation("PaymentConfirmer", fields: [confirmedBy], references: [id])

  @@unique([bolaoId, userId])
  @@map("bolao_payments")
}

enum PaymentStatus {
  PENDING    // ainda não pagou
  CONFIRMED  // admin confirmou recebimento
  REJECTED   // admin rejeitou (ex: valor errado)
}
```

Adicionar ao model `Bolao` (campos já definidos no BOLAO_PAGAMENTO_SPEC.md, apenas adicionar a relação):
```prisma
payments BolaoPayment[]
```

Adicionar ao model `User`:
```prisma
bolaoPayments     BolaoPayment[]
paymentsConfirmed BolaoPayment[] @relation("PaymentConfirmer")
```

---

### APIs de Pagamento

#### GET /api/bolaos/[slug]/payments
Listar todos os pagamentos do bolão.

```typescript
// Apenas membros do bolão podem ver
// Resposta
{
  payments: [
    {
      userId: string
      name: string
      image: string | null
      amount: number
      status: PaymentStatus
      confirmedAt: DateTime | null
      note: string | null
    }
  ],
  summary: {
    total: number        // total de membros
    confirmed: number    // quantos pagaram
    pending: number      // quantos falta pagar
    totalAmount: number  // valor total arrecadado
  }
}
```

---

#### PATCH /api/bolaos/[slug]/payments/[userId]
Admin confirma, rejeita ou adiciona nota ao pagamento de um membro.

```typescript
// Só ADMIN pode chamar
// Body
{
  status: PaymentStatus   // CONFIRMED | REJECTED | PENDING
  note?: string
}

// Lógica
// - Actualizar status do pagamento
// - Se CONFIRMED: enviar notificação ao utilizador
// - Se REJECTED: enviar notificação ao utilizador com motivo
```

---

#### POST /api/bolaos/[slug]/payments/request
Membro sinaliza que fez o pagamento (opcional — admin pode confirmar directamente).

```typescript
// Qualquer membro pode chamar
// Body
{
  note?: string  // ex: "Pix enviado agora"
}
// Cria ou actualiza registo com status PENDING
// Notifica admin: "João sinalizou que fez o pagamento"
```

---

### Componente — BolaoPayments.tsx

Mostrar na página `/bolao/[slug]` quando `hasPrize = true`.

**Vista para membros:**
```
┌──────────────────────────────────────────────────────────┐
│  💰 Pagamentos — Bolão Copa 2026                         │
│  Entrada: R$20 por pessoa  ·  Arrecadado: R$60 / R$200   │
│                                                          │
│  João Silva        R$20   ✅ Confirmado    15/03 14h     │
│  Ana Costa         R$20   ✅ Confirmado    15/03 15h     │
│  Pedro Ramos       R$20   ⏳ Pendente      [Já paguei]   │
│  Maria Oliveira    R$20   ❌ Rejeitado     valor errado  │
│  Bruno Teo         R$20   ⏳ Pendente                    │
│  ...                                                     │
│                                                          │
│  Chave Pix do organizador: 11999999999                   │
│  [📋 Copiar chave Pix]                                   │
└──────────────────────────────────────────────────────────┘
```

**Vista adicional para ADMIN:**
```
  João Silva        R$20   ⏳ Pendente     [✅ Confirmar] [❌ Rejeitar]
```

---

## PARTE 2 — Mercados Internos de Grupo

### Conceito

Qualquer membro do grupo pode criar uma questão tipo Polymarket — privada ao grupo.
Todos os membros respondem com a sua probabilidade (0-99%).
No final, o admin ou criador da questão resolve (Sim/Não).
O sistema mostra a "probabilidade média do grupo" e quem estava mais certo.

Exemplos de questões:
- "Lula vence as eleições 2026?" → grupo diz 54%
- "O nosso time sobe para a Série A?" → grupo diz 72%
- "Bitcoin acima de $200k até Dezembro?" → grupo diz 38%
- "A Ana vai casar este ano?" → grupo diz 85% 😄

---

### Schema Prisma — novos models

```prisma
model GrupoMercado {
  id            String              @id @default(cuid())
  bolaoId       String              // pertence a um bolão/grupo
  creatorId     String
  question      String              // "Lula vence as eleições 2026?"
  description   String?             // contexto adicional
  category      Category?
  expiresAt     DateTime            // quando a questão resolve
  resolvedAt    DateTime?
  resolution    GrupoResolution?    // SIM | NAO | CANCELADO
  resolvedById  String?             // quem resolveu
  isOpen        Boolean @default(true) // false = encerrada para novos votos
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  bolao      Bolao              @relation(fields: [bolaoId], references: [id], onDelete: Cascade)
  creator    User               @relation("MercadoCreator", fields: [creatorId], references: [id])
  resolvedBy User?              @relation("MercadoResolver", fields: [resolvedById], references: [id])
  votos      GrupoMercadoVoto[]

  @@map("grupo_mercados")
}

model GrupoMercadoVoto {
  id          String   @id @default(cuid())
  mercadoId   String
  userId      String
  probability Int      // 1-99
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  mercado GrupoMercado @relation(fields: [mercadoId], references: [id], onDelete: Cascade)
  user    User         @relation(fields: [userId], references: [id])

  @@unique([mercadoId, userId])
  @@map("grupo_mercado_votos")
}

enum GrupoResolution {
  SIM
  NAO
  CANCELADO
}
```

Adicionar ao model `Bolao`:
```prisma
mercados GrupoMercado[]
```

Adicionar ao model `User`:
```prisma
mercadosCriados  GrupoMercado[]       @relation("MercadoCreator")
mercadosResolvidos GrupoMercado[]     @relation("MercadoResolver")
mercadoVotos     GrupoMercadoVoto[]
```

---

### APIs dos Mercados Internos

#### GET /api/bolaos/[slug]/mercados
Listar mercados internos do grupo.

```typescript
// Apenas membros do bolão podem ver
// Query params: ?status=open|resolved|all (default: all)

// Resposta
{
  mercados: [
    {
      id: string
      question: string
      description: string | null
      category: Category | null
      expiresAt: DateTime
      resolvedAt: DateTime | null
      resolution: GrupoResolution | null
      isOpen: boolean
      creatorName: string
      totalVotos: number           // quantos membros votaram
      totalMembros: number         // total de membros do grupo
      mediaGrupo: number | null    // probabilidade média (0-99)
      meuVoto: number | null       // probabilidade que eu dei
      // Após resolução:
      acertou: boolean | null      // se o meu voto estava certo
      melhorForecaster: {          // quem estava mais próximo
        name: string
        probability: number
        error: number              // distância da resposta correcta
      } | null
    }
  ]
}
```

---

#### POST /api/bolaos/[slug]/mercados
Criar novo mercado interno.

```typescript
// Qualquer membro pode criar
// Body
{
  question: string      // obrigatório, máx 200 chars
  description?: string
  category?: Category
  expiresAt: string     // ISO datetime
}

// Validações
// - question não pode ser vazia
// - expiresAt tem de ser no futuro
// - Utilizador tem de ser membro do bolão
```

---

#### POST /api/bolaos/[slug]/mercados/[mercadoId]/votar
Membro submete ou actualiza o seu voto.

```typescript
// Qualquer membro pode votar
// Body
{
  probability: number  // 1-99
}

// Validações
// - Mercado tem de estar aberto (isOpen = true)
// - Mercado não pode estar resolvido
// - Mercado não pode ter expirado
// - Upsert: se já votou, actualiza o voto
```

---

#### PATCH /api/bolaos/[slug]/mercados/[mercadoId]/resolver
Resolver o mercado (declarar resultado Sim/Não).

```typescript
// Só criador do mercado ou ADMIN do bolão pode resolver
// Body
{
  resolution: GrupoResolution  // SIM | NAO | CANCELADO
  note?: string                // ex: "Lula venceu no 2º turno"
}

// Lógica após resolução:
// 1. Marcar isOpen = false
// 2. Gravar resolvedAt e resolution
// 3. Calcular quem acertou (votos >= 50 se SIM, < 50 se NAO)
// 4. Calcular melhor forecaster (menor distância da resposta correcta)
// 5. Actualizar scoreVerified dos utilizadores que tinham previsão ligada
// 6. Enviar notificação a todos os membros com resultado
```

---

#### DELETE /api/bolaos/[slug]/mercados/[mercadoId]
Apagar mercado — só criador pode apagar e apenas antes de ter votos.

```typescript
// Validação: se já tem votos, não pode apagar (apenas cancelar via resolver)
```

---

### Lógica de scoring dos mercados internos

Os votos nos mercados internos **não afectam** o scoreVerified global do utilizador.
Criam um **score interno do grupo** separado:

```typescript
// Para cada mercado resolvido:
// Se resolution = SIM:
//   Acertou quem deu probability >= 50
//   Melhor forecaster = quem deu probability mais alta
//   Score = probability / 100 (Brier-like)
// Se resolution = NAO:
//   Acertou quem deu probability < 50
//   Melhor forecaster = quem deu probability mais baixa
//   Score = (100 - probability) / 100

// Score interno do grupo = média de todos os mercados do grupo onde participou
```

Este score interno aparece no ranking do bolão como coluna adicional:
```
#  Nome      Score Global ⚡  Score Grupo 🏠  Mercados Certos
1  João      84%              72%             8/10
2  Ana       78%              81%             9/10  ← melhor no grupo
```

---

### Páginas e componentes

#### Tabs na página /bolao/[slug]

Adicionar sistema de tabs:

```
[Ranking]  [Previsões]  [Mercados do Grupo]  [Pagamentos]
```

- **Ranking** — tabela já existente
- **Previsões** — previsões partilhadas pelos membros (já existe)
- **Mercados do Grupo** — nova feature desta spec
- **Pagamentos** — nova feature desta spec (só aparece se hasPrize = true)

---

#### Componente GrupoMercados.tsx

Tab "Mercados do Grupo":

```
┌──────────────────────────────────────────────────────────────┐
│  📊 Mercados do Grupo          [+ Criar mercado]             │
├──────────────────────────────────────────────────────────────┤
│  🟢 Abertos (3)                                              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  "Lula vence as eleições 2026?"                        │  │
│  │  Criado por Bruno · Encerra 5 Out 2026                 │  │
│  │                                                        │  │
│  │  Média do grupo: ████████████░░░░ 67%  (8/12 votaram) │  │
│  │  O meu voto: 72%  [✏️ Alterar voto]                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  "Bitcoin > $200k até Dezembro?"                       │  │
│  │  Criado por Ana · Encerra 31 Dez 2026                  │  │
│  │                                                        │  │
│  │  Média do grupo: ██████░░░░░░░░░░ 38%  (12/12 votaram)│  │
│  │  O meu voto: [slider 1-99]  [Votar]                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  🔒 Resolvidos (5)                                           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ✅ SIM  "O nosso time sobe para Série A?"             │  │
│  │  Média do grupo: 72%  ·  Resolução: SIM                │  │
│  │  🏆 Melhor forecaster: Pedro (82% — acertou em cheio)  │  │
│  │  O meu voto: 65% ✅ Acertei                            │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

#### Modal de criar mercado interno

```
┌─────────────────────────────────────────────────────────┐
│  📊 Novo mercado do grupo                               │
│                                                         │
│  Questão *                                              │
│  [Lula vence as eleições 2026?               ]          │
│                                                         │
│  Descrição (opcional)                                   │
│  [Contexto adicional...                      ]          │
│                                                         │
│  Categoria                                              │
│  [🏛️ Política                              ▼]           │
│                                                         │
│  Data de resolução *                                    │
│  [05/10/2026                                 ]          │
│                                                         │
│  💡 Após a data, o criador ou admin declara             │
│     o resultado (Sim ou Não).                           │
│                                                         │
│  [Cancelar]              [Criar mercado →]              │
└─────────────────────────────────────────────────────────┘
```

---

#### Modal de votar

Aparece ao clicar em mercado sem voto:

```
┌─────────────────────────────────────────────────────────┐
│  "Lula vence as eleições 2026?"                         │
│  Criado por Bruno · Encerra 5 Out 2026                  │
│  Média do grupo até agora: 67% (8 votos)                │
│                                                         │
│  Qual é a tua probabilidade?                            │
│                                                         │
│  Muito improvável ←————————→ Muito provável             │
│  [slider 1-99]                           72%            │
│                                                         │
│  ██████████████████████░░░░░░░  72%                     │
│                                                         │
│  [Submeter voto →]                                      │
│                                                         │
│  ℹ️ Só tu e o grupo vêem os votos individuais.          │
│  Podes alterar até à data de encerramento.              │
└─────────────────────────────────────────────────────────┘
```

---

#### Modal de resolver mercado (admin/criador)

```
┌─────────────────────────────────────────────────────────┐
│  Resolver mercado                                       │
│  "Lula vence as eleições 2026?"                         │
│                                                         │
│  Resultado:                                             │
│  [✅ SIM — aconteceu]  [❌ NÃO — não aconteceu]         │
│  [⚪ Cancelado — mercado inválido]                      │
│                                                         │
│  Nota (opcional):                                       │
│  [Lula venceu no 2º turno com 51%         ]             │
│                                                         │
│  [Resolver →]                                           │
└─────────────────────────────────────────────────────────┘
```

---

### Notificações dos mercados internos

```
Novo mercado criado no grupo:
"📊 [Nome] criou um novo mercado no bolão [Nome]: 'Lula vence as eleições 2026?'"

Mercado prestes a encerrar (24h antes):
"⏰ O mercado '[Questão]' encerra amanhã. Ainda não votaste!"

Mercado resolvido:
"🎯 Resultado do mercado '[Questão]': SIM
   Média do grupo era 67% — grupo acertou!
   🏆 Melhor forecaster: Pedro (82%)"

Se o utilizador acertou:
"✅ Acertaste no mercado '[Questão]'! O teu voto era 72%."

Se o utilizador errou:
"❌ Erraste no mercado '[Questão]'. O teu voto era 28%."
```

---

## PARTE 3 — Ranking actualizado do bolão

Com as duas novas features, o ranking do bolão fica mais rico:

```
┌────────────────────────────────────────────────────────────────────┐
│  #   Nome         Score Global ⚡  Score Grupo 🏠  Pagamento       │
├────────────────────────────────────────────────────────────────────┤
│  🥇  João Silva   84%              72%             ✅ Confirmado    │
│  🥈  Ana Costa    78%              81%             ✅ Confirmado    │
│  🥉  Pedro Ramos  72%              68%             ⏳ Pendente      │
│   4  Maria        65%              70%             ❌ Rejeitado     │
└────────────────────────────────────────────────────────────────────┘
```

Ordenação por padrão: Score Global ⚡ (apenas previsões verificadas pelo Polymarket).
Botão para ordenar por Score Grupo 🏠 (mercados internos).

---

## Ficheiros a criar / modificar

| Ficheiro | Acção |
|----------|-------|
| `prisma/schema.prisma` | Adicionar `BolaoPayment`, `GrupoMercado`, `GrupoMercadoVoto`, enums |
| `app/api/bolaos/[slug]/payments/route.ts` | **Criar** — GET lista pagamentos |
| `app/api/bolaos/[slug]/payments/[userId]/route.ts` | **Criar** — PATCH confirmar/rejeitar |
| `app/api/bolaos/[slug]/payments/request/route.ts` | **Criar** — POST membro sinaliza pagamento |
| `app/api/bolaos/[slug]/mercados/route.ts` | **Criar** — GET lista + POST criar |
| `app/api/bolaos/[slug]/mercados/[mercadoId]/route.ts` | **Criar** — DELETE apagar |
| `app/api/bolaos/[slug]/mercados/[mercadoId]/votar/route.ts` | **Criar** — POST votar |
| `app/api/bolaos/[slug]/mercados/[mercadoId]/resolver/route.ts` | **Criar** — PATCH resolver |
| `app/bolao/[slug]/page.tsx` | **Modificar** — adicionar tabs + novos componentes |
| `components/bolao/BolaoPayments.tsx` | **Criar** |
| `components/bolao/GrupoMercados.tsx` | **Criar** |
| `components/bolao/GrupoMercadoCard.tsx` | **Criar** — card individual do mercado |
| `components/bolao/CreateMercadoModal.tsx` | **Criar** |
| `components/bolao/VotarModal.tsx` | **Criar** |
| `components/bolao/ResolverMercadoModal.tsx` | **Criar** |
| `components/bolao/BolaoRanking.tsx` | **Modificar** — adicionar colunas Score Grupo e Pagamento |

---

## Ordem de implementação recomendada

### Bloco 1 — Schema e base
1. Actualizar `prisma/schema.prisma` com todos os novos models
2. `npx prisma db push && npx prisma generate`

### Bloco 2 — Pagamentos
3. `GET /api/bolaos/[slug]/payments`
4. `PATCH /api/bolaos/[slug]/payments/[userId]`
5. `POST /api/bolaos/[slug]/payments/request`
6. Componente `BolaoPayments.tsx`
7. Adicionar tab "Pagamentos" na página `/bolao/[slug]`

### Bloco 3 — Mercados internos
8. `GET + POST /api/bolaos/[slug]/mercados`
9. `POST /api/bolaos/[slug]/mercados/[mercadoId]/votar`
10. `PATCH /api/bolaos/[slug]/mercados/[mercadoId]/resolver`
11. `DELETE /api/bolaos/[slug]/mercados/[mercadoId]`
12. Componente `GrupoMercadoCard.tsx`
13. Modal `CreateMercadoModal.tsx`
14. Modal `VotarModal.tsx`
15. Modal `ResolverMercadoModal.tsx`
16. Componente `GrupoMercados.tsx` (agrega tudo)
17. Adicionar tab "Mercados do Grupo" na página `/bolao/[slug]`

### Bloco 4 — Ranking actualizado
18. Modificar `BolaoRanking.tsx` com colunas Score Grupo e Pagamento

---

## Notas importantes

- Score Grupo (mercados internos) é **independente** do Score Global — não afecta rankings públicos
- Votos nos mercados internos são **visíveis a todos os membros** (não só ao criador)
- Qualquer membro pode criar mercados — não só o admin
- Pagamentos são confirmados **apenas pelo admin** — membros só podem sinalizar
- Um mercado só pode ser resolvido pelo **criador do mercado ou admin do bolão**
- Ao cancelar um mercado (GrupoResolution.CANCELADO) nenhum score é afectado
- Os mercados internos **não têm ligação ao Polymarket** — são completamente privados
