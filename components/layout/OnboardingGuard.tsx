"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

export function OnboardingGuard({
  children,
  complete,
}: {
  children: React.ReactNode
  complete: boolean
}) {
  const pathname = usePathname()
  const isProfilePage = pathname?.includes("/dashboard/profile")

  if (complete || isProfilePage) {
    return <>{children}</>
  }

  return (
    <>
      <div style={{ filter: "blur(3px)", pointerEvents: "none", userSelect: "none" }}>
        {children}
      </div>

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(10,10,15,0.85)",
          backdropFilter: "blur(6px)",
        }}
      >
        <div
          className="card"
          style={{ maxWidth: 420, width: "90%", textAlign: "center", padding: "36px 28px" }}
        >
          <div style={{ fontSize: 36, marginBottom: 16 }}>👤</div>
          <h2
            className="font-display font-bold text-xl mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Complete o seu perfil
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            Para usar a plataforma, você precisa primeiro definir um <strong>username</strong>. Isso
            permite aparecer nos rankings e compartilhar suas previsões.
          </p>
          <Link href="/dashboard/profile" className="btn-primary block w-full">
            Completar Perfil
          </Link>
        </div>
      </div>
    </>
  )
}
