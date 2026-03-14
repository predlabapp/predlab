import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CATEGORIES, RESOLUTION_CONFIG, calculateAccuracyScore } from "@/lib/utils"
import { ArrowLeft, TrendingUp, Target, CheckCircle, Clock } from "lucide-react"
import { Link } from "@/navigation"
import { StatsCharts } from "@/components/dashboard/StatsCharts"
import { getTranslations } from "next-intl/server"

export default async function StatsPage() {
  const session = await getServerSession(authOptions)
  const t = await getTranslations("StatsPage")
  const tCat = await getTranslations("Categories")
  const tRes = await getTranslations("Resolution")

  const predictions = await prisma.prediction.findMany({
    where: { userId: session!.user.id },
    select: { probability: true, resolution: true, category: true },
  })

  const total = predictions.length
  const resolved = predictions.filter((p) => p.resolution).length
  const pending = predictions.filter((p) => !p.resolution).length
  const correct = predictions.filter((p) => p.resolution === "CORRECT").length
  const score = calculateAccuracyScore(predictions as any)
  const accuracy = resolved > 0 ? Math.round((correct / resolved) * 100) : 0

  // Data for charts
  const categoryData = Object.entries(CATEGORIES)
    .map(([key, cat]) => ({
      name: cat.emoji + " " + tCat(key as any),
      count: predictions.filter((p) => p.category === key).length,
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)

  const resolutionData = (["CORRECT", "INCORRECT", "PARTIAL", "CANCELLED"] as const)
    .map((res) => ({
      name: tRes(res),
      count: predictions.filter((p) => p.resolution === res).length,
      color: RESOLUTION_CONFIG[res].color,
    }))
    .filter((r) => r.count > 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        {t("backToDashboard")}
      </Link>

      <h1 className="font-display text-2xl font-bold mb-6">{t("title")}</h1>

      {/* Overview grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: t("total"), value: total, icon: Target, color: "var(--accent)" },
          { label: t("pending"), value: pending, icon: Clock, color: "var(--yellow)" },
          { label: t("accuracy"), value: `${accuracy}%`, icon: CheckCircle, color: "var(--green)" },
          { label: t("forecastScore"), value: `${score}%`, icon: TrendingUp, color: "var(--accent)" },
        ].map((item) => (
          <div key={item.label} className="card text-center">
            <item.icon size={18} style={{ color: item.color }} className="mx-auto mb-2" />
            <p className="font-mono text-2xl font-bold text-[var(--text-primary)]">
              {item.value}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {total === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-[var(--text-muted)] text-sm">
            {t("noData")}
          </p>
          <Link href="/dashboard" className="btn-primary inline-flex mt-4">
            {t("createFirst")}
          </Link>
        </div>
      ) : (
        <StatsCharts categoryData={categoryData} resolutionData={resolutionData} />
      )}
    </div>
  )
}
