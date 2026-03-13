import { NextRequest, NextResponse } from "next/server"

export const revalidate = 600 // 10 minutes

const CATEGORY_MAP: Record<string, string> = {
  politics: "POLITICS",
  political: "POLITICS",
  election: "POLITICS",
  government: "POLITICS",
  crypto: "CRYPTO",
  bitcoin: "CRYPTO",
  ethereum: "CRYPTO",
  defi: "CRYPTO",
  sports: "SPORTS",
  football: "SPORTS",
  soccer: "SPORTS",
  nba: "SPORTS",
  nfl: "SPORTS",
  mma: "SPORTS",
  economy: "ECONOMY",
  economics: "ECONOMY",
  fed: "ECONOMY",
  inflation: "ECONOMY",
  gdp: "ECONOMY",
  tech: "TECH",
  technology: "TECH",
  ai: "TECH",
  openai: "TECH",
  nvidia: "TECH",
  geopolitics: "GEOPOLITICS",
  war: "GEOPOLITICS",
  nato: "GEOPOLITICS",
  russia: "GEOPOLITICS",
  china: "GEOPOLITICS",
  ukraine: "GEOPOLITICS",
}

const LANDING_CATEGORIES: Record<string, string[]> = {
  TRENDING: [],
  POLITICS: ["politics", "election", "government", "political"],
  CRYPTO: ["crypto", "bitcoin", "ethereum", "defi", "blockchain"],
  GEOPOLITICS: ["geopolitics", "war", "nato", "international"],
  SPORTS: ["sports", "football", "soccer", "nba", "nfl", "mma", "tennis"],
  ECONOMY: ["economics", "economy", "fed", "inflation", "gdp", "market"],
  TECH: ["technology", "tech", "ai", "openai", "nvidia", "software"],
}

function detectLandingCategory(market: {
  question: string
  groupItemTitle?: string
  slug: string
  tags?: Array<{ slug?: string; id?: string; label?: string }>
}): string {
  const text = `${market.question} ${market.slug} ${market.groupItemTitle ?? ""}`.toLowerCase()
  const tagSlugs = (market.tags ?? []).map((t) => (t.slug ?? t.label ?? "").toLowerCase())

  for (const [cat, keywords] of Object.entries(LANDING_CATEGORIES)) {
    if (cat === "TRENDING") continue
    for (const kw of keywords) {
      if (text.includes(kw) || tagSlugs.some((s) => s.includes(kw))) {
        return cat
      }
    }
  }

  // Fallback via CATEGORY_MAP
  for (const [kw, cat] of Object.entries(CATEGORY_MAP)) {
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const categoryFilter = searchParams.get("category") ?? "TRENDING"
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 20)

  try {
    const res = await fetch(
      `https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=50&order=volume&ascending=false`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 600 },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ markets: [] }, { status: 502 })
    }

    const data = await res.json()
    const rawMarkets = Array.isArray(data) ? data : []

    // Parse each market
    const parsed = rawMarkets
      .map((m: Record<string, unknown>) => {
        let probability = 50
        try {
          const prices =
            typeof m.outcomePrices === "string"
              ? JSON.parse(m.outcomePrices as string)
              : (m.outcomePrices as number[] | null) ?? []
          const outcomes =
            typeof m.outcomes === "string"
              ? JSON.parse(m.outcomes as string)
              : (m.outcomes as string[] | null) ?? []
          const yesIdx = outcomes.findIndex(
            (o: string) => o.toLowerCase() === "yes"
          )
          const idx = yesIdx >= 0 ? yesIdx : 0
          probability = Math.round(parseFloat(prices[idx]) * 100)
        } catch {}

        const volume = parseFloat(String(m.volume ?? m.volumeNum ?? 0)) || 0
        const volume24h = parseFloat(String(m.volume24hr ?? 0)) || 0
        const prevVolume = volume - volume24h
        const volumeChange24h =
          prevVolume > 0 ? Math.round((volume24h / prevVolume) * 100) : 0

        const category = detectLandingCategory({
          question: String(m.question ?? ""),
          slug: String(m.slug ?? ""),
          groupItemTitle: m.groupItemTitle as string | undefined,
          tags: m.tags as Array<{ slug?: string; label?: string }> | undefined,
        })

        return {
          slug: String(m.slug ?? ""),
          question: String(m.question ?? ""),
          probability,
          volume: Math.round(volume),
          volumeChange24h,
          expiresAt: String(m.endDate ?? m.expiresAt ?? ""),
          category,
          categoryEmoji: getCategoryEmoji(category),
          isHot: volume >= 1_000_000,
          isTrending: volumeChange24h > 20,
        }
      })
      .filter((m) => m.slug && m.question)

    // Filter by category
    let filtered = parsed
    if (categoryFilter !== "TRENDING") {
      filtered = parsed.filter((m) => m.category === categoryFilter)
    }

    // If not enough after filter, fall back to top by volume
    if (filtered.length < 3 && categoryFilter !== "TRENDING") {
      filtered = parsed
    }

    return NextResponse.json({ markets: filtered.slice(0, limit) })
  } catch (err) {
    console.error("[api/markets/hot]", err)
    return NextResponse.json({ markets: [] }, { status: 500 })
  }
}
