import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const votarSchema = z.object({
  probability: z.number().int().min(1).max(99),
})

export async function POST(
  req: Request,
  { params }: { params: { slug: string; mercadoId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const grupo = await prisma.grupo.findUnique({
    where: { slug: params.slug },
    include: { members: { where: { userId: session.user.id } } },
  })
  if (!grupo) return NextResponse.json({ error: "Grupo não encontrado." }, { status: 404 })

  const membership = grupo.members[0]
  if (!membership) return NextResponse.json({ error: "Você não é membro deste grupo." }, { status: 403 })

  const mercado = await prisma.grupoMercado.findFirst({
    where: { id: params.mercadoId, grupoId: grupo.id },
  })
  if (!mercado) return NextResponse.json({ error: "Mercado não encontrado." }, { status: 404 })
  if (!mercado.isOpen) return NextResponse.json({ error: "Este mercado está encerrado." }, { status: 400 })
  if (mercado.resolvedAt) return NextResponse.json({ error: "Este mercado já foi resolvido." }, { status: 400 })
  if (new Date() > mercado.expiresAt) return NextResponse.json({ error: "O prazo para votar encerrou." }, { status: 400 })

  const body = await req.json()
  const parsed = votarSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Dados inválidos." }, { status: 400 })
  }

  const voto = await prisma.grupoMercadoVoto.upsert({
    where: { mercadoId_memberId: { mercadoId: mercado.id, memberId: membership.id } },
    create: { mercadoId: mercado.id, memberId: membership.id, probability: parsed.data.probability },
    update: { probability: parsed.data.probability },
  })

  return NextResponse.json({ voto })
}
