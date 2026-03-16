import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

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
          palpites: { select: { pontos: true } },
        },
      },
      payments: { select: { userId: true, status: true } },
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

  // Build ranking based on palpite pontos
  const memberScores = bolao.members.map((m) => {
    const resolvedPalpites = m.palpites.filter((p) => p.pontos !== null)
    const totalPontos = resolvedPalpites.reduce((sum, p) => sum + (p.pontos ?? 0), 0)
    const palpitesExactos = resolvedPalpites.filter((p) => p.pontos === bolao.pointsExact).length
    const palpitesResultado = resolvedPalpites.filter((p) => p.pontos === bolao.pointsResult).length
    const palpitesErrados = resolvedPalpites.filter((p) => p.pontos === 0).length
    const payment = bolao.payments.find((pay) => pay.userId === m.userId)
    return {
      userId: m.userId,
      name: m.user.name ?? "—",
      image: m.user.image ?? null,
      nickname: m.nickname ?? null,
      streak: m.user.currentStreak,
      badges: m.user.badges.map((b) => b.badgeKey),
      totalPontos,
      palpitesExactos,
      palpitesResultado,
      palpitesErrados,
      totalPalpites: m.palpites.length,
      paymentStatus: payment?.status ?? null,
    }
  }).sort((a, b) => b.totalPontos - a.totalPontos)

  const ranking = memberScores.map((m, idx) => ({ position: idx + 1, ...m }))

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
      hasPrize: bolao.hasPrize,
      prizeDescription: bolao.prizeDescription,
      prizePixKey: isMember ? bolao.prizePixKey : null,
      prizePool: bolao.prizePool,
      prizeDistribution: bolao.prizeDistribution,
      prizeStatus: bolao.prizeStatus,
      type: bolao.type,
      pointsExact: bolao.pointsExact,
      pointsResult: bolao.pointsResult,
    },
    myRole,
    isMember,
    ranking,
    members: bolao.members.map((m) => ({
      userId: m.userId,
      name: m.user.name ?? "—",
      image: m.user.image ?? null,
      nickname: m.nickname ?? null,
      role: m.role,
      joinedAt: m.joinedAt,
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
