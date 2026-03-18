import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"
import { TwitterApi } from "twitter-api-v2"

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization")
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return auth === `Bearer ${secret}`
}

function brasiliaDateStr(): string {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  )
    .toISOString()
    .slice(0, 10)
}

function extractKeyword(title: string): string {
  const stopWords = new Set([
    "will", "when", "by", "the", "a", "an", "of", "in", "on", "at", "to", "for",
    "is", "be", "or", "and", "that", "this", "with", "from", "before", "after",
    "more", "than", "least", "most", "any", "have", "has", "had", "are", "was",
    "were", "what", "who", "how", "which", "its", "their", "first", "year",
    "end", "over", "under", "between", "during", "into", "out", "through",
  ])
  const words = title
    .replace(/[^a-zA-Z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w.toLowerCase()))
  return words.slice(0, 3).join(" ") || "world news"
}

function buildInstagramCaption(title: string, prob: number): string {
  const likelihood =
    prob >= 70 ? "very likely 🟢" :
    prob >= 55 ? "likely 🟡" :
    prob >= 45 ? "uncertain ⚖️" :
    prob >= 30 ? "unlikely 🟠" : "very unlikely 🔴"

  return `🔮 "${title}"

Current market probability: ${prob}% (${likelihood})

What's your prediction? Do you agree with the market — or do you see something others don't?

Record your forecast with real probability at predlab.app and build your verifiable reputation as a forecaster.

📊 Compare with live Polymarket data
⚡ Automatic resolution & tracking
🏆 Rankings by accuracy

#forecasting #predictions #predictionmarket #polymarket #predlab #forecast #probability #markets`
}

function buildTwitterCaption(title: string, prob: number): string {
  const likely =
    prob >= 60 ? "likely ✅" :
    prob >= 40 ? "uncertain ⚖️" : "unlikely ❌"

  return `🔮 "${title}"

Market says: ${prob}% — ${likely}

Do you agree? Record your prediction with real probability at predlab.app

#forecasting #polymarket #predlab #markets`
}

async function fetchTopMarket(excludeSlugs: string[] = []) {
  const res = await fetch(
    "https://gamma-api.polymarket.com/events?limit=100&active=true&closed=false&order=volume24hr&ascending=false",
    { headers: { Accept: "application/json" }, next: { revalidate: 0 } }
  )
  if (!res.ok) throw new Error(`Polymarket fetch failed: ${res.status}`)
  const events = await res.json()
  if (!Array.isArray(events)) throw new Error("Unexpected Polymarket response")

  for (const e of events) {
    try {
      if (excludeSlugs.includes(e.slug)) continue
      const markets: Array<Record<string, unknown>> = e.markets ?? []

      // Skip multi-outcome "who will win" events — they have placeholder sub-markets
      // like "Team Z", "Any Other", etc. Only use events with ≤ 8 sub-markets.
      if (markets.length > 8) continue

      // Find the best sub-market: probability in [30, 70] (most uncertain = most engaging)
      for (const m of markets) {
        const question = String(m.question ?? "")

        // Skip malformed or low-quality questions
        const groupItemTitle = String(m.groupItemTitle ?? "")

        // Skip country/team code abbreviations: "AM", "Team AM", "BR", "USA"
        if (groupItemTitle && /^(Team\s+)?[A-Z]{2,4}$/.test(groupItemTitle.trim())) continue

        // Skip "Any Other" catch-all markets
        if (question.includes("Any Other")) continue

        // Skip short-term esports / sports betting micro-markets
        if (/Total Kills|First Blood|Game \d Winner|O\/U \d|Over\/Under|Game Handicap|Match Winner.*LoL|Match Winner.*Dota/i.test(question)) continue

        // Skip questions that are too short to be meaningful
        if (question.length < 25) continue

        const prices =
          typeof m.outcomePrices === "string"
            ? JSON.parse(m.outcomePrices as string)
            : (m.outcomePrices as string[]) ?? ["0.5"]
        const outcomes =
          typeof m.outcomes === "string"
            ? JSON.parse(m.outcomes as string)
            : (m.outcomes as string[]) ?? ["Yes"]
        const yesIdx = outcomes.findIndex((o: string) => o.toLowerCase() === "yes")
        const idx = yesIdx >= 0 ? yesIdx : 0
        const prob = Math.round(parseFloat(String(prices[idx])) * 100)
        if (prob >= 30 && prob <= 70) {
          return {
            question,
            slug: e.slug as string,
            probability: prob,
          }
        }
      }
    } catch {}
  }
  throw new Error("No suitable market found")
}

const UNSPLASH_FALLBACKS = [
  "politics", "government", "world leaders", "diplomacy",
  "economy", "finance", "stock market",
  "technology", "global news",
]

async function fetchUnsplashImage(query: string): Promise<{ url: string; author: string }> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) {
    console.error("[cron/social] UNSPLASH_ACCESS_KEY not set")
    return { url: "", author: "" }
  }

  // Try full query, then each individual word, then generic fallbacks
  const words = query.split(" ").filter((w) => w.length > 3)
  const queries = [query, ...words, ...UNSPLASH_FALLBACKS]

  for (const q of queries) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(q)}&orientation=squarish&content_filter=high`,
        { headers: { Authorization: `Client-ID ${key}` }, next: { revalidate: 0 } }
      )
      if (res.status === 404) continue
      if (!res.ok) continue
      const data = await res.json()
      const url = data.urls?.regular ?? ""
      if (url) return { url, author: data.user?.name ?? "" }
    } catch {
      // continua para próxima query
    }
  }
  return { url: "", author: "" }
}

// Upload image to Vercel Blob and return stable CDN URL
async function uploadImageToBlob(ogImageUrl: string, filename: string): Promise<string> {
  const res = await fetch(ogImageUrl)
  if (!res.ok) throw new Error(`Failed to fetch OG image: ${res.status}`)
  const buffer = await res.arrayBuffer()
  const blob = await put(`social/${filename}`, buffer, {
    access: "public",
    contentType: "image/png",
    addRandomSuffix: false,
  })
  return blob.url
}

async function postToInstagram(imageUrl: string, caption: string): Promise<string> {
  const igId = process.env.META_INSTAGRAM_ACCOUNT_ID
  const token = process.env.META_ACCESS_TOKEN
  if (!igId || !token) throw new Error("Missing Meta credentials")

  const base = `https://graph.facebook.com/v22.0/${igId}`

  const createRes = await fetch(`${base}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
  })
  const createData = await createRes.json()
  if (!createRes.ok || !createData.id) {
    throw new Error(`Media create failed: ${JSON.stringify(createData)}`)
  }

  await new Promise((r) => setTimeout(r, 2000))

  const publishRes = await fetch(`${base}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: createData.id, access_token: token }),
  })
  const publishData = await publishRes.json()
  if (!publishRes.ok || !publishData.id) {
    throw new Error(`Publish failed: ${JSON.stringify(publishData)}`)
  }

  return publishData.id as string
}

// ─── Twitter / X ────────────────────────────────────────────────────────────

async function postToTwitter(blobUrl: string, caption: string): Promise<string> {
  const client = new TwitterApi({
    appKey: process.env.X_API_KEY ?? "",
    appSecret: process.env.X_API_SECRET ?? "",
    accessToken: process.env.X_ACCESS_TOKEN ?? "",
    accessSecret: process.env.X_ACCESS_TOKEN_SECRET ?? "",
  })

  // 1. Fetch image from Blob CDN
  const imgRes = await fetch(blobUrl)
  if (!imgRes.ok) throw new Error(`Failed to fetch blob image: ${imgRes.status}`)
  const imageBuffer = Buffer.from(await imgRes.arrayBuffer())

  // 2. Upload image
  const mediaId = await client.v1.uploadMedia(imageBuffer, { mimeType: "image/png" })

  // 3. Post tweet
  const tweet = await client.v2.tweet({ text: caption, media: { media_ids: [mediaId] } })
  const tweetId = tweet.data?.id
  if (!tweetId) throw new Error(`No tweet ID in response`)
  return tweetId
}

// ─── Scheduled times ─────────────────────────────────────────────────────────

const SCHEDULE_TIMES: Record<string, Record<string, string>> = {
  instagram: { "1": "12:00", "2": "19:00" },
  twitter: { "1": "08:00", "2": "12:00", "3": "17:00", "4": "21:00" },
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const platform = (searchParams.get("platform") ?? "instagram") as "instagram" | "twitter"
  const slot = searchParams.get("slot") ?? "1"
  const scheduledTime = SCHEDULE_TIMES[platform]?.[slot] ?? "19:00"
  const imageFormat = platform === "twitter" ? "landscape" : "square"
  const today = brasiliaDateStr()

  // Idempotency: skip if already done for this platform+slot today
  const existing = await prisma.socialPost.findFirst({
    where: { date: today, platform, scheduledTime },
  })
  if (existing) {
    return NextResponse.json({ skipped: true, date: today, platform, slot, status: existing.status })
  }

  // Avoid repeating the same market across slots for the same platform today
  const todayPosts = await prisma.socialPost.findMany({
    where: { date: today, platform },
    select: { marketSlug: true },
  })
  const excludeSlugs = todayPosts.map((p) => p.marketSlug).filter(Boolean) as string[]

  let socialPost: { id: string } | null = null

  try {
    const market = await fetchTopMarket(excludeSlugs)
    const keyword = extractKeyword(market.question)
    const { url: unsplashApiUrl, author: unsplashAuthor } = await fetchUnsplashImage(keyword)

    // Upload Unsplash image to Vercel Blob for reliable access in OG image route
    let unsplashUrl = ""
    console.log(`[cron/social] unsplashApiUrl: ${unsplashApiUrl || "(empty)"}`)
    if (unsplashApiUrl) {
      try {
        const imgRes = await fetch(unsplashApiUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; PredLab/1.0)" },
        })
        console.log(`[cron/social] Unsplash fetch status: ${imgRes.status}`)
        if (imgRes.ok) {
          const imgBuf = await imgRes.arrayBuffer()
          const mime = imgRes.headers.get("content-type") ?? "image/jpeg"
          const ext = mime.includes("png") ? "png" : "jpg"
          const blobResult = await put(
            `unsplash/${today}-${platform}-${slot}.${ext}`,
            imgBuf,
            { access: "public", contentType: mime, addRandomSuffix: true }
          )
          unsplashUrl = blobResult.url
          console.log(`[cron/social] Unsplash blob uploaded: ${unsplashUrl}`)
        }
      } catch (e) {
        console.error(`[cron/social] Unsplash upload failed: ${String(e)}`)
      }
    }

    const caption =
      platform === "instagram"
        ? buildInstagramCaption(market.question, market.probability)
        : buildTwitterCaption(market.question, market.probability)

    const baseUrl = process.env.NEXTAUTH_URL ?? "https://predlab.app"

    socialPost = await prisma.socialPost.create({
      data: {
        date: today,
        marketTitle: market.question,
        marketSlug: market.slug,
        probability: market.probability,
        unsplashUrl,
        unsplashAuthor,
        caption,
        ogImageUrl: "",
        platform,
        scheduledTime,
        imageFormat,
        status: "pending",
      },
    })

    // OG image URL (for admin preview)
    const ogImageUrl = `${baseUrl}/api/og/social/${socialPost.id}`
    await prisma.socialPost.update({
      where: { id: socialPost.id },
      data: { ogImageUrl },
    })

    // Upload to Vercel Blob — stable CDN URL required by Instagram/Twitter
    const blobFilename = `${today}-${platform}-${slot}-${socialPost.id}.png`
    const blobUrl = await uploadImageToBlob(ogImageUrl, blobFilename)

    if (platform === "instagram") {
      const instagramPostId = await postToInstagram(blobUrl, caption)
      await prisma.socialPost.update({
        where: { id: socialPost.id },
        data: { instagramPostId, status: "published" },
      })
      console.log(`[cron/social] Instagram published: ${instagramPostId}`)
    } else {
      // TWITTER POSTING TEMPORARILY DISABLED
      // X flagged account as potential bot — re-enable when cleared
      // const twitterPostId = await postToTwitter(blobUrl, caption)
      // await prisma.socialPost.update({
      //   where: { id: socialPost.id },
      //   data: { twitterPostId, status: "published" },
      // })
      // console.log(`[cron/social] Twitter published: ${twitterPostId}`)
      await prisma.socialPost.update({
        where: { id: socialPost.id },
        data: { status: "ready" },
      })
      console.log(`[cron/social] Twitter post ready (auto-publish disabled)`)
    }

    return NextResponse.json({
      success: true,
      date: today,
      platform,
      slot,
      market: market.question,
    })
  } catch (err) {
    const errorMsg = String(err)
    console.error(`[cron/social] Error (${platform} slot ${slot}):`, errorMsg)

    if (socialPost) {
      await prisma.socialPost.update({
        where: { id: socialPost.id },
        data: { status: "failed", error: errorMsg },
      }).catch(() => {})
    } else {
      await prisma.socialPost.create({
        data: {
          date: today,
          marketTitle: "",
          marketSlug: "",
          probability: 0,
          unsplashUrl: "",
          caption: "",
          ogImageUrl: "",
          platform,
          scheduledTime,
          imageFormat,
          status: "failed",
          error: errorMsg,
        },
      }).catch(() => {})
    }

    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
