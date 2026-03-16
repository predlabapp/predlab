"use client"

import { useState, useEffect, useRef, useCallback } from "react"

type SocialPost = {
  id: string
  date: string
  marketTitle: string
  probability: number
  platform: string
  scheduledTime: string | null
  imageFormat: string
  ogImageUrl: string
  caption: string
  instagramPostId: string | null
  twitterPostId: string | null
  status: string
  error: string | null
}

type ApiData = {
  instagram: SocialPost[]
  twitter: SocialPost[]
  history: SocialPost[]
}

function Badge({ status }: { status: string }) {
  const map: Record<string, [string, string, string]> = {
    published: ["✅ Published", "rgba(52,211,153,0.15)", "#34d399"],
    ready:     ["📋 Ready",     "rgba(124,106,247,0.15)", "#a78bfa"],
    pending:   ["⏳ Pending",   "rgba(251,191,36,0.15)",  "#fbbf24"],
    failed:    ["❌ Failed",    "rgba(248,113,113,0.15)", "#f87171"],
  }
  const [label, bg, color] = map[status] ?? map.pending
  return (
    <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: bg, color }}>
      {label}
    </span>
  )
}

function PostCard({ post }: { post: SocialPost }) {
  const [copied, setCopied] = useState(false)
  const isLandscape = post.imageFormat === "landscape"
  const imgW = isLandscape ? 320 : 220
  const imgH = isLandscape ? 180 : 220

  async function copy() {
    await navigator.clipboard.writeText(post.caption)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 12, padding: 20, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" as const }}>
        <Badge status={post.status} />
        {post.scheduledTime && (
          <span style={{ color: "#7c6af7", fontSize: 13, fontWeight: 600 }}>🕐 {post.scheduledTime}</span>
        )}
        {post.instagramPostId && (
          <span style={{ color: "#555570", fontSize: 11 }}>IG: {post.instagramPostId}</span>
        )}
        {post.twitterPostId && (
          <a href={`https://x.com/i/web/status/${post.twitterPostId}`} target="_blank" rel="noopener"
            style={{ color: "#60b4f0", fontSize: 11, textDecoration: "none" }}>
            X: {post.twitterPostId} ↗
          </a>
        )}
        {post.error && (
          <span style={{ color: "#f87171", fontSize: 11, fontFamily: "monospace" }}>
            {post.error.slice(0, 120)}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
        <div style={{ flexShrink: 0 }}>
          {post.ogImageUrl ? (
            <img src={post.ogImageUrl} alt="card"
              style={{ width: imgW, height: imgH, borderRadius: 8, border: "1px solid #1e1e2e", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ width: imgW, height: imgH, borderRadius: 8, border: "1px solid #1e1e2e", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#555570", fontSize: 12 }}>
              no image
            </div>
          )}
          {post.ogImageUrl && (
            <a href={post.ogImageUrl}
              download={`predlab-${post.platform}-${(post.scheduledTime ?? post.date).replace(":", "h")}.png`}
              style={{ display: "block", marginTop: 8, textAlign: "center", background: "#1e1e2e", border: "1px solid #2a2a3e", borderRadius: 6, padding: "6px 0", color: "#8888aa", fontSize: 12, textDecoration: "none" }}>
              ↓ Download
            </a>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ color: "#8888aa", fontSize: 12 }}>Caption</span>
            <button onClick={copy}
              style={{ background: copied ? "rgba(52,211,153,0.12)" : "#1e1e2e", border: "1px solid #2a2a3e", borderRadius: 6, padding: "3px 12px", color: copied ? "#34d399" : "#8888aa", fontSize: 11, cursor: "pointer" }}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <pre style={{ background: "#0a0a0f", border: "1px solid #1e1e2e", borderRadius: 8, padding: "10px 12px", color: "#e8e8f0", fontSize: 11, lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0, maxHeight: 200, overflowY: "auto" }}>
            {post.caption || "—"}
          </pre>
          <div style={{ marginTop: 6, color: "#555570", fontSize: 11 }}>
            {post.marketTitle || "—"} · <span style={{ color: "#7c6af7" }}>{post.probability}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, posts, emptyMsg }: { title: string; posts: SocialPost[]; emptyMsg: string }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <p style={{ color: "#8888aa", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 12px 0" }}>
        {title}
      </p>
      {posts.length === 0 ? (
        <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 10, padding: "28px 24px", color: "#555570", fontSize: 13, textAlign: "center" }}>
          {emptyMsg}
        </div>
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} />)
      )}
    </section>
  )
}

export default function AdminSocialPage() {
  const [pwd, setPwd] = useState("")
  const pwdRef = useRef("")
  const [authed, setAuthed] = useState(false)
  const [data, setData] = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const fetchData = useCallback(async (password: string) => {
    if (!password) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/social/today?password=${encodeURIComponent(password)}`)
      if (res.ok) {
        setData(await res.json())
        setAuthed(true)
        sessionStorage.setItem("admin_pwd", password)
      } else {
        setError("Wrong password.")
        sessionStorage.removeItem("admin_pwd")
        setAuthed(false)
      }
    } catch {
      setError("Connection error.")
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_pwd")
    if (saved) {
      setPwd(saved)
      pwdRef.current = saved
      fetchData(saved)
    }
  }, [fetchData])

  function handlePwdChange(v: string) {
    setPwd(v)
    pwdRef.current = v
  }

  function logout() {
    sessionStorage.removeItem("admin_pwd")
    setPwd("")
    pwdRef.current = ""
    setAuthed(false)
    setData(null)
  }

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <form onSubmit={(e) => { e.preventDefault(); fetchData(pwdRef.current) }}
          style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 14, padding: "40px 36px", display: "flex", flexDirection: "column", gap: 14, minWidth: 300 }}>
          <h1 style={{ color: "#e8e8f0", fontSize: 20, fontWeight: 700, margin: 0 }}>🔮 PredLab Admin</h1>
          <p style={{ color: "#555570", fontSize: 13, margin: 0 }}>Social automation dashboard</p>
          <input type="password" placeholder="Password" value={pwd} onChange={(e) => handlePwdChange(e.target.value)} autoFocus
            style={{ background: "#0a0a0f", border: "1px solid #2a2a3e", borderRadius: 8, padding: "10px 14px", color: "#e8e8f0", fontSize: 14, outline: "none" }} />
          {error && <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ background: "#7c6af7", border: "none", borderRadius: 8, padding: "10px", color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Loading…" : "Enter"}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "system-ui, sans-serif", padding: "36px 20px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
          <div>
            <h1 style={{ color: "#e8e8f0", fontSize: 22, fontWeight: 700, margin: 0 }}>🔮 PredLab — Social</h1>
            <p style={{ color: "#555570", fontSize: 12, margin: "4px 0 0 0" }}>
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => fetchData(pwdRef.current)} disabled={loading}
              style={{ background: "#1e1e2e", border: "1px solid #2a2a3e", borderRadius: 8, padding: "8px 16px", color: "#8888aa", fontSize: 13, cursor: "pointer" }}>
              {loading ? "…" : "↻ Refresh"}
            </button>
            <button onClick={logout}
              style={{ background: "transparent", border: "1px solid #2a2a3e", borderRadius: 8, padding: "8px 16px", color: "#555570", fontSize: 13, cursor: "pointer" }}>
              Logout
            </button>
          </div>
        </div>

        <Section
          title="📸 Instagram — 12:00 and 19:00 Brasilia"
          posts={data?.instagram ?? []}
          emptyMsg="No Instagram posts today. Runs at 12:00 and 19:00 Brasilia (15:00 and 22:00 UTC)."
        />

        <Section
          title="🐦 Twitter / X — 08:00 · 12:00 · 17:00 · 21:00 Brasilia"
          posts={data?.twitter ?? []}
          emptyMsg="No Twitter posts today. Runs at 08:00, 12:00, 17:00 and 21:00 Brasilia."
        />

        {(data?.history ?? []).length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <p style={{ color: "#8888aa", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 12px 0" }}>
              History
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(data?.history ?? []).map((h) => (
                <div key={h.id} style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
                  <span style={{ color: "#555570", fontSize: 11, fontFamily: "monospace" }}>{h.date}</span>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: h.platform === "instagram" ? "rgba(124,106,247,0.12)" : "rgba(29,161,242,0.12)", color: h.platform === "instagram" ? "#a78bfa" : "#60b4f0" }}>
                    {h.platform === "instagram" ? "IG" : "X"} {h.scheduledTime ?? ""}
                  </span>
                  <Badge status={h.status} />
                  <span style={{ color: "#8888aa", fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {h.marketTitle || "—"}
                  </span>
                  <span style={{ color: "#7c6af7", fontSize: 12, fontWeight: 700 }}>
                    {h.probability > 0 ? `${h.probability}%` : "—"}
                  </span>
                  {h.ogImageUrl && (
                    <a href={h.ogImageUrl} target="_blank" rel="noopener" style={{ color: "#555570", fontSize: 11, textDecoration: "none" }}>view ↗</a>
                  )}
                  {h.error && (
                    <span style={{ color: "#f87171", fontSize: 11, fontFamily: "monospace", width: "100%", marginTop: 4 }}>
                      ⚠ {h.error.slice(0, 200)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
