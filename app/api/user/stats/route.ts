import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateAccuracyScore } from "@/lib/utils"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const predictions = await prisma.prediction.findMany({
    where: { userId: session.user.id },
    select: { probability: true, resolution: true, resolutionType: true },
  })

  const total = predictions.length
  const pending = predictions.filter((p) => !p.resolution).length
  const resolved = predictions.filter((p) => p.resolution).length
  const correct = predictions.filter((p) => p.resolution === "CORRECT").length

  // scoreGeneral — all resolved predictions (including manual)
  const scoreGeneral = calculateAccuracyScore(predictions as any)

  // scoreVerified — only AUTOMATIC resolutions (Polymarket-verified)
  const verifiedPredictions = predictions.filter(
    (p) => p.resolutionType === "AUTOMATIC"
  )
  const scoreVerified = calculateAccuracyScore(verifiedPredictions as any)
  const verifiedCount = verifiedPredictions.filter((p) => p.resolution).length

  return NextResponse.json({
    total,
    pending,
    resolved,
    correct,
    score: scoreGeneral,       // backwards compat
    scoreGeneral,
    scoreVerified,
    verifiedCount,
  })
}
