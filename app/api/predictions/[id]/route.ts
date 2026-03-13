import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Resolution } from "@prisma/client"
import { onPredictionResolved } from "@/lib/gamification"

const IMMUTABLE_FIELDS = ["title", "probability", "category", "expiresAt"]

// Only mutable fields are allowed
const patchSchema = z.object({
  description: z.string().optional(),
  evidence: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  resolution: z.nativeEnum(Resolution).optional(),
})

const DELETE_WINDOW_MS = 10 * 60 * 1000 // 10 minutes

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const prediction = await prisma.prediction.findFirst({
    where: { id: params.id, userId: session.user.id },
  })

  if (!prediction) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(prediction)
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()

    // Reject attempts to mutate immutable fields
    const attemptedImmutable = IMMUTABLE_FIELDS.filter((f) => f in body)
    if (attemptedImmutable.length > 0) {
      return NextResponse.json(
        { error: `Os campos ${attemptedImmutable.join(", ")} não podem ser alterados após a criação.` },
        { status: 403 }
      )
    }

    const data = patchSchema.parse(body)

    const prediction = await prisma.prediction.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!prediction) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Prevent re-resolving an already resolved prediction
    if (data.resolution && prediction.resolution) {
      return NextResponse.json(
        { error: "Esta previsão já foi resolvida e não pode ser alterada." },
        { status: 403 }
      )
    }

    const updated = await prisma.prediction.update({
      where: { id: params.id },
      data: {
        ...data,
        ...(data.resolution
          ? { resolvedAt: new Date(), resolutionType: "MANUAL" }
          : {}),
      },
    })

    // Gamification — fire and forget
    if (data.resolution) {
      onPredictionResolved(
        session.user.id,
        params.id,
        data.resolution,
        prediction.probability,
        prediction.coinsAllocated ?? null
      ).catch(() => {})
    }

    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
    }
    return NextResponse.json({ error: "Erro interno." }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const prediction = await prisma.prediction.findFirst({
    where: { id: params.id, userId: session.user.id },
  })

  if (!prediction) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const ageMs = Date.now() - new Date(prediction.createdAt).getTime()
  if (ageMs > DELETE_WINDOW_MS) {
    return NextResponse.json(
      { error: "O prazo de 10 minutos para apagar esta previsão expirou." },
      { status: 403 }
    )
  }

  await prisma.prediction.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
