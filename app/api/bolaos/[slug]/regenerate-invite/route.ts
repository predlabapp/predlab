import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

// POST — regenerar código de convite (só admins)
export async function POST(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const bolao = await prisma.bolao.findUnique({
    where: { slug: params.slug },
    include: { members: true },
  })
  if (!bolao) {
    return NextResponse.json({ error: "Bolão não encontrado." }, { status: 404 })
  }

  const member = bolao.members.find((m) => m.userId === session.user.id)
  if (!member || member.role !== "ADMIN") {
    return NextResponse.json({ error: "Apenas admins podem regenerar o código de convite." }, { status: 403 })
  }

  const newInviteCode = randomBytes(6).toString("hex")

  const updated = await prisma.bolao.update({
    where: { slug: params.slug },
    data: { inviteCode: newInviteCode },
  })

  return NextResponse.json({ inviteCode: updated.inviteCode })
}
