import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — listar pagamentos do bolão (só membros)
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const bolao = await prisma.bolao.findUnique({
    where: { slug: params.slug },
    include: {
      members: { include: { user: { select: { id: true, name: true, image: true } } } },
      payments: {
        include: {
          user: { select: { id: true, name: true, image: true } },
          confirmer: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!bolao) return NextResponse.json({ error: "Bolão não encontrado." }, { status: 404 })

  const isMember = bolao.members.some((m) => m.userId === session.user.id)
  if (!isMember) return NextResponse.json({ error: "Acesso negado." }, { status: 403 })

  // Build payment list: one entry per member
  const payments = bolao.members.map((m) => {
    const payment = bolao.payments.find((p) => p.userId === m.userId)
    return {
      userId: m.userId,
      name: m.user.name ?? "—",
      image: m.user.image ?? null,
      amount: payment?.amount ?? null,
      status: payment?.status ?? "PENDING",
      confirmedAt: payment?.confirmedAt ?? null,
      note: payment?.note ?? null,
      confirmerName: payment?.confirmer?.name ?? null,
    }
  })

  const confirmed = payments.filter((p) => p.status === "CONFIRMED").length
  const totalAmount = bolao.payments
    .filter((p) => p.status === "CONFIRMED")
    .reduce((sum, p) => sum + p.amount, 0)

  return NextResponse.json({
    payments,
    summary: {
      total: bolao.members.length,
      confirmed,
      pending: bolao.members.length - confirmed,
      totalAmount,
    },
  })
}
