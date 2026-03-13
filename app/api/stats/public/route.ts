import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const revalidate = 300 // 5 minutes

export async function GET() {
  const [totalPredictions, totalUsers, predictionsToday, scoreData] = await Promise.all([
    prisma.prediction.count(),
    prisma.user.count(),
    prisma.prediction.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.prediction.findMany({
      where: { resolution: { not: null } },
      select: { probability: true, resolution: true },
    }),
  ])

  // Simple accuracy: % correct out of non-cancelled resolved
  const resolved = scoreData.filter(
    (p) => p.resolution !== "CANCELLED"
  )
  const correct = resolved.filter((p) => p.resolution === "CORRECT").length
  const avgAccuracy =
    resolved.length > 0 ? Math.round((correct / resolved.length) * 100) : 0

  return NextResponse.json({
    totalPredictions,
    totalUsers,
    predictionsToday,
    avgAccuracy,
  })
}
