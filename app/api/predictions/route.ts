import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Category } from "@prisma/client"
import { onPredictionCreated } from "@/lib/gamification"
import { randomBytes } from "crypto"

const createSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().optional(),
  probability: z.number().int().min(1).max(99),
  category: z.nativeEnum(Category),
  expiresAt: z.string().datetime(),
  evidence: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  // Optional: pre-linked Polymarket market
  polymarketSlug: z.string().optional(),
  polymarketQuestion: z.string().optional(),
  polymarketProbability: z.number().optional(),
  polymarketUrl: z.string().optional(),
})

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category") as Category | null
  const status = searchParams.get("status")

  const predictions = await prisma.prediction.findMany({
    where: {
      userId: session.user.id,
      ...(category ? { category } : {}),
      ...(status === "pending" ? { resolution: null } : {}),
      ...(status === "resolved" ? { resolution: { not: null } } : {}),
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(predictions)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const {
      polymarketSlug, polymarketQuestion, polymarketProbability, polymarketUrl,
      ...coreData
    } = data

    const prediction = await prisma.prediction.create({
      data: {
        ...coreData,
        userId: session.user.id,
        expiresAt: new Date(data.expiresAt),
        tags: data.tags ?? [],
        isPublic: data.isPublic ?? false,
        shareToken: randomBytes(16).toString("hex"),
        ...(polymarketSlug ? {
          polymarketSlug,
          polymarketQuestion,
          polymarketProbability,
          polymarketUrl,
          polymarketUpdatedAt: new Date(),
        } : {}),
      },
    })

    // Gamification — fire and forget
    onPredictionCreated(session.user.id, prediction.id).catch(() => {})

    return NextResponse.json(prediction, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos.", details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Erro interno." }, { status: 500 })
  }
}
