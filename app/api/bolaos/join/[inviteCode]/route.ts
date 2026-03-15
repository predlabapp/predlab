import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  _req: Request,
  { params }: { params: { inviteCode: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const bolao = await prisma.bolao.findUnique({
    where: { inviteCode: params.inviteCode },
    include: { _count: { select: { members: true } } },
  })

  if (!bolao) {
    return NextResponse.json({ error: "Bolão não encontrado." }, { status: 404 })
  }

  // Bolão encerrado
  if (bolao.endsAt && bolao.endsAt < new Date()) {
    return NextResponse.json({ error: "Este bolão já encerrou." }, { status: 400 })
  }

  // Limite de membros
  if (bolao.maxMembers && bolao._count.members >= bolao.maxMembers) {
    return NextResponse.json({ error: "Este bolão já atingiu o limite de participantes." }, { status: 400 })
  }

  // Já é membro
  const existing = await prisma.bolaoMember.findUnique({
    where: { bolaoId_userId: { bolaoId: bolao.id, userId: session.user.id } },
  })
  if (existing) {
    return NextResponse.json({ error: "Já és membro deste bolão." }, { status: 400 })
  }

  await prisma.bolaoMember.create({
    data: {
      bolaoId: bolao.id,
      userId: session.user.id,
      role: "MEMBER",
    },
  })

  return NextResponse.json({
    bolao: { id: bolao.id, name: bolao.name, slug: bolao.slug },
    message: "Entraste no bolão!",
  })
}

// GET — retorna info do bolão pelo inviteCode (para página de convite)
export async function GET(
  _req: Request,
  { params }: { params: { inviteCode: string } }
) {
  const bolao = await prisma.bolao.findUnique({
    where: { inviteCode: params.inviteCode },
    include: { _count: { select: { members: true } } },
  })

  if (!bolao) {
    return NextResponse.json({ error: "Bolão não encontrado." }, { status: 404 })
  }

  return NextResponse.json({
    id: bolao.id,
    name: bolao.name,
    slug: bolao.slug,
    coverEmoji: bolao.coverEmoji,
    description: bolao.description,
    memberCount: bolao._count.members,
    endsAt: bolao.endsAt,
    isExpired: bolao.endsAt ? bolao.endsAt < new Date() : false,
    isFull: bolao.maxMembers ? bolao._count.members >= bolao.maxMembers : false,
  })
}
