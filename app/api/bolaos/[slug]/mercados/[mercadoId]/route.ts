import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE — apagar mercado (só criador, e apenas se não tem votos)
export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string; mercadoId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const mercado = await prisma.grupoMercado.findUnique({
    where: { id: params.mercadoId },
    include: {
      bolao: { select: { slug: true } },
      _count: { select: { votos: true } },
    },
  })

  if (!mercado || mercado.bolao.slug !== params.slug) {
    return NextResponse.json({ error: "Mercado não encontrado." }, { status: 404 })
  }

  if (mercado.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Só o criador pode apagar o mercado." }, { status: 403 })
  }

  if (mercado._count.votos > 0) {
    return NextResponse.json({ error: "Não é possível apagar um mercado que já tem votos. Usa 'Cancelar' em vez disso." }, { status: 400 })
  }

  await prisma.grupoMercado.delete({ where: { id: params.mercadoId } })
  return NextResponse.json({ success: true })
}
