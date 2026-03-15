import type { Metadata } from "next"
import { Syne, DM_Mono } from "next/font/google"
import "./globals.css"

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
  metadataBase: new URL("https://predlab.app"),
  title: {
    default: "PredLab — Track Your Predictions",
    template: "%s | PredLab",
  },
  description:
    "Record your forecasts with real probabilities, compare with Polymarket live data, and build your verifiable reputation as a forecaster.",
  keywords: [
    "prediction market", "forecasting", "polymarket", "predictions",
    "probability", "forecast tracker", "accuracy score",
  ],
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    url: "https://predlab.app",
    siteName: "PredLab",
    title: "PredLab — Track Your Predictions",
    description:
      "Record your forecasts with real probabilities, compare with Polymarket live data, and build your verifiable reputation as a forecaster.",
    images: [{ url: "/og-default.svg", width: 1200, height: 630, alt: "PredLab" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@predlabapp",
    title: "PredLab — Track Your Predictions",
    description:
      "Record your forecasts with real probabilities, compare with Polymarket live data, and build your verifiable reputation as a forecaster.",
    images: ["/og-default.svg"],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html className={`${syne.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
