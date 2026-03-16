import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createJogoSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("SPORTS"),
    homeTeam: z.string().min(1).max(100),
    awayTeam: z.string().min(1).max(100),
    scheduledAt: z.string(),
    phase: z.string().max(100).optional(),
    description: z.string().max(500).optional(),
  }),
  z.object({
    type: z.literal("CUSTOM"),
    name: z.string().min(1).max(200),
    options: z.array(z.string().min(1).max(100)).min(2).max(10),
    scheduledAt: z.string(),
    phase: z.string().max(100).optional(),
    description: z.string().max(500).optional(),
  }),
])

async function getMembershipAndBolao(slug: string, userId: string) {
  const bolao = await prisma.bolao.findUnique({
    where: { slug },
    include: {
      members: { select: { id: true, userId: true, role: true } },
    },
  })
  if (!bolao) return { bolao: null, membership: null }
  const membership = bolao.members.find((m) => m.userId === userId) ?? null
  return { bolao, membership }
}

// GET — listar jogos do bolão com palpite do utilizador
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { bolao, membership } = await getMembershipAndBolao(params.slug, session.user.id)
  if (!bolao) return NextResponse.json({ error: "Bolão não encontrado." }, { status: 404 })
  if (!membership && !bolao.isPublic) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const jogos = await prisma.bolaoJogo.findMany({
    where: { bolaoId: bolao.id },
    include: {
      palpites: {
        include: {
          member: { select: { userId: true } },
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
  })

  const totalMembros = bolao.members.length

  const result = jogos.map((jogo) => {
    const meuPalpite = membership
      ? jogo.palpites.find((p) => p.member.userId === session.user.id) ?? null
      : null

    return {
      id: jogo.id,
      name: jogo.name,
      description: jogo.description,
      homeTeam: jogo.homeTeam,
      awayTeam: jogo.awayTeam,
      options: jogo.options ? JSON.parse(jogo.options) : null,
      scheduledAt: jogo.scheduledAt,
      phase: jogo.phase,
      status: jogo.status,
      resultHome: jogo.resultHome,
      resultAway: jogo.resultAway,
      resultOption: jogo.resultOption,
      resolvedAt: jogo.resolvedAt,
      meuPalpite: meuPalpite
        ? {
            id: meuPalpite.id,
            palpiteHome: meuPalpite.palpiteHome,
            palpiteAway: meuPalpite.palpiteAway,
            palpiteOption: meuPalpite.palpiteOption,
            pontos: meuPalpite.pontos,
          }
        : null,
      totalPalpites: jogo.palpites.length,
      totalMembros,
    }
  })

  return NextResponse.json({ jogos: result })
}

// POST — criar jogo (só ADMIN)
export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { bolao, membership } = await getMembershipAndBolao(params.slug, session.user.id)
  if (!bolao) return NextResponse.json({ error: "Bolão não encontrado." }, { status: 404 })
  if (!membership || membership.role !== "ADMIN") {
    return NextResponse.json({ error: "Apenas admins podem criar jogos." }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createJogoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Dados inválidos." }, { status: 400 })
  }

  const data = parsed.data
  const scheduledAt = new Date(data.scheduledAt)

  let jogoData: Parameters<typeof prisma.bolaoJogo.create>[0]["data"]

  if (data.type === "SPORTS") {
    jogoData = {
      bolaoId: bolao.id,
      name: `${data.homeTeam} vs ${data.awayTeam}`,
      description: data.description,
      homeTeam: data.homeTeam,
      awayTeam: data.awayTeam,
      scheduledAt,
      phase: data.phase,
    }
  } else {
    jogoData = {
      bolaoId: bolao.id,
      name: data.name,
      description: data.description,
      options: JSON.stringify(data.options),
      scheduledAt,
      phase: data.phase,
    }
  }

  const jogo = await prisma.bolaoJogo.create({ data: jogoData })

  return NextResponse.json({ jogo }, { status: 201 })
}
