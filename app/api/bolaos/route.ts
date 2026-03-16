import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { BolaoType } from "@prisma/client"

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.nativeEnum(BolaoType).optional(),
  endsAt: z.string().optional(),
  maxMembers: z.number().int().min(2).max(10000).optional(),
  isPublic: z.boolean().optional(),
  coverEmoji: z.string().max(10).optional(),
  hasPrize: z.boolean().optional(),
  prizeDescription: z.string().max(500).optional(),
  prizePixKey: z.string().max(200).optional(),
  prizePool: z.string().max(200).optional(),
  prizeDistribution: z.string().max(500).optional(),
  pointsExact: z.number().int().min(1).max(100).optional(),
  pointsResult: z.number().int().min(1).max(100).optional(),
})

function generateSlug(name: string, suffix: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
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
    const firstError = parsed.error.errors[0]?.message ?? "Dados inválidos."
    return NextResponse.json({ error: firstError }, { status: 400 })
  }

  const {
    name,
    description,
    type,
    endsAt,
    maxMembers,
    isPublic,
    coverEmoji,
    hasPrize,
    prizeDescription,
    prizePixKey,
    prizePool,
    prizeDistribution,
    pointsExact,
    pointsResult,
  } = parsed.data

  // Generate unique slug
  const suffix = Math.random().toString(36).slice(2, 7)
  const slug = generateSlug(name, suffix)

  const bolao = await prisma.bolao.create({
    data: {
      name,
      description,
      slug,
      type: type ?? "SPORTS",
      endsAt: endsAt ? new Date(endsAt) : undefined,
      maxMembers,
      isPublic: isPublic ?? false,
      coverEmoji: coverEmoji ?? "🏆",
      hasPrize: hasPrize ?? false,
      prizeDescription,
      prizePixKey,
      prizePool,
      prizeDistribution,
      pointsExact: pointsExact ?? 10,
      pointsResult: pointsResult ?? 5,
      creatorId: session.user.id,
      // Creator joins automatically as ADMIN
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
    id: bolao.id,
    slug: bolao.slug,
    inviteCode: bolao.inviteCode,
    inviteUrl: `${baseUrl}/bolao/join/${bolao.inviteCode}`,
  }, { status: 201 })
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const memberships = await prisma.bolaoMember.findMany({
    where: { userId: session.user.id },
    include: {
      bolao: {
        include: {
          _count: { select: { members: true } },
          members: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  })

  const bolaos = memberships.map(({ bolao, role }) => {
    // Scores based on palpites — all zero until jogos are played
    const myScore = 0
    const myPosition = null
    const top = null
    const recentActivity = 0

    return {
      id: bolao.id,
      name: bolao.name,
      slug: bolao.slug,
      coverEmoji: bolao.coverEmoji,
      memberCount: bolao._count.members,
      myRole: role,
      myScore,
      myPosition,
      topForecaster: top,
      recentActivity,
      endsAt: bolao.endsAt,
      isPublic: bolao.isPublic,
      hasPrize: bolao.hasPrize,
      type: bolao.type,
    }
  })

  return NextResponse.json({ bolaos })
}
