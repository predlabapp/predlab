import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { privyClient } from "@/lib/privy-server"
import { OrbReason } from "@prisma/client"
import { awardOrbs } from "@/lib/orbs"
import { awardBadge } from "@/lib/badges"
import { updateStreak } from "@/lib/gamification"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      id: "privy",
      name: "Privy",
      credentials: { token: { type: "text" } },
      async authorize(credentials) {
        if (!credentials?.token) return null

        try {
          // Verify Privy token server-side
          const claims = await privyClient.verifyAuthToken(credentials.token)
          const privyUser = await privyClient.getUser(claims.userId)

          // Extract email from any login method
          const email =
            privyUser.email?.address ??
            privyUser.google?.email ??
            null

          const walletAddress =
            privyUser.wallet?.address ?? null

          const name =
            privyUser.google?.name ??
            privyUser.email?.address?.split("@")[0] ??
            "Forecaster"

          // Find existing user by privyUserId or email (migration)
          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { privyUserId: claims.userId },
                ...(email ? [{ email }] : []),
              ],
            },
          })

          if (user) {
            // Update Privy fields if not yet set (migration of existing user)
            await prisma.user.update({
              where: { id: user.id },
              data: {
                privyUserId: user.privyUserId ?? claims.userId,
                walletAddress: user.walletAddress ?? walletAddress,
              },
            })
          } else {
            // New user — create account
            if (!email) return null

            user = await prisma.user.create({
              data: {
                email,
                name,
                privyUserId: claims.userId,
                walletAddress,
                emailVerified: new Date(),
                orbs: 0,
                totalOrbsEarned: 0,
                xp: 0,
              },
            })

            // Welcome bonuses
            await Promise.all([
              awardOrbs(user.id, 500, OrbReason.SIGNUP_BONUS,
                "🔮 Bem-vindo ao PredLab! Aqui estão os teus primeiros Orbs."),
              awardBadge(user.id, "newcomer"),
            ])
          }

          // Daily login + streak
          Promise.all([
            updateStreak(user.id),
            (async () => {
              const u = await prisma.user.findUnique({
                where: { id: user!.id },
                select: { lastActivityAt: true },
              })
              const diffDays = u?.lastActivityAt
                ? Math.floor((Date.now() - u.lastActivityAt.getTime()) / 86400000)
                : 1
              if (diffDays >= 1) {
                await awardOrbs(user!.id, 10, OrbReason.DAILY_LOGIN, "📅 Login diário!")
              }
            })(),
          ]).catch(() => {})

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            username: user.username,
          }
        } catch (err) {
          console.error("Privy auth error:", err)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = (user as any).username
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string | null
      }
      return session
    },
  },
}
