"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useState } from "react"
import { LogOut, BarChart2, ChevronDown, Trophy } from "lucide-react"

export function Navbar() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  return (
    <nav className="border-b border-[var(--border)] px-4 py-3 sticky top-0 z-40 bg-[var(--bg)]/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link
          href="/dashboard"
          className="font-display text-base sm:text-lg font-bold gradient-text"
        >
          🔮 PredLab
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/dashboard/stats"
            className="p-2.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            title="Estatísticas"
          >
            <BarChart2 size={17} />
          </Link>

          <Link
            href="/dashboard/rankings"
            className="p-2.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            title="Rankings"
          >
            <Trophy size={17} />
          </Link>

          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[var(--bg-card)] transition-colors text-sm text-[var(--text-secondary)]"
            >
              <span className="w-7 h-7 rounded-full bg-[var(--accent-dim)] flex items-center justify-center text-xs text-white font-medium">
                {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
              </span>
              <span className="hidden sm:block max-w-[120px] truncate">
                {session?.user?.name ?? session?.user?.email}
              </span>
              <ChevronDown size={14} />
            </button>

            {open && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-44 sm:w-48 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-xl z-20 overflow-hidden">
                  <div className="px-3 py-2 border-b border-[var(--border)]">
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {session?.user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--red)] hover:bg-[rgba(248,113,113,0.05)] transition-colors"
                  >
                    <LogOut size={14} />
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
