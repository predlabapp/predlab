import { RankingsClient } from "@/components/rankings/RankingsClient"

export const metadata = {
  title: "Rankings | PredLab",
  description: "Os melhores forecasters do PredLab. Classifica por score, streak e Orbs.",
}

export default function PublicRankingsPage() {
  return <RankingsClient />
}
