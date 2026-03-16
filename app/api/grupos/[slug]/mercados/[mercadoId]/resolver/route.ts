import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { GrupoResolution } from "@prisma/client"
import { notifyMercadoResolved } from "@/lib/notifications"

const resolverSchema = z.object({
  resolution: z.nativeEnum(GrupoResolution),
})

export async function PATCH(
  req: Request,
  { params }: { params: { slug: string; mercadoId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const grupo = await prisma.grupo.findUnique({
    where: { slug: params.slug },
    include: {
      members: { select: { id: true, userId: true, role: true } },
    },
  })
  if (!grupo) return NextResponse.json({ error: "Grupo não encontrado." }, { status: 404 })

  const membership = grupo.members.find((m) => m.userId === session.user.id)
  if (!membership) return NextResponse.json({ error: "Você não é membro deste grupo." }, { status: 403 })

  const mercado = await prisma.grupoMercado.findFirst({
    where: { id: params.mercadoId, grupoId: grupo.id },
    include: {
      votos: {
        include: { member: { select: { id: true, userId: true } } },
      },
    },
  })
  if (!mercado) return NextResponse.json({ error: "Mercado não encontrado." }, { status: 404 })
  if (mercado.resolvedAt) return NextResponse.json({ error: "Mercado já foi resolvido." }, { status: 400 })

  // Only creator or admin can resolve
  const isAdmin = membership.role === "ADMIN"
  const isCreator = mercado.creatorId === session.user.id
  if (!isAdmin && !isCreator) {
    return NextResponse.json({ error: "Apenas o criador ou admin pode resolver este mercado." }, { status: 403 })
  }

  const body = await req.json()
  const parsed = resolverSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Dados inválidos." }, { status: 400 })
  }

  const { resolution } = parsed.data

  await prisma.grupoMercado.update({
    where: { id: mercado.id },
    data: {
      resolution,
      resolvedAt: new Date(),
      resolvedById: session.user.id,
      isOpen: false,
    },
  })

  // Build notification data
  const allMemberUserIds = grupo.members.map((m) => m.userId)

  // Find best forecaster (closest to correct answer)
  let bestForecaster: string | null = null
  if (resolution !== "CANCELADO" && mercado.votos.length > 0) {
    const target = resolution === "SIM" ? 100 : 0
    let bestErro = Infinity
    let bestUserId: string | null = null
    for (const v of mercado.votos) {
      const erro = Math.abs(v.probability - target)
      if (erro < bestErro) {
        bestErro = erro
        bestUserId = v.member.userId
      }
    }
    if (bestUserId) {
      const bestUser = await prisma.user.findUnique({
        where: { id: bestUserId },
        select: { name: true },
      })
      bestForecaster = bestUser?.name ?? null
    }
  }

  const mediaGrupo = mercado.votos.length > 0
    ? mercado.votos.reduce((sum, v) => sum + v.probability, 0) / mercado.votos.length
    : null

  const votosForNotify = mercado.votos.map((v) => ({
    userId: v.member.userId,
    probability: v.probability,
  }))

  notifyMercadoResolved(
    mercado.question,
    grupo.slug,
    resolution,
    mediaGrupo,
    bestForecaster,
    votosForNotify,
    allMemberUserIds
  ).catch(() => {})

  return NextResponse.json({ success: true })
}
