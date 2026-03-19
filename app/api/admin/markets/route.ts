import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Category } from "@prisma/client"

function isAdmin(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? ""
  const token = auth.replace("Bearer ", "")
  return token === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const markets = await prisma.customMarket.findMany({
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(markets)
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { question, probability, category, endDate, url } = await req.json()

  if (!question || !probability || !category) {
    return NextResponse.json({ error: "question, probability e category são obrigatórios" }, { status: 400 })
  }

  const market = await prisma.customMarket.create({
    data: {
      question,
      probability: Math.min(99, Math.max(1, Number(probability))),
      category: category as Category,
      endDate: endDate ? new Date(endDate) : null,
      url: url || null,
      active: true,
    },
  })

  return NextResponse.json(market)
}
