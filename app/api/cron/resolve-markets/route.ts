import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { onPredictionResolved } from "@/lib/gamification"
import { Resolution } from "@prisma/client"

// Protect with CRON_SECRET — set this in Vercel env vars
function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization")
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return auth === `Bearer ${secret}`
}

type PolymarketResolution = "Yes" | "No" | "Cancelled" | "N/A" | "MKT" | null

async function fetchMarketResolution(slug: string): Promise<{
  resolved: boolean
  result: PolymarketResolution
  probability: number | null
}> {
  const res = await fetch(
    `https://gamma-api.polymarket.com/markets?slug=${slug}`,
    { headers: { Accept: "application/json" }, next: { revalidate: 0 } }
  )
  if (!res.ok) return { resolved: false, result: null, probability: null }

  const [market] = await res.json()
  if (!market) return { resolved: false, result: null, probability: null }

  const resolved = market.resolved === true || market.resolved === "true"
  const result = (market.resolutionResult ?? null) as PolymarketResolution

  // Extract current probability (for non-resolved markets)
  let probability: number | null = null
  try {
    const prices =
      typeof market.outcomePrices === "string"
        ? JSON.parse(market.outcomePrices)
        : market.outcomePrices ?? []
    const outcomes =
      typeof market.outcomes === "string"
        ? JSON.parse(market.outcomes)
        : market.outcomes ?? []
    const yesIdx = outcomes.findIndex((o: string) => o.toLowerCase() === "yes")
    const idx = yesIdx >= 0 ? yesIdx : 0
    probability = Math.round(parseFloat(prices[idx]) * 100)
  } catch {}

  return { resolved, result, probability }
}

// Core logic: given Polymarket result + user probability → Resolution
function determineResolution(
  polyResult: PolymarketResolution,
  userProbability: number
): Resolution {
  if (!polyResult || polyResult === "Cancelled" || polyResult === "N/A" || polyResult === "MKT") {
    return "CANCELLED"
  }
  if (polyResult === "Yes") {
    return userProbability >= 50 ? "CORRECT" : "INCORRECT"
  }
  if (polyResult === "No") {
    return userProbability < 50 ? "CORRECT" : "INCORRECT"
  }
  return "CANCELLED"
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Fetch all unresolved predictions that are linked to Polymarket
  const predictions = await prisma.prediction.findMany({
    where: {
      polymarketSlug: { not: null },
      resolution: null,
    },
    select: {
      id: true,
      userId: true,
      polymarketSlug: true,
      probability: true,
      coinsAllocated: true,
    },
  })

  if (predictions.length === 0) {
    return NextResponse.json({ processed: 0, resolved: 0 })
  }

  let resolved = 0
  let refreshed = 0
  const errors: string[] = []

  // Process in batches of 10 to avoid rate limiting
  const BATCH = 10
  for (let i = 0; i < predictions.length; i += BATCH) {
    const batch = predictions.slice(i, i + BATCH)

    await Promise.all(
      batch.map(async (prediction) => {
        try {
          const { resolved: isResolved, result, probability } =
            await fetchMarketResolution(prediction.polymarketSlug!)

          if (isResolved && result) {
            const resolution = determineResolution(result, prediction.probability)

            await prisma.prediction.update({
              where: { id: prediction.id },
              data: {
                resolution,
                resolutionType: "AUTOMATIC",
                resolvedAt: new Date(),
              },
            })

            // Fire gamification — CANCELLED predictions don't award/deduct coins
            if ((resolution as string) !== "CANCELLED") {
              await onPredictionResolved(
                prediction.userId,
                prediction.id,
                resolution,
                prediction.probability,
                resolution === "CANCELLED" ? null : (prediction.coinsAllocated ?? null)
              )
            }

            resolved++
          } else if (probability !== null) {
            // Not resolved yet — update probability
            await prisma.prediction.update({
              where: { id: prediction.id },
              data: {
                polymarketProbability: probability,
                polymarketUpdatedAt: new Date(),
              },
            })
            refreshed++
          }
        } catch (err) {
          errors.push(`${prediction.id}: ${String(err)}`)
        }
      })
    )

    // Small delay between batches
    if (i + BATCH < predictions.length) {
      await new Promise((r) => setTimeout(r, 500))
    }
  }

  console.log(`[cron/resolve-markets] processed=${predictions.length} resolved=${resolved} refreshed=${refreshed} errors=${errors.length}`)

  return NextResponse.json({
    processed: predictions.length,
    resolved,
    refreshed,
    errors: errors.length > 0 ? errors : undefined,
  })
}
