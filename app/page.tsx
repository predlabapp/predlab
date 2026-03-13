import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { HeroSection } from "@/components/landing/HeroSection"
import { HotMarketsGrid } from "@/components/landing/HotMarketsGrid"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { Differentials } from "@/components/landing/Differentials"

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  if (session) redirect("/dashboard")

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">

      {/* Navbar */}
      <nav
        className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto"
        style={{ backdropFilter: "blur(12px)", background: "rgba(10,10,15,0.85)" }}
      >
        <Link href="/" className="font-display text-lg font-bold gradient-text flex items-center gap-2">
          🔮 PredLab
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/auth/signin" className="btn-ghost text-sm px-3 py-1.5">
            Entrar
          </Link>
          <Link href="/auth/signup" className="btn-primary text-sm px-3 py-1.5">
            Criar conta →
          </Link>
        </div>
      </nav>

      {/* Hero with gradient background */}
      <div
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,106,247,0.12) 0%, transparent 70%)",
        }}
      >
        <HeroSection />
      </div>

      {/* Hot markets — core of landing */}
      <HotMarketsGrid />

      {/* How it works */}
      <HowItWorks />

      {/* Differentials */}
      <Differentials />

      {/* Final CTA */}
      <section className="border-t border-[var(--border)] py-20 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="font-display text-3xl font-bold mb-4 text-[var(--text-primary)]">
            Qual é a tua primeira previsão?
          </h2>
          <div className="mt-8 mb-5">
            <a href="#mercados" className="btn-primary text-base px-10 py-3 inline-block">
              🌍 Ver mercados em alta →
            </a>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Grátis · Sem cartão · Sem crypto
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 px-6 text-center">
        <p className="text-xs text-[var(--text-muted)]">
          PredLab · 2026
        </p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/terms" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
            Termos
          </Link>
          <Link href="/privacy" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
            Privacidade
          </Link>
        </div>
      </footer>

    </main>
  )
}
