"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Bell, X, Check } from "lucide-react"
import { useRouter } from "@/navigation"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  isRead: boolean
  createdAt: string
}

const TYPE_ICONS: Record<string, string> = {
  bolao_join: "🎉",
  mercado_created: "📊",
  mercado_resolved: "🎯",
  payment_status: "💰",
  promoted_admin: "⭐",
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "agora"
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications")
    if (!res.ok) return
    const data = await res.json()
    setNotifications(data.notifications ?? [])
    setUnread(data.unreadCount ?? 0)
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 30000) // poll every 30s
    return () => clearInterval(id)
  }, [load])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  async function handleMarkAllRead() {
    await fetch("/api/notifications", { method: "PATCH" })
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnread(0)
  }

  async function handleClick(n: Notification) {
    if (!n.isRead) {
      await fetch(`/api/notifications/${n.id}`, { method: "PATCH" })
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, isRead: true } : x))
      setUnread((prev) => Math.max(0, prev - 1))
    }
    if (n.link) {
      setOpen(false)
      router.push(n.link as any)
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    await fetch(`/api/notifications/${id}`, { method: "DELETE" })
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setUnread((prev) => {
      const wasUnread = notifications.find((n) => n.id === id)?.isRead === false
      return wasUnread ? Math.max(0, prev - 1) : prev
    })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((o) => !o); if (!open) load() }}
        className="relative p-2.5 rounded-md transition-colors"
        style={{ color: "var(--text-muted)" }}
        onMouseOver={(e) => { e.currentTarget.style.color = "var(--text-primary)" }}
        onMouseOut={(e) => { e.currentTarget.style.color = "var(--text-muted)" }}
      >
        <Bell size={17} />
        {unread > 0 && (
          <span
            className="absolute top-1 right-1 flex items-center justify-center rounded-full font-mono font-bold"
            style={{
              background: "var(--accent)",
              color: "white",
              fontSize: 9,
              minWidth: 14,
              height: 14,
              padding: "0 3px",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-80 rounded-xl shadow-2xl z-50 overflow-hidden"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              Notificações
            </span>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs transition-colors"
                style={{ color: "var(--accent)" }}
              >
                <Check size={12} />
                Marcar todas lidas
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                Sem notificações
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors group"
                  style={{
                    background: n.isRead ? "transparent" : "var(--accent-glow)",
                    borderBottom: "1px solid var(--border)",
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "var(--bg)" }}
                  onMouseOut={(e) => { e.currentTarget.style.background = n.isRead ? "transparent" : "var(--accent-glow)" }}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {TYPE_ICONS[n.type] ?? "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                      {n.title}
                    </p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {n.message}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                      style={{ background: "var(--accent)" }}
                    />
                  )}
                  <button
                    onClick={(e) => handleDelete(e, n.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity flex-shrink-0"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
