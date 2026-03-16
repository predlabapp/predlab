import { NextRequest, NextResponse } from "next/server"

export const revalidate = 600 // 10 minutes

// Map Polymarket tag slugs → our landing categories
const TAG_TO_CATEGORY: Record<string, string> = {
  politics: "POLITICS",
  elections: "POLITICS",
  election: "POLITICS",
  government: "POLITICS",
  "us-politics": "POLITICS",
  crypto: "CRYPTO",
  bitcoin: "CRYPTO",
  ethereum: "CRYPTO",
  defi: "CRYPTO",
  blockchain: "CRYPTO",
  sports: "SPORTS",
  soccer: "SPORTS",
  football: "SPORTS",
  nba: "SPORTS",
  nfl: "SPORTS",
  mma: "SPORTS",
  tennis: "SPORTS",
  "fifa-world-cup": "SPORTS",
  "2026-fifa-world-cup": "SPORTS",
  baseball: "SPORTS",
  golf: "SPORTS",
  economy: "ECONOMY",
  economics: "ECONOMY",
  "fed-rates": "ECONOMY",
  fed: "ECONOMY",
  inflation: "ECONOMY",
  gdp: "ECONOMY",
  "economic-policy": "ECONOMY",
  stocks: "ECONOMY",
  technology: "TECH",
  tech: "TECH",
  ai: "TECH",
  "artificial-intelligence": "TECH",
  openai: "TECH",
  nvidia: "TECH",
  geopolitics: "GEOPOLITICS",
  war: "GEOPOLITICS",
  nato: "GEOPOLITICS",
  russia: "GEOPOLITICS",
  ukraine: "GEOPOLITICS",
  china: "GEOPOLITICS",
  "middle-east": "GEOPOLITICS",
  iran: "GEOPOLITICS",
  israel: "GEOPOLITICS",
}

// Text-based fallback
const TEXT_KEYWORDS: Array<[string, string]> = [
  ["crypto", "CRYPTO"],
  ["bitcoin", "CRYPTO"],
  ["ethereum", "CRYPTO"],
  ["btc", "CRYPTO"],
  ["eth", "CRYPTO"],
  ["world cup", "SPORTS"],
  ["nba", "SPORTS"],
  ["nfl", "SPORTS"],
  ["soccer", "SPORTS"],
  ["football", "SPORTS"],
  ["champion", "SPORTS"],
  ["tournament", "SPORTS"],
  ["fed rate", "ECONOMY"],
  ["inflation", "ECONOMY"],
  ["recession", "ECONOMY"],
  ["gdp", "ECONOMY"],
  ["openai", "TECH"],
  ["nvidia", "TECH"],
  ["apple", "TECH"],
  ["google", "TECH"],
  ["microsoft", "TECH"],
  ["war", "GEOPOLITICS"],
  ["nato", "GEOPOLITICS"],
  ["russia", "GEOPOLITICS"],
  ["ukraine", "GEOPOLITICS"],
  ["china", "GEOPOLITICS"],
  ["iran", "GEOPOLITICS"],
  ["israel", "GEOPOLITICS"],
  ["election", "POLITICS"],
  ["president", "POLITICS"],
  ["congress", "POLITICS"],
  ["senate", "POLITICS"],
  ["parliament", "POLITICS"],
]

function getCategoryFromEvent(event: {
  title: string
  slug: string
  tags?: Array<{ slug?: string; label?: string }>
}): string {
  // 1. Polymarket tags (most accurate)
  for (const tag of event.tags ?? []) {
    const slug = (tag.slug ?? "").toLowerCase()
    if (TAG_TO_CATEGORY[slug]) return TAG_TO_CATEGORY[slug]
  }
  // 2. Text matching on title + slug
  const text = `${event.title} ${event.slug}`.toLowerCase()
  for (const [kw, cat] of TEXT_KEYWORDS) {
    if (text.includes(kw)) return cat
  }
  return "TRENDING"
}

function getCategoryEmoji(cat: string): string {
  const map: Record<string, string> = {
    TRENDING: "🔥",
    POLITICS: "🗳️",
    CRYPTO: "₿",
    GEOPOLITICS: "🌍",
    SPORTS: "⚽",
    ECONOMY: "📈",
    TECH: "💻",
  }
  return map[cat] ?? "🔥"
}

// For a negRisk multi-outcome event, pick the most interesting sub-market:
// prefer the leading candidate (highest Yes price in range 5–95%)
function pickBestMarket(
  markets: Array<Record<string, unknown>>
): { question: string; probability: number } | null {
  if (!markets.length) return null

  const parsed = markets
    .map((m) => {
      try {
        const prices =
          typeof m.outcomePrices === "string"
            ? JSON.parse(m.outcomePrices as string)
            : ((m.outcomePrices as number[]) ?? [])
        const outcomes =
          typeof m.outcomes === "string"
            ? JSON.parse(m.outcomes as string)
            : ((m.outcomes as string[]) ?? [])
        const yesIdx = outcomes.findIndex(
          (o: string) => o.toLowerCase() === "yes"
        )
        const idx = yesIdx >= 0 ? yesIdx : 0
        const probability = Math.round(parseFloat(String(prices[idx])) * 100)
        return { question: String(m.question ?? ""), probability }
      } catch {
        return null
      }
    })
    .filter(Boolean) as Array<{ question: string; probability: number }>

  if (!parsed.length) return null

  // Prefer markets in [5, 95] — interesting enough to display
  const interesting = parsed.filter(
    (m) => m.probability >= 5 && m.probability <= 95
  )

  if (interesting.length > 0) {
    // Among interesting ones, pick the leading candidate (highest probability)
    return interesting.sort((a, b) => b.probability - a.probability)[0]
  }

  // No market in [5,95]: if best probability is ≥ 99 or ≤ 1, skip — market is essentially resolved
  const best = parsed.sort((a, b) => b.probability - a.probability)[0]
  if (best.probability >= 99 || best.probability <= 1) return null
  return best
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const categoryFilter = searchParams.get("category") ?? "TRENDING"
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 20)

  try {
    // Use /events — aggregates sub-markets so volumes reflect real activity
    const res = await fetch(
      `https://gamma-api.polymarket.com/events?active=true&closed=false&limit=100&order=volume24hr&ascending=false`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 600 },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ markets: [] }, { status: 502 })
    }

    const data = await res.json()
    const rawEvents: Array<Record<string, unknown>> = Array.isArray(data)
      ? data
      : []

    const parsed = rawEvents
      .map((e) => {
        const markets = (e.markets as Array<Record<string, unknown>>) ?? []
        const best = pickBestMarket(markets)
        if (!best || !best.question) return null

        const volume = parseFloat(String(e.volume ?? 0)) || 0
        const volume24h = parseFloat(String(e.volume24hr ?? 0)) || 0
        const prevVolume = volume - volume24h
        const volumeChange24h =
          prevVolume > 0 ? Math.round((volume24h / prevVolume) * 100) : 0

        const category = getCategoryFromEvent({
          title: String(e.title ?? ""),
          slug: String(e.slug ?? ""),
          tags: e.tags as Array<{ slug?: string; label?: string }> | undefined,
        })

        return {
          slug: String(e.slug ?? ""),
          question: best.question,
          probability: best.probability,
          volume: Math.round(volume),
          volumeChange24h,
          expiresAt: String(e.endDate ?? ""),
          category,
          categoryEmoji: getCategoryEmoji(category),
          isHot: volume >= 10_000_000,
          isTrending: volume24h >= 1_000_000,
        }
      })
      .filter(Boolean) as Array<{
      slug: string
      question: string
      probability: number
      volume: number
      volumeChange24h: number
      expiresAt: string
      category: string
      categoryEmoji: string
      isHot: boolean
      isTrending: boolean
    }>

    let filtered = parsed
    if (categoryFilter !== "TRENDING") {
      filtered = parsed.filter((m) => m.category === categoryFilter)
    }

    // Fallback: if not enough results for the filter, return global trending
    if (filtered.length < 3 && categoryFilter !== "TRENDING") {
      filtered = parsed
    }

    return NextResponse.json({ markets: filtered.slice(0, limit) })
  } catch (err) {
    console.error("[api/markets/hot]", err)
    return NextResponse.json({ markets: [] }, { status: 500 })
  }
}
