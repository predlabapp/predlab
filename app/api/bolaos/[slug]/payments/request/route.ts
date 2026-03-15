import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST — membro sinaliza que fez o pagamento
export async function POST(
  req: Request,
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
  if (!bolao) return NextResponse.json({ error: "Bolão não encontrado." }, { status: 404 })

  const isMember = bolao.members.some((m) => m.userId === session.user.id)
  if (!isMember) return NextResponse.json({ error: "Apenas membros podem sinalizar pagamentos." }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const note: string | undefined = typeof body?.note === "string" ? body.note.slice(0, 200) : undefined

  const payment = await prisma.bolaoPayment.upsert({
    where: { bolaoId_userId: { bolaoId: bolao.id, userId: session.user.id } },
    create: {
      bolaoId: bolao.id,
      userId: session.user.id,
      amount: 0,
      status: "PENDING",
      note,
    },
    update: {
      status: "PENDING",
      note: note !== undefined ? note : undefined,
    },
  })

  return NextResponse.json({ payment })
}
