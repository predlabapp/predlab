"use client"

import { useState } from "react"
import { usePathname } from "@/navigation"
import { Link } from "@/navigation"
import { signOut } from "next-auth/react"
import { usePrivy } from "@privy-io/react-auth"
import { useTranslations } from "next-intl"
import { Home, BarChart2, Trophy, Users, Brain, MoreHorizontal, X, LogOut, UserCircle, Award } from "lucide-react"
import { HowItWorksModal } from "@/components/ui/HowItWorksModal"
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher"

export function MobileBottomNav() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()
  const t = useTranslations("Nav")
  const { logout: privyLogout } = usePrivy()

  async function handleSignOut() {
    setDrawerOpen(false)
    await privyLogout()
    signOut({ callbackUrl: "/" })
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(href)
  }

  const activeColor = "var(--accent)"
  const inactiveColor = "var(--text-muted)"

  const tabClass = (href: string) =>
    `flex flex-col items-center gap-0.5 flex-1 py-2 transition-colors`

  const tabColor = (href: string) => ({
    color: isActive(href) ? activeColor : inactiveColor,
  })

  return (
    <>
      {/* Spacer so content is not hidden behind the nav bar */}
      <div className="h-16 sm:hidden" />

      {/* Bottom nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 sm:hidden"
        style={{
          background: "var(--bg-card)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div className="flex items-stretch">
          {/* Home */}
          <Link href="/dashboard" className={tabClass("/dashboard")} style={tabColor("/dashboard")}>
            <Home size={20} />
            <span style={{ fontSize: 10 }}>{t("home")}</span>
          </Link>

          {/* Stats */}
          <Link href="/dashboard/stats" className={tabClass("/dashboard/stats")} style={tabColor("/dashboard/stats")}>
            <BarChart2 size={20} />
            <span style={{ fontSize: 10 }}>{t("stats")}</span>
          </Link>

          {/* Bolões */}
          <Link href="/dashboard/bolaos" className={tabClass("/dashboard/bolaos")} style={tabColor("/dashboard/bolaos")}>
            <Users size={20} />
            <span style={{ fontSize: 10 }}>Bolões</span>
          </Link>

          {/* Grupos */}
          <Link href="/grupos" className={tabClass("/grupos")} style={tabColor("/grupos")}>
            <Brain size={20} />
            <span style={{ fontSize: 10 }}>Grupos</span>
          </Link>

          {/* More */}
          <button
            className={tabClass("")}
            style={{ color: drawerOpen ? activeColor : inactiveColor }}
            onClick={() => setDrawerOpen(true)}
          >
            <MoreHorizontal size={20} />
            <span style={{ fontSize: 10 }}>{t("more")}</span>
          </button>
        </div>
      </nav>

      {/* More drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 sm:hidden"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
            onClick={() => setDrawerOpen(false)}
          />

          {/* Sheet sliding up from bottom */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 sm:hidden rounded-t-2xl"
            style={{
              background: "var(--bg-card)",
              borderTop: "1px solid var(--border)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Drawer header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <span
                className="font-mono text-xs uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                {t("more")}
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-md"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer items */}
            <div className="flex flex-col px-4 py-3 gap-1">
              {/* Orbs */}
              <Link
                href="/dashboard/orbs"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 w-full px-2 py-3 rounded-lg transition-colors"
                style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border)" }}
              >
                <span>🔮</span>
                <span className="text-sm">Orbs</span>
              </Link>

              {/* Badges */}
              <Link
                href="/dashboard/badges"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 w-full px-2 py-3 rounded-lg transition-colors"
                style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border)" }}
              >
                <Award size={16} />
                <span className="text-sm">Badges</span>
              </Link>

              {/* Rankings */}
              <Link
                href="/dashboard/rankings"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 w-full px-2 py-3 rounded-lg transition-colors"
                style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border)" }}
              >
                <Trophy size={16} />
                <span className="text-sm">{t("rankings")}</span>
              </Link>

              {/* How it works */}
              <div
                className="flex items-center px-2 py-3"
                style={{ borderBottom: "1px solid var(--border)" }}
                onClick={() => setDrawerOpen(false)}
              >
                <HowItWorksModal />
              </div>

              {/* Language switcher */}
              <div
                className="flex items-center px-2 py-3"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <span
                  className="text-sm mr-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {t("language")}
                </span>
                <LocaleSwitcher />
              </div>

              {/* Profile */}
              <Link
                href="/dashboard/profile"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 w-full px-2 py-3 rounded-lg transition-colors"
                style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border)" }}
              >
                <UserCircle size={16} />
                <span className="text-sm">Perfil</span>
              </Link>

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-2 py-3 rounded-lg transition-colors text-left"
                style={{ color: "var(--text-secondary)" }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "var(--red)"
                  e.currentTarget.style.background = "rgba(248,113,113,0.05)"
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "var(--text-secondary)"
                  e.currentTarget.style.background = "transparent"
                }}
              >
                <LogOut size={16} />
                <span className="text-sm">{t("signOut")}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
