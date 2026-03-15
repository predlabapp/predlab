import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE — remover membro (admin remove qualquer membro; membro sai)
export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string; userId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const bolao = await prisma.bolao.findUnique({
    where: { slug: params.slug },
    include: { members: true },
  })
  if (!bolao) {
    return NextResponse.json({ error: "Bolão não encontrado." }, { status: 404 })
  }

  const myMembership = bolao.members.find((m) => m.userId === session.user.id)
  const isAdmin = myMembership?.role === "ADMIN"
  const isSelf = params.userId === session.user.id

  if (!isAdmin && !isSelf) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 })
  }

  // Criador não pode ser removido
  if (params.userId === bolao.creatorId) {
    return NextResponse.json({ error: "O criador não pode ser removido do bolão." }, { status: 400 })
  }

  const target = bolao.members.find((m) => m.userId === params.userId)
  if (!target) {
    return NextResponse.json({ error: "Membro não encontrado." }, { status: 404 })
  }

  await prisma.bolaoMember.delete({
    where: { bolaoId_userId: { bolaoId: bolao.id, userId: params.userId } },
  })

  return NextResponse.json({ success: true })
}
