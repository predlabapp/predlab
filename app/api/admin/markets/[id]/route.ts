import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function isAdmin(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? ""
  const token = auth.replace("Bearer ", "")
  return token === process.env.ADMIN_PASSWORD
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const market = await prisma.customMarket.update({
    where: { id: params.id },
    data: {
      ...(body.active !== undefined && { active: body.active }),
      ...(body.probability !== undefined && { probability: Number(body.probability) }),
    },
  })
  return NextResponse.json(market)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.customMarket.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
