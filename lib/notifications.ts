import { prisma } from "@/lib/prisma"

interface CreateNotificationInput {
  userId: string
  type: string
  title: string
  message: string
  link?: string
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({ data: input })
}

export async function createNotifications(inputs: CreateNotificationInput[]) {
  if (inputs.length === 0) return
  return prisma.notification.createMany({ data: inputs })
}

// Bolão-specific helpers
export async function notifyBolaoJoin(
  bolaoName: string,
  bolaoSlug: string,
  joinerName: string,
  adminUserIds: string[]
) {
  await createNotifications(
    adminUserIds.map((userId) => ({
      userId,
      type: "bolao_join",
      title: "Novo membro no bolão",
      message: `${joinerName} entrou no teu bolão "${bolaoName}"`,
      link: `/bolao/${bolaoSlug}`,
    }))
  )
}

export async function notifyMercadoCreated(
  question: string,
  bolaoName: string,
  bolaoSlug: string,
  creatorName: string,
  mercadoId: string,
  memberUserIds: string[],
  creatorId: string
) {
  const recipients = memberUserIds.filter((id) => id !== creatorId)
  await createNotifications(
    recipients.map((userId) => ({
      userId,
      type: "mercado_created",
      title: "Novo mercado no grupo",
      message: `${creatorName} criou um mercado em "${bolaoName}": "${question.slice(0, 60)}${question.length > 60 ? "…" : ""}"`,
      link: `/bolao/${bolaoSlug}`,
    }))
  )
}

export async function notifyMercadoResolved(
  question: string,
  bolaoSlug: string,
  resolution: string,
  mediaGrupo: number | null,
  bestForecaster: string | null,
  votos: { userId: string; probability: number }[],
  memberUserIds: string[]
) {
  const resLabel = resolution === "SIM" ? "SIM" : resolution === "NAO" ? "NÃO" : "Cancelado"
  const groupAcertou =
    mediaGrupo !== null
      ? (resolution === "SIM" ? mediaGrupo >= 50 : resolution === "NAO" ? mediaGrupo < 50 : null)
      : null

  await createNotifications(
    memberUserIds.map((userId) => {
      const voto = votos.find((v) => v.userId === userId)
      let extra = ""
      if (voto && resolution !== "CANCELADO") {
        const acertou = resolution === "SIM" ? voto.probability >= 50 : voto.probability < 50
        extra = acertou ? " O teu voto estava certo!" : " O teu voto estava errado."
      }
      const best = bestForecaster ? ` Melhor forecaster: ${bestForecaster}.` : ""
      return {
        userId,
        type: "mercado_resolved",
        title: `Mercado resolvido: ${resLabel}`,
        message: `"${question.slice(0, 50)}${question.length > 50 ? "…" : ""}"${extra}${best}`,
        link: `/bolao/${bolaoSlug}`,
      }
    })
  )
}

export async function notifyPaymentStatus(
  userId: string,
  bolaoName: string,
  bolaoSlug: string,
  status: "CONFIRMED" | "REJECTED",
  note?: string | null
) {
  const isConfirmed = status === "CONFIRMED"
  await createNotification({
    userId,
    type: "payment_status",
    title: isConfirmed ? "Pagamento confirmado" : "Pagamento rejeitado",
    message: isConfirmed
      ? `O teu pagamento para "${bolaoName}" foi confirmado.`
      : `O teu pagamento para "${bolaoName}" foi rejeitado.${note ? ` Motivo: ${note}` : ""}`,
    link: `/bolao/${bolaoSlug}`,
  })
}

export async function notifyPromotion(
  userId: string,
  bolaoName: string,
  bolaoSlug: string,
  promoterName: string
) {
  await createNotification({
    userId,
    type: "promoted_admin",
    title: "Promovido a admin",
    message: `${promoterName} promoveu-te a admin no bolão "${bolaoName}".`,
    link: `/bolao/${bolaoSlug}`,
  })
}
