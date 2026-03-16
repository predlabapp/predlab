import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function brasiliaDateStr(): string {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  )
    .toISOString()
    .slice(0, 10)
}

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const password = searchParams.get("password")

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = brasiliaDateStr()

  const todayPosts = await prisma.socialPost.findMany({
    where: { date: today },
    orderBy: [{ platform: "asc" }, { scheduledTime: "asc" }],
  })

  const history = await prisma.socialPost.findMany({
    where: { date: { not: today } },
    orderBy: { createdAt: "desc" },
    take: 14,
    select: {
      id: true,
      date: true,
      marketTitle: true,
      probability: true,
      platform: true,
      scheduledTime: true,
      status: true,
      instagramPostId: true,
      ogImageUrl: true,
      error: true,
    },
  })

  const instagram = todayPosts.filter((p) => p.platform === "instagram")
  const twitter = todayPosts.filter((p) => p.platform === "twitter")

  return NextResponse.json({ instagram, twitter, history })
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const password = searchParams.get("password")

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const platform = (body.platform ?? "instagram") as string
  const slot = (body.slot ?? "1") as string

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://predlab.app"
  const cronUrl = `${baseUrl}/api/cron/social?platform=${platform}&slot=${slot}`

  const res = await fetch(cronUrl, {
    method: "GET",
    headers: { Authorization: `Bearer ${password}` },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
