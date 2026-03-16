import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Brier score: 1 - (p/100 - outcome)²  → scaled 0-100
function brierScore(probability: number, outcome: 1 | 0): number {
  return (1 - Math.pow(probability / 100 - outcome, 2)) * 100
}

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions)

  const grupo = await prisma.grupo.findUnique({
    where: { slug: params.slug },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, image: true } },
          votos: {
            include: {
              mercado: { select: { resolution: true, resolvedAt: true } },
            },
          },
        },
      },
    },
  })

  if (!grupo) {
    return NextResponse.json({ error: "Grupo não encontrado." }, { status: 404 })
  }

  const userId = session?.user?.id ?? null
  const membership = grupo.members.find((m) => m.userId === userId)
  const isMember = !!membership

  if (!grupo.isPublic && !isMember) {
    return NextResponse.json({ error: "Acesso negado. Este grupo é privado." }, { status: 403 })
  }

  // Build ranking with Brier scoring
  const ranking = grupo.members.map((m) => {
    const resolvedVotos = m.votos.filter(
      (v) => v.mercado.resolution && v.mercado.resolution !== "CANCELADO"
    )
    const acertos = resolvedVotos.filter((v) => {
      if (v.mercado.resolution === "SIM") return v.probability >= 50
      if (v.mercado.resolution === "NAO") return v.probability < 50
      return false
    }).length

    const brierScores = resolvedVotos.map((v) => {
      const outcome: 1 | 0 = v.mercado.resolution === "SIM" ? 1 : 0
      return brierScore(v.probability, outcome)
    })
    const scoreCalibração = brierScores.length > 0
      ? Math.round(brierScores.reduce((a, b) => a + b, 0) / brierScores.length)
      : 0

    return {
      userId: m.userId,
      name: m.user.name ?? "—",
      image: m.user.image ?? null,
      role: m.role,
      totalVotos: m.votos.length,
      mercadosResolvidos: resolvedVotos.length,
      acertos,
      scoreCalibração,
    }
  }).sort((a, b) => b.scoreCalibração - a.scoreCalibração || b.acertos - a.acertos)
    .map((m, i) => ({ position: i + 1, ...m }))

  return NextResponse.json({
    grupo: {
      id: grupo.id,
      name: grupo.name,
      description: grupo.description,
      coverEmoji: grupo.coverEmoji,
      slug: grupo.slug,
      inviteCode: isMember ? grupo.inviteCode : null,
      isPublic: grupo.isPublic,
      creatorId: grupo.creatorId,
      memberCount: grupo.members.length,
    },
    myRole: membership?.role ?? null,
    isMember,
    ranking,
    members: grupo.members.map((m) => ({
      userId: m.userId,
      name: m.user.name ?? "—",
      image: m.user.image ?? null,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
  })
}
