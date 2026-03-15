import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { PaymentStatus } from "@prisma/client"
import { notifyPaymentStatus } from "@/lib/notifications"

const patchSchema = z.object({
  status: z.nativeEnum(PaymentStatus),
  note: z.string().max(200).optional(),
})

// PATCH — admin confirma/rejeita pagamento de um membro
export async function PATCH(
  req: Request,
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
  if (!bolao) return NextResponse.json({ error: "Bolão não encontrado." }, { status: 404 })

  const myMembership = bolao.members.find((m) => m.userId === session.user.id)
  if (!myMembership || myMembership.role !== "ADMIN") {
    return NextResponse.json({ error: "Apenas admins podem gerir pagamentos." }, { status: 403 })
  }

  const targetMember = bolao.members.find((m) => m.userId === params.userId)
  if (!targetMember) {
    return NextResponse.json({ error: "Membro não encontrado." }, { status: 404 })
  }

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { status, note } = parsed.data

  const payment = await prisma.bolaoPayment.upsert({
    where: { bolaoId_userId: { bolaoId: bolao.id, userId: params.userId } },
    create: {
      bolaoId: bolao.id,
      userId: params.userId,
      amount: 0,
      status,
      note,
      confirmedBy: status === "CONFIRMED" ? session.user.id : null,
      confirmedAt: status === "CONFIRMED" ? new Date() : null,
    },
    update: {
      status,
      note: note !== undefined ? note : undefined,
      confirmedBy: status === "CONFIRMED" ? session.user.id : null,
      confirmedAt: status === "CONFIRMED" ? new Date() : null,
    },
  })

  // Notify the member if status changed to CONFIRMED or REJECTED
  if (status === "CONFIRMED" || status === "REJECTED") {
    notifyPaymentStatus(params.userId, bolao.name, bolao.slug, status, note).catch(() => {})
  }

  return NextResponse.json({ payment })
}
