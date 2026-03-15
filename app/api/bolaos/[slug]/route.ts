import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Category } from "@prisma/client"
import { calculateAccuracyScore } from "@/lib/utils"

const POLYMARKET_BONUS = 10 // bonus pts per auto-verified prediction

function calcMemberScore(predicoes: Array<{
  addedById: string
  prediction: {
    userId: string
    probability: number
    resolution: string | null
    resolutionType: string | null
    resolvedAt: Date | null
  }
}>, userId: string) {
  const mine = predicoes.filter((p) => p.addedById === userId)
  const resolved = mine.filter((p) => p.prediction.resolvedAt && p.prediction.resolution !== "CANCELLED")
  const correct = resolved.filter((p) => p.prediction.resolution === "CORRECT").length
  const verifiedResolved = resolved.filter((p) => p.prediction.resolutionType === "AUTOMATIC")

  const scoreGeneral = calculateAccuracyScore(
    resolved.map((p) => ({ probability: p.prediction.probability, resolution: p.prediction.resolution as any }))
  )
  const scoreVerified = verifiedResolved.length > 0
    ? calculateAccuracyScore(
        verifiedResolved.map((p) => ({ probability: p.prediction.probability, resolution: p.prediction.resolution as any }))
      ) + verifiedResolved.length * POLYMARKET_BONUS
    : 0

  return {
    totalPredictions: mine.length,
    resolvedPredictions: resolved.length,
    correctPredictions: correct,
    scoreGeneral,
    scoreVerified,
  }
}

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions)

  const bolao = await prisma.bolao.findUnique({
    where: { slug: params.slug },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, image: true, currentStreak: true, badges: true } },
        },
      },
      predicoes: {
        include: {
          prediction: true,
          addedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!bolao) {
    return NextResponse.json({ error: "Bolão não encontrado." }, { status: 404 })
  }

  const userId = session?.user?.id ?? null
  const membership = bolao.members.find((m) => m.userId === userId)
  const isMember = !!membership
  const myRole = membership?.role ?? null

  // Private bolão — only members can see details
  if (!bolao.isPublic && !isMember) {
    return NextResponse.json({ error: "Acesso negado. Este bolão é privado." }, { status: 403 })
  }

  // Build ranking
  const ranking = bolao.members
    .map((m, idx) => {
      const scores = calcMemberScore(bolao.predicoes as any, m.userId)
      return {
        userId: m.userId,
        name: m.user.name ?? "—",
        image: m.user.image ?? null,
        nickname: m.nickname ?? null,
        streak: m.user.currentStreak,
        badges: m.user.badges.map((b) => b.badgeKey),
        ...scores,
      }
    })
    .sort((a, b) => b.scoreVerified - a.scoreVerified || b.scoreGeneral - a.scoreGeneral)
    .map((m, idx) => ({ position: idx + 1, ...m }))

  return NextResponse.json({
    bolao: {
      id: bolao.id,
      name: bolao.name,
      description: bolao.description,
      coverEmoji: bolao.coverEmoji,
      slug: bolao.slug,
      inviteCode: isMember ? bolao.inviteCode : null,
      endsAt: bolao.endsAt,
      isPublic: bolao.isPublic,
      creatorId: bolao.creatorId,
      memberCount: bolao.members.length,
    },
    myRole,
    isMember,
    ranking,
    predictions: bolao.predicoes.map((p) => ({
      id: p.id,
      predictionId: p.predictionId,
      addedById: p.addedById,
      addedByName: p.addedBy.name,
      createdAt: p.createdAt,
      prediction: {
        id: p.prediction.id,
        title: p.prediction.title,
        probability: p.prediction.probability,
        category: p.prediction.category,
        resolution: p.prediction.resolution,
        resolvedAt: p.prediction.resolvedAt,
        expiresAt: p.prediction.expiresAt,
        resolutionType: p.prediction.resolutionType,
      },
    })),
  })
}

const editSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  endsAt: z.string().datetime().optional().nullable(),
  maxMembers: z.number().int().min(2).optional().nullable(),
  isPublic: z.boolean().optional(),
  coverEmoji: z.string().max(10).optional(),
  category: z.nativeEnum(Category).optional().nullable(),
})

export async function PATCH(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const bolao = await prisma.bolao.findUnique({
    where: { slug: params.slug },
    include: { members: true },
  })
  if (!bolao) return NextResponse.json({ error: "Não encontrado." }, { status: 404 })

  const member = bolao.members.find((m) => m.userId === session.user.id)
  if (!member || member.role !== "ADMIN") {
    return NextResponse.json({ error: "Apenas admins podem editar o bolão." }, { status: 403 })
  }

  const body = await req.json()
  const parsed = editSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const updated = await prisma.bolao.update({
    where: { slug: params.slug },
    data: {
      ...parsed.data,
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : parsed.data.endsAt,
    },
  })

  return NextResponse.json({ bolao: updated })
}

export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const bolao = await prisma.bolao.findUnique({ where: { slug: params.slug } })
  if (!bolao) return NextResponse.json({ error: "Não encontrado." }, { status: 404 })

  if (bolao.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Apenas o criador pode apagar o bolão." }, { status: 403 })
  }

  await prisma.bolao.delete({ where: { slug: params.slug } })
  return NextResponse.json({ success: true })
}
