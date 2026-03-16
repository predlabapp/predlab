import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE — só criador e apenas se sem votos
export async function DELETE(
  _req: Request,
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
  if (!membership) return NextResponse.json({ error: "Acesso negado." }, { status: 403 })

  const mercado = await prisma.grupoMercado.findFirst({
    where: { id: params.mercadoId, grupoId: grupo.id },
    include: { _count: { select: { votos: true } } },
  })
  if (!mercado) return NextResponse.json({ error: "Mercado não encontrado." }, { status: 404 })

  const isAdmin = membership.role === "ADMIN"
  const isCreator = mercado.creatorId === session.user.id
  if (!isAdmin && !isCreator) {
    return NextResponse.json({ error: "Apenas o criador ou admin pode apagar este mercado." }, { status: 403 })
  }

  if (mercado._count.votos > 0 && !isAdmin) {
    return NextResponse.json({ error: "Não é possível apagar um mercado que já tem votos." }, { status: 400 })
  }

  await prisma.grupoMercado.delete({ where: { id: mercado.id } })
  return NextResponse.json({ success: true })
}
