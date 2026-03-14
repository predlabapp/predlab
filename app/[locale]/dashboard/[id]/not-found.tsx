import { Link } from "@/navigation"
import { ArrowLeft } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function NotFound() {
  const t = await getTranslations("NotFound")

  return (
    <div className="max-w-5xl mx-auto px-4 py-20 text-center">
      <p className="text-[var(--text-muted)] text-sm mb-4">{t("predictionNotFound")}</p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
      >
        <ArrowLeft size={14} />
        {t("backToDashboard")}
      </Link>
    </div>
  )
}
