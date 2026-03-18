import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { password, platform = "instagram", slot = "1" } = body

    const adminPwd = process.env.ADMIN_PASSWORD
    if (!adminPwd) {
      return NextResponse.json({ error: "ADMIN_PASSWORD not configured on server" }, { status: 500 })
    }
    if (!password || password !== adminPwd) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 })
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? "https://predlab.app"
    const cronUrl = `${baseUrl}/api/cron/social?platform=${platform}&slot=${slot}`

    const res = await fetch(cronUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${cronSecret}` },
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
