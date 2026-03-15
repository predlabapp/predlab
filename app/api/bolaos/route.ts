import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Category } from "@prisma/client"

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.nativeEnum(Category).optional(),
  endsAt: z.string().datetime().optional(),
  maxMembers: z.number().int().min(2).max(10000).optional(),
  isPublic: z.boolean().optional(),
  coverEmoji: z.string().max(10).optional(),
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
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, description, category, endsAt, maxMembers, isPublic, coverEmoji } = parsed.data

  // Generate unique slug
  const suffix = Math.random().toString(36).slice(2, 7)
  const slug = generateSlug(name, suffix)

  const bolao = await prisma.bolao.create({
    data: {
      name,
      description,
      slug,
      category,
      endsAt: endsAt ? new Date(endsAt) : undefined,
      maxMembers,
      isPublic: isPublic ?? false,
      coverEmoji: coverEmoji ?? "🔮",
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
          predicoes: {
            include: {
              prediction: true,
            },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  })

  const bolaos = memberships.map(({ bolao, role }) => {
    // Calculate my score in this bolão
    const myPredicoes = bolao.predicoes.filter(
      (p) => p.addedById === session.user.id && p.prediction.resolvedAt
    )
    const correct = myPredicoes.filter(
      (p) => p.prediction.resolution === "CORRECT"
    ).length
    const myScore = myPredicoes.length > 0
      ? Math.round((correct / myPredicoes.length) * 100)
      : 0

    // Top forecaster (most correct predictions)
    const memberScores = bolao.members.map((m) => {
      const preds = bolao.predicoes.filter(
        (p) => p.addedById === m.userId && p.prediction.resolvedAt
      )
      const c = preds.filter((p) => p.prediction.resolution === "CORRECT").length
      return { name: m.user.name ?? "—", score: preds.length > 0 ? Math.round((c / preds.length) * 100) : 0 }
    })
    const sortedScores = [...memberScores].sort((a, b) => b.score - a.score)
    const top = sortedScores[0] ?? null
    const myPositionIdx = sortedScores.findIndex((s) => {
      const m = bolao.members.find((bm) => bm.user.name === s.name)
      return m?.userId === session.user.id
    })
    const myPosition = myPositionIdx >= 0 ? myPositionIdx + 1 : null

    // Recent activity (last 24h)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentActivity = bolao.predicoes.filter(
      (p) => new Date(p.createdAt) > since
    ).length

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
    }
  })

  return NextResponse.json({ bolaos })
}
