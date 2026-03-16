import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"
import { MobileBottomNav } from "@/components/layout/MobileBottomNav"
import { OnboardingGuard } from "@/components/layout/OnboardingGuard"
import { prisma } from "@/lib/prisma"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/auth/signin")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  })
  const profileComplete = !!user?.username

  return (
    <div className="min-h-screen">
      <Navbar />
      <OnboardingGuard complete={profileComplete}>
        {children}
      </OnboardingGuard>
      <MobileBottomNav />
    </div>
  )
}
