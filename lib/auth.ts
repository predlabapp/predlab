import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { OrbReason } from "@prisma/client"
import { awardOrbs } from "@/lib/orbs"
import { updateStreak } from "@/lib/gamification"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
    // next-intl middleware will prepend the locale prefix automatically
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          username: user.username,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.id) return true

      // Ensure emailVerified is set for OAuth users
      if (account?.provider === "google") {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        }).catch(() => {})
      }

      // Daily login reward — só 1x por dia (updateStreak já verifica)
      Promise.all([
        updateStreak(user.id),
        (async () => {
          const u = await prisma.user.findUnique({
            where: { id: user.id },
            select: { lastActivityAt: true },
          })
          const lastActivity = u?.lastActivityAt
          const diffDays = lastActivity
            ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
            : 1
          if (diffDays >= 1) {
            await awardOrbs(user.id, 10, OrbReason.DAILY_LOGIN, "📅 Login diário!")
          }
        })(),
      ]).catch(() => {})

      return true
    },
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
