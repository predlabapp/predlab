import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardClient } from "@/components/dashboard/DashboardClient"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { market?: string }
}) {
  const session = await getServerSession(authOptions)

  const predictions = await prisma.prediction.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
  })

  return (
    <DashboardClient
      initialPredictions={predictions}
      pendingMarketSlug={searchParams.market ?? null}
    />
  )
}
