import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token")
  if (!token) return NextResponse.redirect(new URL("/auth/signin?error=invalid_token", req.url))

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationExpires: { gt: new Date() },
    },
  })

  if (!user) return NextResponse.redirect(new URL("/auth/signin?error=invalid_token", req.url))

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
  })

  return NextResponse.redirect(new URL("/auth/signin?verified=1", req.url))
}
