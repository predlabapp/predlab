import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"
import { sendVerificationEmail } from "@/lib/email"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.emailVerified) return NextResponse.json({ error: "Already verified." }, { status: 400 })

  const token = randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { emailVerificationToken: token, emailVerificationExpires: expires },
  })

  await sendVerificationEmail(user.email, token)
  return NextResponse.json({ success: true })
}
