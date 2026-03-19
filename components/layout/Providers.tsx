"use client"

import { SessionProvider } from "next-auth/react"
import { PrivyProvider } from "@privy-io/react-auth"
import { ToastProvider } from "@/components/ui/Toast"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ["email", "google", "wallet"],
        appearance: {
          theme: "dark",
          accentColor: "#7c6af7",
          logo: "https://predlab.app/logo-horizontal.svg",
        },
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
      }}
    >
      <SessionProvider>
        <ToastProvider>{children}</ToastProvider>
      </SessionProvider>
    </PrivyProvider>
  )
}
