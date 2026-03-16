import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { sendVerificationEmail } from "@/lib/email"

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password } = schema.parse(body)

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email já registado." }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const token = randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        emailVerificationToken: token,
        emailVerificationExpires: expires,
      },
    })

    await sendVerificationEmail(email, token).catch(() => {})

    return NextResponse.json({ id: user.id }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
    }
    return NextResponse.json({ error: "Erro interno." }, { status: 500 })
  }
}
