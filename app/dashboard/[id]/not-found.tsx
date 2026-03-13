import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-20 text-center">
      <p className="text-[var(--text-muted)] text-sm mb-4">Previsão não encontrada.</p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
      >
        <ArrowLeft size={14} />
        Voltar ao dashboard
      </Link>
    </div>
  )
}
