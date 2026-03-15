import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const voteSchema = z.object({
  probability: z.number().int().min(1).max(99),
})

// POST — votar (upsert) num mercado interno
export async function POST(
  req: Request,
  { params }: { params: { slug: string; mercadoId: string } }
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
  if (!isMember) return NextResponse.json({ error: "Apenas membros podem votar." }, { status: 403 })

  const mercado = await prisma.grupoMercado.findUnique({ where: { id: params.mercadoId } })
  if (!mercado || mercado.bolaoId !== bolao.id) {
    return NextResponse.json({ error: "Mercado não encontrado." }, { status: 404 })
  }
  if (!mercado.isOpen) return NextResponse.json({ error: "Este mercado está encerrado." }, { status: 400 })
  if (mercado.resolvedAt) return NextResponse.json({ error: "Este mercado já foi resolvido." }, { status: 400 })
  if (mercado.expiresAt < new Date()) return NextResponse.json({ error: "Este mercado já expirou." }, { status: 400 })

  const body = await req.json()
  const parsed = voteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const voto = await prisma.grupoMercadoVoto.upsert({
    where: { mercadoId_userId: { mercadoId: params.mercadoId, userId: session.user.id } },
    create: {
      mercadoId: params.mercadoId,
      userId: session.user.id,
      probability: parsed.data.probability,
    },
    update: {
      probability: parsed.data.probability,
    },
  })

  return NextResponse.json({ voto })
}
