import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  coverEmoji: z.string().max(10).optional(),
  isPublic: z.boolean().optional(),
  maxMembers: z.number().int().min(2).max(10000).optional(),
})

function generateSlug(name: string, suffix: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40)
  return `${base}-${suffix}`
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Dados inválidos." }, { status: 400 })
  }

  const { name, description, coverEmoji, isPublic, maxMembers } = parsed.data
  const suffix = Math.random().toString(36).slice(2, 7)
  const slug = generateSlug(name, suffix)

  const grupo = await prisma.grupo.create({
    data: {
      name,
      description,
      slug,
      coverEmoji: coverEmoji ?? "🔮",
      isPublic: isPublic ?? false,
      maxMembers,
      creatorId: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          role: "ADMIN",
        },
      },
    },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://predlab.app"

  return NextResponse.json({
    id: grupo.id,
    slug: grupo.slug,
    inviteCode: grupo.inviteCode,
    inviteUrl: `${baseUrl}/grupo/join/${grupo.inviteCode}`,
  }, { status: 201 })
}

export async function GET(_req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const memberships = await prisma.grupoMember.findMany({
    where: { userId: session.user.id },
    include: {
      grupo: {
        include: {
          _count: { select: { members: true, mercados: true } },
          mercados: {
            where: { isOpen: true },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  })

  const grupos = memberships.map(({ grupo, role }) => ({
    id: grupo.id,
    name: grupo.name,
    slug: grupo.slug,
    coverEmoji: grupo.coverEmoji,
    memberCount: grupo._count.members,
    totalMercados: grupo._count.mercados,
    mercadosAbertos: grupo.mercados.length,
    myRole: role,
    isPublic: grupo.isPublic,
  }))

  return NextResponse.json({ grupos })
}
