import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string; predictionId: string } }
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

  const bolaoPredicao = await prisma.bolaoPredicao.findUnique({
    where: { bolaoId_predictionId: { bolaoId: bolao.id, predictionId: params.predictionId } },
    include: { prediction: true },
  })
  if (!bolaoPredicao) {
    return NextResponse.json({ error: "Previsão não encontrada no bolão." }, { status: 404 })
  }

  const myMembership = bolao.members.find((m) => m.userId === session.user.id)
  const isAdmin = myMembership?.role === "ADMIN"
  const isOwner = bolaoPredicao.prediction.userId === session.user.id

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Sem permissão para remover esta previsão." }, { status: 403 })
  }

  await prisma.bolaoPredicao.delete({
    where: { bolaoId_predictionId: { bolaoId: bolao.id, predictionId: params.predictionId } },
  })

  return NextResponse.json({ success: true })
}
