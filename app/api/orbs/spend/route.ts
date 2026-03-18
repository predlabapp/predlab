import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { spendOrbs } from "@/lib/orbs"
import { awardBadge, BADGE_DEFS } from "@/lib/badges"
import { OrbReason, BadgeSource } from "@prisma/client"

const SHOP_ITEMS: Record<string, { cost: number; reason: OrbReason; description: string; badgeKey?: string }> = {
  badge_verificado: { cost: 500,  reason: OrbReason.BADGE_PURCHASE,  description: "🔍 Badge Analista Verificado",  badgeKey: "badge_verificado" },
  badge_oraculo:    { cost: 2000, reason: OrbReason.BADGE_PURCHASE,  description: "🔮 Badge Oráculo de Ouro",       badgeKey: "badge_oraculo" },
  theme_neon:       { cost: 1000, reason: OrbReason.THEME_PURCHASE,  description: "💜 Tema Neon Purple" },
  theme_matrix:     { cost: 1000, reason: OrbReason.THEME_PURCHASE,  description: "💚 Tema Matrix Green" },
  theme_solar:      { cost: 1500, reason: OrbReason.THEME_PURCHASE,  description: "🌟 Tema Solar Gold" },
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { item } = await req.json()
  const shopItem = SHOP_ITEMS[item]
  if (!shopItem) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 })

  // Check badge not already owned
  if (shopItem.badgeKey) {
    const def = BADGE_DEFS[shopItem.badgeKey]
    if (!def?.purchasable) return NextResponse.json({ error: "Item não comprável" }, { status: 400 })
  }

  const result = await spendOrbs(session.user.id, shopItem.cost, shopItem.reason, shopItem.description)
  if (!result.success) return NextResponse.json({ success: false, message: result.message }, { status: 400 })

  if (shopItem.badgeKey) {
    await awardBadge(session.user.id, shopItem.badgeKey, BadgeSource.PURCHASED)
  }

  return NextResponse.json({ success: true })
}
