"use client"

import { useState, useEffect } from "react"

type SocialPost = {
  id: string
  date: string
  marketTitle: string
  marketSlug: string
  probability: number
  unsplashUrl: string
  ogImageUrl: string
  caption: string
  platform: string
  scheduledTime: string | null
  imageFormat: string
  instagramPostId: string | null
  twitterPostId: string | null
  status: string
  error: string | null
  createdAt: string
}

type HistoryItem = {
  id: string
  date: string
  marketTitle: string
  probability: number
  platform: string
  scheduledTime: string | null
  status: string
  instagramPostId: string | null
  ogImageUrl: string
}

type ApiResponse = {
  instagram: SocialPost[]
  twitter: SocialPost[]
  history: HistoryItem[]
}

const s = {
  page: { minHeight: "100vh", background: "#0a0a0f", fontFamily: "system-ui, sans-serif", padding: "40px 24px" } as React.CSSProperties,
  container: { maxWidth: 960, margin: "0 auto" } as React.CSSProperties,
  card: { background: "#111118", border: "1px solid #1e1e2e", borderRadius: 12, padding: "24px" } as React.CSSProperties,
  label: { color: "#8888aa", fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, marginBottom: 16 },
  title: { color: "#e8e8f0", fontSize: 24, fontWeight: 700, margin: 0 },
  muted: { color: "#555570", fontSize: 13 } as React.CSSProperties,
  btn: { background: "#1e1e2e", border: "1px solid #2a2a3e", borderRadius: 8, padding: "8px 16px", color: "#8888aa", fontSize: 13, cursor: "pointer" } as React.CSSProperties,
  section: { marginBottom: 48 } as React.CSSProperties,
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    published: { bg: "rgba(52,211,153,0.15)", color: "#34d399", label: "✅ Published" },
    ready: { bg: "rgba(124,106,247,0.15)", color: "#a78bfa", label: "📋 Ready to post" },
    pending: { bg: "rgba(251,191,36,0.15)", color: "#fbbf24", label: "⏳ Pending" },
    failed: { bg: "rgba(248,113,113,0.15)", color: "#f87171", label: "❌ Failed" },
  }
  const cfg = map[status] ?? map.pending
  return (
    <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

function PostCard({ post }: { post: SocialPost }) {
  const [copied, setCopied] = useState(false)

  async function copyCaption() {
    await navigator.clipboard.writeText(post.caption)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isLandscape = post.imageFormat === "landscape"

  return (
    <div style={{ ...s.card, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        {statusBadge(post.status)}
        {post.scheduledTime && (
          <span style={{ color: "#7c6af7", fontSize: 13, fontWeight: 600 }}>🕐 {post.scheduledTime}</span>
        )}
        {post.instagramPostId && (
          <span style={{ color: "#555570", fontSize: 11 }}>IG: {post.instagramPostId}</span>
        )}
        {post.twitterPostId && (
          <a
            href={`https://x.com/i/web/status/${post.twitterPostId}`}
            target="_blank" rel="noopener"
            style={{ color: "#60b4f0", fontSize: 11 }}
          >
            X: {post.twitterPostId} ↗
          </a>
        )}
        {post.error && <span style={{ color: "#f87171", fontSize: 11 }}>{post.error}</span>}
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" as const }}>
        {/* Image */}
        <div style={{ flexShrink: 0 }}>
          {post.ogImageUrl ? (
            <img
              src={post.ogImageUrl}
              alt="card"
              style={{
                width: isLandscape ? 320 : 220,
                height: isLandscape ? 180 : 220,
                borderRadius: 8,
                border: "1px solid #1e1e2e",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <div style={{ width: 220, height: 220, borderRadius: 8, border: "1px solid #1e1e2e", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#555570", fontSize: 12 }}>
              No image
            </div>
          )}
          <a
            href={post.ogImageUrl}
            download={`predlab-${post.platform}-${post.scheduledTime?.replace(":", "h") ?? post.date}.png`}
            style={{ display: "block", marginTop: 8, textAlign: "center", background: "#1e1e2e", border: "1px solid #2a2a3e", borderRadius: 6, padding: "6px", color: "#8888aa", fontSize: 12, textDecoration: "none" }}
          >
            ↓ Download
          </a>
        </div>

        {/* Caption */}
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={s.muted}>Caption</span>
            <button
              onClick={copyCaption}
              style={{ ...s.btn, padding: "4px 12px", fontSize: 12, color: copied ? "#34d399" : "#8888aa", background: copied ? "rgba(52,211,153,0.12)" : "#1e1e2e" }}
            >
              {copied ? "✓ Copied!" : "Copy"}
            </button>
          </div>
          <pre style={{ background: "#0a0a0f", border: "1px solid #1e1e2e", borderRadius: 8, padding: "12px", color: "#e8e8f0", fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0, maxHeight: 220, overflowY: "auto" }}>
            {post.caption}
          </pre>
          <div style={{ marginTop: 8, color: "#555570", fontSize: 11 }}>
            {post.marketTitle} · <span style={{ color: "#7c6af7", fontWeight: 700 }}>{post.probability}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminSocialPage() {
  const [password, setPassword] = useState("")
  const [authenticated, setAuthenticated] = useState(false)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_pwd")
    if (saved) { setPassword(saved); fetchData(saved) }
  }, [])

  async function fetchData(pwd: string) {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/social/today?password=${encodeURIComponent(pwd)}`)
      if (res.ok) {
        setData(await res.json())
        setAuthenticated(true)
        sessionStorage.setItem("admin_pwd", pwd)
      } else {
        setError("Wrong password.")
        sessionStorage.removeItem("admin_pwd")
      }
    } catch { setError("Connection error.") }
    setLoading(false)
  }

  if (!authenticated) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <form onSubmit={(e) => { e.preventDefault(); fetchData(password) }} style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 12, padding: 40, display: "flex", flexDirection: "column", gap: 16, minWidth: 300 }}>
          <h1 style={{ color: "#e8e8f0", fontSize: 20, fontWeight: 700, margin: 0 }}>🔐 Admin — Social</h1>
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            style={{ background: "#0a0a0f", border: "1px solid #1e1e2e", borderRadius: 8, padding: "10px 14px", color: "#e8e8f0", fontSize: 14, outline: "none" }} />
          {error && <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ background: "#7c6af7", border: "none", borderRadius: 8, padding: 10, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {loading ? "Loading..." : "Enter"}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <h1 style={s.title}>🔮 PredLab — Social Admin</h1>
          <button onClick={() => fetchData(password)} style={s.btn}>↻ Refresh</button>
        </div>

        {/* Instagram section */}
        <section style={s.section}>
          <p style={s.label}>📸 Instagram — 2 posts/day (12:00 and 19:00 Brasilia)</p>
          {!data?.instagram?.length ? (
            <div style={{ ...s.card, color: "#555570", textAlign: "center" }}>
              <p style={{ margin: 0 }}>No Instagram posts generated today yet.</p>
            </div>
          ) : (
            data.instagram.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </section>

        {/* Twitter section */}
        <section style={s.section}>
          <p style={s.label}>🐦 Twitter/X — 4 posts/day (08:00 · 12:00 · 17:00 · 21:00 Brasilia)</p>
          {!data?.twitter?.length ? (
            <div style={{ ...s.card, color: "#555570", textAlign: "center" }}>
              <p style={{ margin: 0 }}>No Twitter posts generated today yet.</p>
              <p style={{ ...s.muted, marginTop: 8 }}>Published automatically at 08:00, 12:00, 17:00 and 21:00 Brasilia.</p>
            </div>
          ) : (
            data.twitter.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </section>

        {/* History */}
        {!!data?.history?.length && (
          <section style={s.section}>
            <p style={s.label}>History</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {data.history.map((h) => (
                <div key={h.id} style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
                  <span style={{ color: "#555570", fontSize: 11, fontFamily: "monospace", width: 80 }}>{h.date}</span>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: h.platform === "instagram" ? "rgba(124,106,247,0.12)" : "rgba(29,161,242,0.12)", color: h.platform === "instagram" ? "#a78bfa" : "#60b4f0" }}>
                    {h.platform === "instagram" ? "IG" : "X"} {h.scheduledTime ?? ""}
                  </span>
                  {statusBadge(h.status)}
                  <span style={{ color: "#8888aa", fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.marketTitle || "—"}</span>
                  <span style={{ color: "#7c6af7", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{h.probability > 0 ? `${h.probability}%` : "—"}</span>
                  {h.ogImageUrl && <a href={h.ogImageUrl} target="_blank" rel="noopener" style={{ color: "#555570", fontSize: 11 }}>view ↗</a>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
