"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react"
import { CheckCircle, XCircle, Info, X } from "lucide-react"

type ToastType = "success" | "error" | "info"
type Toast = { id: string; message: string; type: ToastType }

const ToastContext = createContext<{
  toast: (message: string, type?: ToastType) => void
}>({ toast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3500
    )
  }, [])

  function remove(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast
  onRemove: () => void
}) {
  useEffect(() => {
    const el = document.getElementById(`toast-${toast.id}`)
    if (el) el.style.opacity = "1"
  }, [toast.id])

  const icons = {
    success: <CheckCircle size={15} style={{ color: "var(--green)" }} />,
    error: <XCircle size={15} style={{ color: "var(--red)" }} />,
    info: <Info size={15} style={{ color: "var(--accent)" }} />,
  }

  const borders = {
    success: "var(--green)",
    error: "var(--red)",
    info: "var(--accent)",
  }

  return (
    <div
      id={`toast-${toast.id}`}
      className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border bg-[var(--bg-card)] shadow-xl text-sm animate-fade-in min-w-[240px] max-w-[320px]"
      style={{ borderColor: borders[toast.type] }}
    >
      {icons[toast.type]}
      <span className="flex-1 text-[var(--text-primary)]">{toast.message}</span>
      <button
        onClick={onRemove}
        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <X size={13} />
      </button>
    </div>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
