import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Category } from "@prisma/client"
import { notifyMercadoCreated } from "@/lib/notifications"

const createSchema = z.object({
  question: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.nativeEnum(Category).optional(),
  expiresAt: z.string(),
})

async function getMembershipAndGrupo(slug: string, userId: string) {
  const grupo = await prisma.grupo.findUnique({
    where: { slug },
    include: { members: { select: { id: true, userId: true, role: true } } },
  })
  if (!grupo) return { grupo: null, membership: null }
  const membership = grupo.members.find((m) => m.userId === userId) ?? null
  return { grupo, membership }
}

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { grupo, membership } = await getMembershipAndGrupo(params.slug, session.user.id)
  if (!grupo) return NextResponse.json({ error: "Grupo não encontrado." }, { status: 404 })
  if (!membership && !grupo.isPublic) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const url = new URL(req.url)
  const statusFilter = url.searchParams.get("status") ?? "all"

  const where: any = { grupoId: grupo.id }
  if (statusFilter === "open") where.isOpen = true
  else if (statusFilter === "resolved") where.isOpen = false

  const mercados = await prisma.grupoMercado.findMany({
    where,
    include: {
      creator: { select: { name: true } },
      votos: {
        include: {
          member: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const totalMembros = grupo.members.length

  const result = mercados.map((m) => {
    const totalVotos = m.votos.length
    const mediaGrupo = totalVotos > 0
      ? Math.round(m.votos.reduce((sum, v) => sum + v.probability, 0) / totalVotos)
      : null

    const meuVoto = membership
      ? (m.votos.find((v) => v.member.user.id === session.user.id)?.probability ?? null)
      : null

    // After resolution: who was closest
    let melhorForecaster: { name: string; probability: number; erro: number } | null = null
    let acertei: boolean | null = null

    if (m.resolution && m.resolution !== "CANCELADO") {
      const correctSide = m.resolution === "SIM"

      if (meuVoto !== null) {
        acertei = correctSide ? meuVoto >= 50 : meuVoto < 50
      }

      const target = correctSide ? 100 : 0
      let bestErro = Infinity
      let bestVoto: typeof m.votos[0] | null = null
      for (const v of m.votos) {
        const erro = Math.abs(v.probability - target)
        if (erro < bestErro) {
          bestErro = erro
          bestVoto = v
        }
      }
      if (bestVoto) {
        melhorForecaster = {
          name: bestVoto.member.user.name ?? "—",
          probability: bestVoto.probability,
          erro: bestErro,
        }
      }
    }

    return {
      id: m.id,
      question: m.question,
      description: m.description,
      category: m.category,
      expiresAt: m.expiresAt,
      resolvedAt: m.resolvedAt,
      resolution: m.resolution,
      isOpen: m.isOpen,
      creatorId: m.creatorId,
      creatorName: m.creator.name ?? "—",
      totalVotos,
      totalMembros,
      mediaGrupo,
      meuVoto,
      acertei,
      melhorForecaster,
    }
  })

  return NextResponse.json({ mercados: result })
}

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { grupo, membership } = await getMembershipAndGrupo(params.slug, session.user.id)
  if (!grupo) return NextResponse.json({ error: "Grupo não encontrado." }, { status: 404 })
  if (!membership) return NextResponse.json({ error: "Apenas membros podem criar mercados." }, { status: 403 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Dados inválidos." }, { status: 400 })
  }

  const { question, description, category, expiresAt } = parsed.data

  const mercado = await prisma.grupoMercado.create({
    data: {
      grupoId: grupo.id,
      creatorId: session.user.id,
      question,
      description,
      category,
      expiresAt: new Date(expiresAt),
    },
  })

  // Notify all other members
  const allMemberUserIds = grupo.members.map((m) => m.userId)
  const creatorName = session.user.name ?? session.user.email ?? "Alguém"
  notifyMercadoCreated(
    question,
    grupo.name,
    grupo.slug,
    creatorName,
    mercado.id,
    allMemberUserIds,
    session.user.id
  ).catch(() => {})

  return NextResponse.json({ mercado }, { status: 201 })
}
