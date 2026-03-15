import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { predictionId } = await req.json()
  if (!predictionId) {
    return NextResponse.json({ error: "predictionId é obrigatório." }, { status: 400 })
  }

  const bolao = await prisma.bolao.findUnique({
    where: { slug: params.slug },
    include: { members: true },
  })
  if (!bolao) {
    return NextResponse.json({ error: "Bolão não encontrado." }, { status: 404 })
  }

  // Tem de ser membro
  const isMember = bolao.members.some((m) => m.userId === session.user.id)
  if (!isMember) {
    return NextResponse.json({ error: "Tens de ser membro do bolão." }, { status: 403 })
  }

  // Previsão tem de pertencer ao utilizador
  const prediction = await prisma.prediction.findUnique({ where: { id: predictionId } })
  if (!prediction || prediction.userId !== session.user.id) {
    return NextResponse.json({ error: "Previsão não encontrada ou não te pertence." }, { status: 403 })
  }

  // Já está no bolão?
  const existing = await prisma.bolaoPredicao.findUnique({
    where: { bolaoId_predictionId: { bolaoId: bolao.id, predictionId } },
  })
  if (existing) {
    return NextResponse.json({ error: "Esta previsão já está no bolão." }, { status: 400 })
  }

  const bolaoPredicao = await prisma.bolaoPredicao.create({
    data: {
      bolaoId: bolao.id,
      predictionId,
      addedById: session.user.id,
    },
  })

  return NextResponse.json({ bolaoPredicao }, { status: 201 })
}
