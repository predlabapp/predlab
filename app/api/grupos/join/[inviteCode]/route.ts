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

  const grupo = await prisma.grupo.findUnique({
    where: { inviteCode: params.inviteCode },
    include: { _count: { select: { members: true } } },
  })

  if (!grupo) {
    return NextResponse.json({ error: "Grupo não encontrado." }, { status: 404 })
  }

  if (grupo.maxMembers && grupo._count.members >= grupo.maxMembers) {
    return NextResponse.json({ error: "Este grupo já atingiu o limite de participantes." }, { status: 400 })
  }

  const existing = await prisma.grupoMember.findUnique({
    where: { grupoId_userId: { grupoId: grupo.id, userId: session.user.id } },
  })
  if (existing) {
    return NextResponse.json({ error: "Já és membro deste grupo." }, { status: 400 })
  }

  await prisma.grupoMember.create({
    data: { grupoId: grupo.id, userId: session.user.id, role: "MEMBER" },
  })

  return NextResponse.json({
    grupo: { id: grupo.id, name: grupo.name, slug: grupo.slug },
    message: "Entrou no grupo!",
  })
}

export async function GET(
  _req: Request,
  { params }: { params: { inviteCode: string } }
) {
  const session = await getServerSession(authOptions)

  const grupo = await prisma.grupo.findUnique({
    where: { inviteCode: params.inviteCode },
    include: { _count: { select: { members: true } } },
  })

  if (!grupo) {
    return NextResponse.json({ error: "Grupo não encontrado." }, { status: 404 })
  }

  let isAlreadyMember = false
  if (session?.user?.id) {
    const membership = await prisma.grupoMember.findUnique({
      where: { grupoId_userId: { grupoId: grupo.id, userId: session.user.id } },
    })
    isAlreadyMember = !!membership
  }

  return NextResponse.json({
    id: grupo.id,
    name: grupo.name,
    slug: grupo.slug,
    coverEmoji: grupo.coverEmoji,
    description: grupo.description,
    memberCount: grupo._count.members,
    isFull: grupo.maxMembers ? grupo._count.members >= grupo.maxMembers : false,
    isAlreadyMember,
  })
}
