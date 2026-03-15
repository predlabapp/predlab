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
    },
  })

  const instagram = todayPosts.filter((p) => p.platform === "instagram")
  const twitter = todayPosts.filter((p) => p.platform === "twitter")

  return NextResponse.json({ instagram, twitter, history })
}
