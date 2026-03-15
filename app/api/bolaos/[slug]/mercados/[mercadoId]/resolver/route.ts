import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { GrupoResolution } from "@prisma/client"

const resolveSchema = z.object({
  resolution: z.nativeEnum(GrupoResolution),
  note: z.string().max(300).optional(),
})

// PATCH — resolver mercado (criador do mercado ou admin do bolão)
export async function PATCH(
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

  const myMembership = bolao.members.find((m) => m.userId === session.user.id)
  if (!myMembership) return NextResponse.json({ error: "Não és membro deste bolão." }, { status: 403 })

  const mercado = await prisma.grupoMercado.findUnique({
    where: { id: params.mercadoId },
    include: { votos: { include: { user: { select: { id: true, name: true } } } } },
  })
  if (!mercado || mercado.bolaoId !== bolao.id) {
    return NextResponse.json({ error: "Mercado não encontrado." }, { status: 404 })
  }
  if (mercado.resolvedAt) {
    return NextResponse.json({ error: "Este mercado já foi resolvido." }, { status: 400 })
  }

  const isCreator = mercado.creatorId === session.user.id
  const isAdmin = myMembership.role === "ADMIN"
  if (!isCreator && !isAdmin) {
    return NextResponse.json({ error: "Só o criador do mercado ou admin pode resolver." }, { status: 403 })
  }

  const body = await req.json()
  const parsed = resolveSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { resolution } = parsed.data

  const updated = await prisma.grupoMercado.update({
    where: { id: params.mercadoId },
    data: {
      resolution,
      resolvedAt: new Date(),
      resolvedById: session.user.id,
      isOpen: false,
    },
  })

  return NextResponse.json({ mercado: updated })
}
