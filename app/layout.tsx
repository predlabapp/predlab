import type { Metadata } from "next"
import { Syne, DM_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/layout/Providers"

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
})

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "PredLab",
    template: "%s — PredLab",
  },
  description: "Regista as tuas previsões com probabilidade real. Compara com o mercado. Constrói reputação verificável.",
  metadataBase: new URL("https://predlab.app"),
  openGraph: {
    siteName: "PredLab",
    title: "PredLab — Regista e verifica as tuas previsões",
    description: "Regista as tuas previsões com probabilidade real. Compara com o Polymarket. Constrói reputação verificável.",
    url: "https://predlab.app",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PredLab — Regista e verifica as tuas previsões",
    description: "Regista as tuas previsões com probabilidade real. Compara com o Polymarket. Constrói reputação verificável.",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt" className={`${syne.variable} ${dmMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
