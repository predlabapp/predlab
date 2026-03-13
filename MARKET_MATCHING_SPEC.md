# Market Matching — Spec Técnico para Claude Code

## Objetivo
Quando um utilizador cria uma previsão, o sistema automaticamente:
1. Busca mercados relacionados no Polymarket via API pública
2. Usa Claude (IA) para identificar o mercado mais semanticamente equivalente
3. Guarda o match no banco de dados
4. Exibe a probabilidade do mercado no card da previsão, ao lado da probabilidade do utilizador

Resultado visual no card:
```
Tua previsão:    72%  ████████████████████░░░░
Polymarket:      41%  ███████████░░░░░░░░░░░░░  ← novo
```

---

## 1. Alteração no Schema Prisma

Adicionar campos ao model `Prediction` em `prisma/schema.prisma`:

```prisma
model Prediction {
  // ... campos existentes ...

  // Market matching
  polymarketSlug        String?   // slug do mercado no Polymarket
  polymarketQuestion    String?   // texto da pergunta no Polymarket
  polymarketProbability Float?    // probabilidade atual (0-100)
  polymarketUrl         String?   // URL completa do mercado
  polymarketUpdatedAt   DateTime? // última vez que a probabilidade foi atualizada
}
```

Após alterar, rodar:
```bash
npx prisma db push
npx prisma generate
```

---

## 2. Nova API Route: POST /api/predictions/[id]/market-match

Criar ficheiro: `app/api/predictions/[id]/market-match/route.ts`

### Lógica completa:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Passo 1: Buscar mercados no Polymarket
async function searchPolymarketMarkets(query: string) {
  const encoded = encodeURIComponent(query);
  const res = await fetch(
    `https://gamma-api.polymarket.com/markets?search=${encoded}&limit=10&active=true&closed=false`,
    { headers: { "Accept": "application/json" } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  // Retorna array de { id, question, slug, outcomePrices, outcomes }
  return data || [];
}

// Passo 2: Usar Claude para fazer o match semântico
async function findBestMatch(predictionTitle: string, markets: any[]) {
  if (markets.length === 0) return null;

  const marketList = markets.map((m: any, i: number) => 
    `${i}: "${m.question}" (slug: ${m.slug})`
  ).join("\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 200,
    messages: [{
      role: "user",
      content: `Prediction: "${predictionTitle}"

Polymarket markets:
${marketList}

Which market index (0-${markets.length - 1}) is semantically equivalent or very similar to this prediction?
Reply with ONLY a JSON: {"index": NUMBER} or {"index": null} if none match well.`
    }]
  });

  try {
    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    if (parsed.index === null || parsed.index === undefined) return null;
    return markets[parsed.index] || null;
  } catch {
    return null;
  }
}

// Passo 3: Extrair probabilidade do mercado
function extractProbability(market: any): number | null {
  try {
    // Polymarket retorna outcomePrices como string JSON array, ex: "[0.41, 0.59]"
    // O primeiro valor é a probabilidade de "Yes"
    const prices = typeof market.outcomePrices === "string"
      ? JSON.parse(market.outcomePrices)
      : market.outcomePrices;
    
    const yesIndex = market.outcomes 
      ? (typeof market.outcomes === "string" ? JSON.parse(market.outcomes) : market.outcomes)
          .findIndex((o: string) => o.toLowerCase() === "yes")
      : 0;
    
    const prob = parseFloat(prices[yesIndex >= 0 ? yesIndex : 0]);
    return isNaN(prob) ? null : Math.round(prob * 100);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prediction = await prisma.prediction.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!prediction) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    // 1. Buscar mercados no Polymarket
    const markets = await searchPolymarketMarkets(prediction.title);

    // 2. Claude faz o match semântico
    const bestMatch = await findBestMatch(prediction.title, markets);

    if (!bestMatch) {
      return NextResponse.json({ matched: false, message: "Nenhum mercado equivalente encontrado" });
    }

    // 3. Extrair probabilidade
    const probability = extractProbability(bestMatch);

    // 4. Guardar no banco
    const updated = await prisma.prediction.update({
      where: { id: params.id },
      data: {
        polymarketSlug: bestMatch.slug,
        polymarketQuestion: bestMatch.question,
        polymarketProbability: probability,
        polymarketUrl: `https://polymarket.com/event/${bestMatch.slug}`,
        polymarketUpdatedAt: new Date(),
      },
    });

    return NextResponse.json({
      matched: true,
      market: {
        question: bestMatch.question,
        probability,
        url: `https://polymarket.com/event/${bestMatch.slug}`,
      },
    });

  } catch (error) {
    console.error("Market match error:", error);
    return NextResponse.json({ error: "Erro ao buscar mercado" }, { status: 500 });
  }
}
```

---

## 3. Nova API Route: POST /api/predictions/[id]/refresh-market

Criar ficheiro: `app/api/predictions/[id]/refresh-market/route.ts`

Atualiza apenas a probabilidade de um mercado já linkado (sem chamar Claude de novo):

```typescript
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prediction = await prisma.prediction.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!prediction?.polymarketSlug) {
    return NextResponse.json({ error: "Sem mercado linkado" }, { status: 400 });
  }

  // Buscar probabilidade atualizada diretamente pelo slug
  const res = await fetch(
    `https://gamma-api.polymarket.com/markets?slug=${prediction.polymarketSlug}`,
    { headers: { "Accept": "application/json" } }
  );

  if (!res.ok) return NextResponse.json({ error: "Erro Polymarket" }, { status: 500 });

  const [market] = await res.json();
  if (!market) return NextResponse.json({ error: "Mercado não encontrado" }, { status: 404 });

  // Reutiliza a função extractProbability definida acima (mover para utils)
  const prices = typeof market.outcomePrices === "string"
    ? JSON.parse(market.outcomePrices)
    : market.outcomePrices;
  const probability = Math.round(parseFloat(prices[0]) * 100);

  const updated = await prisma.prediction.update({
    where: { id: params.id },
    data: { polymarketProbability: probability, polymarketUpdatedAt: new Date() },
  });

  return NextResponse.json({ probability, updatedAt: updated.polymarketUpdatedAt });
}
```

---

## 4. Variável de ambiente a adicionar

Em `.env`:
```
ANTHROPIC_API_KEY="sk-ant-..."
```

Em `.env.example`:
```
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

Instalar SDK:
```bash
npm install @anthropic-ai/sdk
```

---

## 5. Alteração no PredictionCard

Em `components/predictions/PredictionCard.tsx`, adicionar o widget de comparação e o botão de match.

### Novo estado e handlers a adicionar:
```typescript
const [matchLoading, setMatchLoading] = useState(false);
const [marketData, setMarketData] = useState<{
  question: string;
  probability: number | null;
  url: string;
} | null>(
  prediction.polymarketSlug
    ? {
        question: prediction.polymarketQuestion,
        probability: prediction.polymarketProbability,
        url: prediction.polymarketUrl,
      }
    : null
);

async function handleMatchMarket() {
  setMatchLoading(true);
  const res = await fetch(`/api/predictions/${prediction.id}/market-match`, {
    method: "POST",
  });
  const data = await res.json();
  if (data.matched) setMarketData(data.market);
  setMatchLoading(false);
}

async function handleRefreshMarket() {
  const res = await fetch(`/api/predictions/${prediction.id}/refresh-market`, {
    method: "POST",
  });
  const data = await res.json();
  if (data.probability !== undefined) {
    setMarketData((prev) => prev ? { ...prev, probability: data.probability } : prev);
  }
}
```

### Novo bloco visual a inserir APÓS a probability bar existente:

```tsx
{/* Market comparison widget */}
{marketData?.probability !== null && marketData?.probability !== undefined ? (
  <div className="rounded-lg p-3 mt-1" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-mono font-medium" style={{ color: "var(--text-muted)" }}>
        vs Polymarket
      </span>
      <a
        href={marketData.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs underline"
        style={{ color: "var(--accent)" }}
      >
        ver mercado ↗
      </a>
    </div>

    {/* Comparison bars */}
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs w-16 text-right font-mono" style={{ color: "var(--text-muted)" }}>Tu</span>
        <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--border)" }}>
          <div className="h-full rounded-full" style={{ width: `${prediction.probability}%`, background: getProbabilityColor(prediction.probability) }} />
        </div>
        <span className="text-xs w-8 font-bold font-mono" style={{ color: getProbabilityColor(prediction.probability) }}>
          {prediction.probability}%
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs w-16 text-right font-mono" style={{ color: "var(--text-muted)" }}>Mercado</span>
        <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--border)" }}>
          <div className="h-full rounded-full" style={{ width: `${marketData.probability}%`, background: "var(--accent)" }} />
        </div>
        <span className="text-xs w-8 font-bold font-mono" style={{ color: "var(--accent)" }}>
          {marketData.probability}%
        </span>
      </div>
    </div>

    {/* Divergence badge */}
    {Math.abs(prediction.probability - (marketData.probability ?? 0)) >= 15 && (
      <div className="mt-2 text-xs font-mono px-2 py-1 rounded" style={{ background: "rgba(124,106,247,0.1)", color: "var(--accent)" }}>
        ⚡ Divergência de {Math.abs(prediction.probability - (marketData.probability ?? 0))}% face ao mercado
      </div>
    )}

    <button
      onClick={handleRefreshMarket}
      className="mt-2 text-xs"
      style={{ color: "var(--text-muted)" }}
    >
      ↻ Atualizar probabilidade
    </button>
  </div>
) : !prediction.resolution ? (
  <button
    onClick={handleMatchMarket}
    disabled={matchLoading}
    className="text-xs px-3 py-1.5 rounded-lg w-full mt-1 transition-all"
    style={{
      background: "var(--bg)",
      border: "1px dashed var(--border)",
      color: "var(--text-muted)",
    }}
  >
    {matchLoading ? "🔍 Buscando no Polymarket..." : "🔗 Comparar com Polymarket"}
  </button>
) : null}
```

---

## 6. Atualizar o card de partilha (share)

Em `handleShare` dentro do `PredictionCard.tsx`, atualizar o texto para incluir a comparação quando disponível:

```typescript
function handleShare() {
  const marketLine = marketData?.probability !== null && marketData?.probability !== undefined
    ? `\nPolymarket: ${marketData.probability}% | Divergência: ${Math.abs(prediction.probability - marketData.probability)}%`
    : "";

  const text = `🔮 A minha previsão: "${prediction.title}"

A minha probabilidade: ${prediction.probability}%${marketLine}
Categoria: ${category?.label}

Regista as tuas em predictionjournal.com`;

  navigator.clipboard?.writeText(text);
}
```

---

## 7. Atualizar o CreatePredictionModal (opcional mas recomendado)

Após criar a previsão com sucesso, automaticamente disparar o market match em background:

```typescript
// Em DashboardClient.tsx, dentro de handleCreate:
async function handleCreate(data: any) {
  const res = await fetch("/api/predictions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (res.ok) {
    const prediction = await res.json();
    setPredictions((prev) => [prediction, ...prev]);
    setStats((prev) => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }));

    // Disparar market match em background (não aguardar)
    fetch(`/api/predictions/${prediction.id}/market-match`, { method: "POST" })
      .then((r) => r.json())
      .then((matchData) => {
        if (matchData.matched) {
          // Atualizar o card com os dados do mercado
          setPredictions((prev) =>
            prev.map((p) =>
              p.id === prediction.id
                ? {
                    ...p,
                    polymarketQuestion: matchData.market.question,
                    polymarketProbability: matchData.market.probability,
                    polymarketUrl: matchData.market.url,
                  }
                : p
            )
          );
        }
      })
      .catch(() => {}); // silencioso se falhar
  }
}
```

---

## 8. Resumo dos ficheiros a criar/modificar

| Ficheiro | Ação |
|----------|------|
| `prisma/schema.prisma` | Adicionar 5 campos ao model Prediction |
| `app/api/predictions/[id]/market-match/route.ts` | **Criar** |
| `app/api/predictions/[id]/refresh-market/route.ts` | **Criar** |
| `components/predictions/PredictionCard.tsx` | Modificar — adicionar widget |
| `components/dashboard/DashboardClient.tsx` | Modificar — auto-match após criar |
| `.env` + `.env.example` | Adicionar ANTHROPIC_API_KEY |
| `package.json` | Adicionar @anthropic-ai/sdk |

---

## 9. Ordem de implementação recomendada

1. `npm install @anthropic-ai/sdk`
2. Adicionar `ANTHROPIC_API_KEY` no `.env`
3. Atualizar `prisma/schema.prisma` + `npx prisma db push` + `npx prisma generate`
4. Criar `market-match/route.ts`
5. Criar `refresh-market/route.ts`
6. Modificar `PredictionCard.tsx` — adicionar widget visual
7. Modificar `DashboardClient.tsx` — auto-match em background
8. Testar com uma previsão sobre Bitcoin ou eleições (mercados com maior liquidez no Polymarket)

---

## 10. Notas importantes

- A API do Polymarket (`gamma-api.polymarket.com`) é pública e gratuita, sem autenticação
- O campo `outcomePrices` vem como string JSON do tipo `"[\"0.41\", \"0.59\"]"` — fazer parse
- Nem toda previsão terá equivalente no Polymarket — o botão só aparece se a previsão não estiver resolvida
- O match automático em background não bloqueia a criação da previsão
- Se o Claude retornar `null` no match, o botão manual continua disponível no card
- Polymarket foca em eventos com data definida e outcomes binários (Yes/No) — previsões muito abertas podem não ter match
