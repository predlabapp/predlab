import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import SharedPredictionPage from "@/components/predictions/SharedPredictionPage"

interface Props {
  params: { shareToken: string; locale: string }
}

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const prediction = await prisma.prediction.findUnique({
    where: { shareToken: params.shareToken },
    include: { user: { select: { name: true, username: true } } },
  })

  if (!prediction) return { title: "Prediction — PredLab" }

  const displayName = prediction.user.name ?? prediction.user.username ?? "Forecaster"
  const ogImageUrl = `${BASE_URL}/api/og/prediction/${params.shareToken}`

  return {
    title: `"${prediction.title}" — ${displayName} · PredLab`,
    description: `${displayName} made this prediction with ${prediction.probability}% probability. Cumulative Forecast Score available on PredLab.`,
    openGraph: {
      title: `"${prediction.title}" — ${displayName}`,
      description: `Probability: ${prediction.probability}% · PredLab`,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `"${prediction.title}" — ${displayName}`,
      description: `Probability: ${prediction.probability}% · PredLab`,
      images: [ogImageUrl],
    },
  }
}

export default async function SharePage({ params }: Props) {
  const prediction = await prisma.prediction.findUnique({
    where: { shareToken: params.shareToken },
    include: {
      user: {
        select: {
          name: true,
          username: true,
          level: true,
          predictions: {
            select: {
              probability: true,
              resolution: true,
            },
          },
        },
      },
    },
  })

  if (!prediction) notFound()

  // Serialize dates to strings for client component
  const serialized = {
    id: prediction.id,
    title: prediction.title,
    description: prediction.description,
    probability: prediction.probability,
    category: prediction.category,
    expiresAt: prediction.expiresAt.toISOString(),
    resolvedAt: prediction.resolvedAt ? prediction.resolvedAt.toISOString() : null,
    resolution: prediction.resolution,
    polymarketProbability: prediction.polymarketProbability,
    polymarketUrl: prediction.polymarketUrl,
    evidence: prediction.evidence,
    tags: prediction.tags,
    user: {
      name: prediction.user.name,
      username: prediction.user.username,
      level: prediction.user.level,
      predictions: prediction.user.predictions,
    },
  }

  return <SharedPredictionPage prediction={serialized} locale={params.locale} />
}
