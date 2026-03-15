import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Category } from "@prisma/client"
import { notifyMercadoCreated } from "@/lib/notifications"

// GET — listar mercados internos
export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get("status") // "open" | "resolved" | "all"

  const bolao = await prisma.bolao.findUnique({
    where: { slug: params.slug },
    include: {
      members: true,
      mercados: {
        include: {
          creator: { select: { id: true, name: true } },
          votos: { include: { user: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!bolao) return NextResponse.json({ error: "Bolão não encontrado." }, { status: 404 })

  const isMember = bolao.members.some((m) => m.userId === session.user.id)
  if (!isMember) return NextResponse.json({ error: "Apenas membros podem ver os mercados." }, { status: 403 })

  let mercados = bolao.mercados

  if (statusFilter === "open") {
    mercados = mercados.filter((m) => m.isOpen && !m.resolvedAt)
  } else if (statusFilter === "resolved") {
    mercados = mercados.filter((m) => !!m.resolvedAt)
  }

  const totalMembros = bolao.members.length

  const result = mercados.map((m) => {
    const totalVotos = m.votos.length
    const mediaGrupo =
      totalVotos > 0
        ? Math.round(m.votos.reduce((sum, v) => sum + v.probability, 0) / totalVotos)
        : null
    const meuVoto = m.votos.find((v) => v.userId === session.user.id)?.probability ?? null

    let acertou: boolean | null = null
    let melhorForecaster: { name: string; probability: number; error: number } | null = null

    if (m.resolvedAt && m.resolution && m.resolution !== "CANCELADO") {
      const correctSide = m.resolution === "SIM"

      if (meuVoto !== null) {
        acertou = correctSide ? meuVoto >= 50 : meuVoto < 50
      }

      // Melhor forecaster = menor erro absoluto à resposta correcta (SIM=100, NAO=0)
      const correctValue = correctSide ? 100 : 0
      const sorted = [...m.votos]
        .map((v) => ({
          name: v.user.name ?? "—",
          probability: v.probability,
          error: Math.abs(v.probability - correctValue),
        }))
        .sort((a, b) => a.error - b.error)

      melhorForecaster = sorted[0] ?? null
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
      acertou,
      melhorForecaster,
    }
  })

  return NextResponse.json({ mercados: result })
}

const createSchema = z.object({
  question: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  category: z.nativeEnum(Category).optional(),
  expiresAt: z.string().datetime(),
})

// POST — criar mercado interno
export async function POST(
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
  if (!bolao) return NextResponse.json({ error: "Bolão não encontrado." }, { status: 404 })

  const isMember = bolao.members.some((m) => m.userId === session.user.id)
  if (!isMember) return NextResponse.json({ error: "Apenas membros podem criar mercados." }, { status: 403 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { question, description, category, expiresAt } = parsed.data

  if (new Date(expiresAt) <= new Date()) {
    return NextResponse.json({ error: "A data de resolução tem de ser no futuro." }, { status: 400 })
  }

  const mercado = await prisma.grupoMercado.create({
    data: {
      bolaoId: bolao.id,
      creatorId: session.user.id,
      question,
      description,
      category,
      expiresAt: new Date(expiresAt),
    },
  })

  const creatorName = session.user.name ?? "Alguém"
  const memberIds = bolao.members.map((m) => m.userId)
  notifyMercadoCreated(question, bolao.name, bolao.slug, creatorName, mercado.id, memberIds, session.user.id).catch(() => {})

  return NextResponse.json({ mercado }, { status: 201 })
}
