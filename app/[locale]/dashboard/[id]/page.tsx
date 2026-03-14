import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { PredictionDetail } from "@/components/predictions/PredictionDetail"

interface Props {
  params: { id: string; locale: string }
}

export default async function PredictionPage({ params }: Props) {
  const session = await getServerSession(authOptions)

  const prediction = await prisma.prediction.findFirst({
    where: { id: params.id, userId: session!.user.id },
  })

  if (!prediction) notFound()

  return <PredictionDetail prediction={prediction} />
}

export async function generateMetadata({ params }: Props) {
  const prediction = await prisma.prediction.findUnique({
    where: { id: params.id },
    select: { title: true },
  })
  return {
    title: prediction ? prediction.title : "Prediction",
  }
}
