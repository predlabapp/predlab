import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Category } from "@prisma/client"

export type MarketResult = {
  id: string
  source: "polymarket"
  question: string
  slug: string
  probability: number
  volume: number
  endDate: string | null
  url: string
  suggestedCategory: Category
}

// Map Polymarket tags → our Category enum
function detectCategory(tags: any[], question: string): Category {
  const slugs = tags.map((t) =>
    typeof t === "string" ? t : (t?.slug ?? t?.label ?? "")
  ).join(" ").toLowerCase()
  const q = question.toLowerCase()
  const text = slugs + " " + q

  if (/crypto|bitcoin|btc|ethereum|eth|defi|nft|web3|token|coin/.test(text)) return "MARKETS"
  if (/stock|s&p|nasdaq|dow|equity|market|trading|rate|fed|inflation|gdp|economy|finance/.test(text)) return "ECONOMY"
  if (/election|president|senate|congress|vote|political|democrat|republican|trump|biden|govern/.test(text)) return "GEOPOLITICS"
  if (/war|russia|ukraine|china|taiwan|nato|conflict|sanctions|geopolit|nuclear|ceasefire/.test(text)) return "GEOPOLITICS"
  if (/nfl|nba|mlb|nhl|soccer|football|basketball|baseball|tennis|golf|olympic|championship|world cup|super bowl/.test(text)) return "SPORTS"
  if (/ai|artificial intelligence|openai|gpt|llm|machine learning|tech|apple|google|microsoft|meta|nvidia|startup/.test(text)) return "TECHNOLOGY"
  if (/startup|ipo|venture|valuation|funding|unicorn|acquisition/.test(text)) return "STARTUPS"
  if (/science|climate|space|nasa|nasa|health|covid|cancer|vaccine|drug|fda|physics/.test(text)) return "SCIENCE"
  if (/movie|music|oscar|grammy|celebrity|album|actor|film|tv|show|culture|award/.test(text)) return "CULTURE"

  return "OTHER"
}

function normalizeMarket(m: any): MarketResult | null {
  try {
    const prices =
      typeof m.outcomePrices === "string"
        ? JSON.parse(m.outcomePrices)
        : m.outcomePrices ?? ["0.5", "0.5"]

    const outcomes =
      typeof m.outcomes === "string"
        ? JSON.parse(m.outcomes)
        : m.outcomes ?? ["Yes", "No"]

    const yesIdx = outcomes.findIndex(
      (o: string) => o.toLowerCase() === "yes"
    )
    const idx = yesIdx >= 0 ? yesIdx : 0
    const prob = Math.round(parseFloat(prices[idx]) * 100)

    if (isNaN(prob)) return null

    const tags = Array.isArray(m.tags) ? m.tags : []
    const vol = parseFloat(m.volume ?? m.volumeNum ?? "0") || 0

    return {
      id: m.slug,
      source: "polymarket",
      question: m.question,
      slug: m.slug,
      probability: prob,
      volume: vol,
      endDate: m.endDate ?? m.endDateIso ?? null,
      url: `https://polymarket.com/event/${m.slug}`,
      suggestedCategory: detectCategory(tags, m.question),
    }
  } catch {
    return null
  }
}

async function fetchPolymarkets(q: string, limit: number): Promise<MarketResult[]> {
  const base = "https://gamma-api.polymarket.com/markets"

  // Always sort by volume descending so most liquid (= most relevant) come first
  const params = new URLSearchParams({
    limit: String(limit),
    active: "true",
    closed: "false",
    order: "volume",
    ascending: "false",
  })

  if (q) params.set("search", q)

  const res = await fetch(`${base}?${params}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  })

  if (!res.ok) return []

  const data = await res.json()
  return (data ?? [])
    .map(normalizeMarket)
    .filter((m: MarketResult | null): m is MarketResult => m !== null)
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") ?? ""
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30"), 50)

  try {
    const markets = await fetchPolymarkets(q, limit)
    return NextResponse.json(markets)
  } catch (err) {
    console.error("Markets fetch error:", err)
    return NextResponse.json({ error: "Erro ao buscar mercados" }, { status: 500 })
  }
}
