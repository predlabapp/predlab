import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"

interface Props {
  params: { shareToken: string }
}

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const prediction = await prisma.prediction.findUnique({
    where: { shareToken: params.shareToken },
    include: { user: { select: { name: true, username: true } } },
  })

  if (!prediction) return { title: "Previsão — PredLab" }

  const displayName = prediction.user.name ?? prediction.user.username ?? "Forecaster"
  const ogImageUrl = `${BASE_URL}/api/og/prediction/${params.shareToken}`

  return {
    title: `"${prediction.title}" — ${displayName} · PredLab`,
    description: `${displayName} fez esta previsão com ${prediction.probability}% de probabilidade. Forecast Score acumulado disponível em PredLab.`,
    openGraph: {
      title: `"${prediction.title}" — ${displayName}`,
      description: `Probabilidade: ${prediction.probability}% · PredLab`,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `"${prediction.title}" — ${displayName}`,
      description: `Probabilidade: ${prediction.probability}% · PredLab`,
      images: [ogImageUrl],
    },
  }
}

export default async function SharePage({ params }: Props) {
  const prediction = await prisma.prediction.findUnique({
    where: { shareToken: params.shareToken },
    include: { user: { select: { username: true } } },
  })

  if (!prediction) notFound()

  // Redirect to the user's public profile
  if (prediction.user.username) {
    redirect(`/p/${prediction.user.username}`)
  }

  redirect("/")
}
