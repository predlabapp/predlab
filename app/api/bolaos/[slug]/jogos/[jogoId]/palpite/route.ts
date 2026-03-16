import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const palpiteSchema = z.union([
  z.object({
    palpiteHome: z.number().int().min(0).max(99),
    palpiteAway: z.number().int().min(0).max(99),
  }),
  z.object({
    palpiteOption: z.string().min(1).max(100),
  }),
])

export async function POST(
  req: Request,
  { params }: { params: { slug: string; jogoId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verify membership
  const bolao = await prisma.bolao.findUnique({
    where: { slug: params.slug },
    include: {
      members: { where: { userId: session.user.id } },
    },
  })
  if (!bolao) return NextResponse.json({ error: "Bolão não encontrado." }, { status: 404 })

  const membership = bolao.members[0]
  if (!membership) return NextResponse.json({ error: "Você não é membro deste bolão." }, { status: 403 })

  // Get jogo
  const jogo = await prisma.bolaoJogo.findFirst({
    where: { id: params.jogoId, bolaoId: bolao.id },
  })
  if (!jogo) return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 })

  // Validations
  if (jogo.status !== "SCHEDULED") {
    return NextResponse.json({ error: "Este jogo já não aceita palpites." }, { status: 400 })
  }
  if (new Date() >= jogo.scheduledAt) {
    return NextResponse.json({ error: "O prazo para palpites encerrou." }, { status: 400 })
  }

  const body = await req.json()
  const parsed = palpiteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Dados inválidos." }, { status: 400 })
  }

  const data = parsed.data

  const palpite = await prisma.bolaoPalpite.upsert({
    where: { jogoId_memberId: { jogoId: jogo.id, memberId: membership.id } },
    create: {
      jogoId: jogo.id,
      memberId: membership.id,
      palpiteHome: "palpiteHome" in data ? data.palpiteHome : null,
      palpiteAway: "palpiteAway" in data ? data.palpiteAway : null,
      palpiteOption: "palpiteOption" in data ? data.palpiteOption : null,
    },
    update: {
      palpiteHome: "palpiteHome" in data ? data.palpiteHome : null,
      palpiteAway: "palpiteAway" in data ? data.palpiteAway : null,
      palpiteOption: "palpiteOption" in data ? data.palpiteOption : null,
    },
  })

  return NextResponse.json({ palpite })
}
