import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-20 text-center">
      <p className="text-[var(--text-muted)] text-sm mb-4">Prediction not found.</p>
      <Link href="/en/dashboard" className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline">
        <ArrowLeft size={14} />
        Back to dashboard
      </Link>
    </div>
  )
}
