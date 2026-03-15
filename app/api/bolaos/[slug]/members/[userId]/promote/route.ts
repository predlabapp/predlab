import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST — promover membro a ADMIN (só criador original)
export async function POST(
  _req: Request,
  { params }: { params: { slug: string; userId: string } }
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

  if (bolao.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Apenas o criador pode promover membros." }, { status: 403 })
  }

  const target = bolao.members.find((m) => m.userId === params.userId)
  if (!target) {
    return NextResponse.json({ error: "Membro não encontrado." }, { status: 404 })
  }

  const updated = await prisma.bolaoMember.update({
    where: { bolaoId_userId: { bolaoId: bolao.id, userId: params.userId } },
    data: { role: "ADMIN" },
  })

  return NextResponse.json({ success: true, role: updated.role })
}
