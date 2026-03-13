import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

  if (!prediction?.polymarketSlug) {
    return NextResponse.json({ error: "Sem mercado linkado" }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://gamma-api.polymarket.com/markets?slug=${prediction.polymarketSlug}`,
      { headers: { Accept: "application/json" } }
    )

    if (!res.ok)
      return NextResponse.json({ error: "Erro Polymarket" }, { status: 500 })

    const [market] = await res.json()
    if (!market)
      return NextResponse.json(
        { error: "Mercado não encontrado" },
        { status: 404 }
      )

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
    const probability = Math.round(parseFloat(prices[idx]) * 100)

    const updated = await prisma.prediction.update({
      where: { id: params.id },
      data: { polymarketProbability: probability, polymarketUpdatedAt: new Date() },
    })

    return NextResponse.json({
      probability,
      updatedAt: updated.polymarketUpdatedAt,
    })
  } catch (error) {
    console.error("Refresh market error:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar mercado" },
      { status: 500 }
    )
  }
}
