import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      bio: true,
      image: true,
      city: true,
      state: true,
      country: true,
      emailVerified: true,
      notifEmailDigest: true,
      notifExpiringPredictions: true,
      createdAt: true,
    },
  })

  return NextResponse.json(user)
}

const updateSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  bio: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  notifEmailDigest: z.boolean().optional(),
  notifExpiringPredictions: z.boolean().optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })

  // Check username uniqueness
  if (parsed.data.username) {
    const existing = await prisma.user.findFirst({
      where: { username: parsed.data.username, NOT: { id: session.user.id } },
    })
    if (existing) return NextResponse.json({ error: "Username já em uso." }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
  })

  return NextResponse.json({ success: true, user: updated })
}
