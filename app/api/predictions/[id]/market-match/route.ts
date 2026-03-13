import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function searchPolymarketMarkets(query: string) {
  try {
    // Tenta com a query original
    const encoded = encodeURIComponent(query)
    const res = await fetch(
      `https://gamma-api.polymarket.com/markets?search=${encoded}&limit=15&active=true&closed=false`,
      { headers: { Accept: "application/json" }, next: { revalidate: 0 } }
    )
    if (!res.ok) {
      console.error("Polymarket API error:", res.status, await res.text())
      return []
    }
    const data = await res.json()
    console.log(`Polymarket search "${query}" → ${data?.length ?? 0} results`)
    if (data?.length > 0) return data

    // Se não encontrou, tenta com palavras-chave (primeiras 5 palavras)
    const shortQuery = query.split(" ").slice(0, 5).join(" ")
    if (shortQuery === query) return []

    const encoded2 = encodeURIComponent(shortQuery)
    const res2 = await fetch(
      `https://gamma-api.polymarket.com/markets?search=${encoded2}&limit=15&active=true&closed=false`,
      { headers: { Accept: "application/json" }, next: { revalidate: 0 } }
    )
    if (!res2.ok) return []
    const data2 = await res2.json()
    console.log(`Polymarket short search "${shortQuery}" → ${data2?.length ?? 0} results`)
    return data2 || []
  } catch (err) {
    console.error("searchPolymarketMarkets error:", err)
    return []
  }
}

async function findBestMatch(predictionTitle: string, markets: any[]) {
  if (markets.length === 0) return null

  const marketList = markets
    .map((m: any, i: number) => `${i}: "${m.question}" (slug: ${m.slug})`)
    .join("\n")

  console.log("Asking Claude to match among:\n", marketList)

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `Prediction: "${predictionTitle}"

Polymarket markets:
${marketList}

Which market index (0-${markets.length - 1}) is semantically equivalent or very similar to this prediction?
Reply with ONLY a JSON object: {"index": NUMBER} or {"index": null} if none match well.`,
      },
    ],
  })

  try {
    const text =
      response.content[0].type === "text" ? response.content[0].text : ""
    console.log("Claude response:", text)
    const clean = text.replace(/```json|```/g, "").trim()
    const parsed = JSON.parse(clean)
    if (parsed.index === null || parsed.index === undefined) return null
    return markets[parsed.index] || null
  } catch (err) {
    console.error("Parse error:", err)
    return null
  }
}

function extractProbability(market: any): number | null {
  try {
    const prices =
      typeof market.outcomePrices === "string"
        ? JSON.parse(market.outcomePrices)
        : market.outcomePrices

    const outcomes =
      typeof market.outcomes === "string"
        ? JSON.parse(market.outcomes)
        : market.outcomes ?? []

    const yesIndex = outcomes.findIndex(
      (o: string) => o.toLowerCase() === "yes"
    )

    const idx = yesIndex >= 0 ? yesIndex : 0
    const prob = parseFloat(prices[idx])
    return isNaN(prob) ? null : Math.round(prob * 100)
  } catch (err) {
    console.error("extractProbability error:", err)
    return null
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const prediction = await prisma.prediction.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!prediction)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const markets = await searchPolymarketMarkets(prediction.title)

    if (markets.length === 0) {
      return NextResponse.json({
        matched: false,
        message: "Nenhum mercado encontrado no Polymarket para esta pesquisa",
      })
    }

    const bestMatch = await findBestMatch(prediction.title, markets)

    if (!bestMatch) {
      return NextResponse.json({
        matched: false,
        message: "Nenhum mercado semanticamente equivalente encontrado",
      })
    }

    const probability = extractProbability(bestMatch)
    console.log("Best match:", bestMatch.question, "prob:", probability)

    await prisma.prediction.update({
      where: { id: params.id },
      data: {
        polymarketSlug: bestMatch.slug,
        polymarketQuestion: bestMatch.question,
        polymarketProbability: probability,
        polymarketUrl: `https://polymarket.com/event/${bestMatch.slug}`,
        polymarketUpdatedAt: new Date(),
      },
    })

    return NextResponse.json({
      matched: true,
      market: {
        question: bestMatch.question,
        probability,
        url: `https://polymarket.com/event/${bestMatch.slug}`,
      },
    })
  } catch (error) {
    console.error("Market match error:", error)
    return NextResponse.json(
      { error: "Erro ao buscar mercado" },
      { status: 500 }
    )
  }
}
