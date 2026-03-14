import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"
import { MobileBottomNav } from "@/components/layout/MobileBottomNav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/auth/signin")

  return (
    <div className="min-h-screen">
      <Navbar />
      {children}
      <MobileBottomNav />
    </div>
  )
}
