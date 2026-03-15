import { Navbar } from "@/components/layout/Navbar"
import { MobileBottomNav } from "@/components/layout/MobileBottomNav"

export default function BolaoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      {children}
      <MobileBottomNav />
    </div>
  )
}
