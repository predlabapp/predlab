"use client"

import { useEffect, useState } from "react"
import { Link } from "@/navigation"

type OrbData = { orbs: number; level: number; levelName: string }

export function OrbBalance() {
  const [data, setData] = useState<OrbData | null>(null)

  useEffect(() => {
    fetch("/api/orbs")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data) return null

  return (
    <Link
      href="/dashboard/orbs"
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-colors hover:bg-[var(--bg-card)]"
      style={{ color: "var(--accent)" }}
      title={`${data.levelName} — ${data.orbs.toLocaleString()} Orbs`}
    >
      <span>🔮</span>
      <span className="font-mono font-semibold">{data.orbs.toLocaleString()}</span>
    </Link>
  )
}
