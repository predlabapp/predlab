import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { createNotifications } from "@/lib/notifications"

const resultadoSchema = z.union([
  z.object({
    resultHome: z.number().int().min(0).max(99),
    resultAway: z.number().int().min(0).max(99),
  }),
  z.object({
    resultOption: z.string().min(1).max(100),
  }),
])

function calcPontos(
  jogo: { pointsExact: number; pointsResult: number; resultHome: number | null; resultAway: number | null; resultOption: string | null },
  palpite: { palpiteHome: number | null; palpiteAway: number | null; palpiteOption: string | null }
): number {
  // CUSTOM type
  if (jogo.resultOption !== null) {
    return palpite.palpiteOption === jogo.resultOption ? jogo.pointsExact : 0
  }

  // SPORTS type
  if (jogo.resultHome === null || jogo.resultAway === null) return 0
  if (palpite.palpiteHome === null || palpite.palpiteAway === null) return 0

  // Exact score
  if (palpite.palpiteHome === jogo.resultHome && palpite.palpiteAway === jogo.resultAway) {
    return jogo.pointsExact
  }

  // Correct result (win/loss/draw)
  const actualResult = Math.sign(jogo.resultHome - jogo.resultAway)
  const palpiteResult = Math.sign(palpite.palpiteHome - palpite.palpiteAway)
  if (actualResult === palpiteResult) {
    return jogo.pointsResult
  }

  return 0
}

export async function PATCH(
  req: Request,
  { params }: { params: { slug: string; jogoId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verify admin
  const bolao = await prisma.bolao.findUnique({
    where: { slug: params.slug },
    include: {
      members: { select: { id: true, userId: true, role: true } },
    },
  })
  if (!bolao) return NextResponse.json({ error: "Bolão não encontrado." }, { status: 404 })

  const membership = bolao.members.find((m) => m.userId === session.user.id)
  if (!membership || membership.role !== "ADMIN") {
    return NextResponse.json({ error: "Apenas admins podem preencher resultados." }, { status: 403 })
  }

  const jogo = await prisma.bolaoJogo.findFirst({
    where: { id: params.jogoId, bolaoId: bolao.id },
    include: { palpites: { include: { member: { select: { userId: true } } } } },
  })
  if (!jogo) return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 })

  if (jogo.status === "FINISHED") {
    return NextResponse.json({ error: "Este jogo já foi resolvido." }, { status: 400 })
  }

  const body = await req.json()
  const parsed = resultadoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Dados inválidos." }, { status: 400 })
  }

  const data = parsed.data
  const resultHome = "resultHome" in data ? data.resultHome : null
  const resultAway = "resultAway" in data ? data.resultAway : null
  const resultOption = "resultOption" in data ? data.resultOption : null

  // Calculate pontos for each palpite
  const jogoForCalc = {
    pointsExact: bolao.pointsExact,
    pointsResult: bolao.pointsResult,
    resultHome,
    resultAway,
    resultOption,
  }

  const palpiteUpdates = jogo.palpites.map((p) => {
    const pontos = calcPontos(jogoForCalc, p)
    return prisma.bolaoPalpite.update({
      where: { id: p.id },
      data: { pontos },
    })
  })

  // Update jogo status and result
  const jogoUpdate = prisma.bolaoJogo.update({
    where: { id: jogo.id },
    data: {
      status: "FINISHED",
      resultHome,
      resultAway,
      resultOption,
      resolvedAt: new Date(),
      resolvedById: session.user.id,
    },
  })

  await prisma.$transaction([jogoUpdate, ...palpiteUpdates])

  // Notify all members about result
  const allMemberUserIds = bolao.members.map((m) => m.userId)
  const jogoLabel = jogo.homeTeam && jogo.awayTeam
    ? `${jogo.homeTeam} vs ${jogo.awayTeam}`
    : jogo.name
  const resultLabel = resultHome !== null && resultAway !== null
    ? `${resultHome}×${resultAway}`
    : resultOption ?? "—"

  createNotifications(
    allMemberUserIds.map((userId) => ({
      userId,
      type: "jogo_resolved",
      title: `Resultado: ${jogoLabel}`,
      message: `Resultado: ${resultLabel}. Pontos calculados!`,
      link: `/bolao/${bolao.slug}?tab=jogos`,
    }))
  ).catch(() => {})

  return NextResponse.json({ success: true })
}
