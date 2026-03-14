"use client"

import { useState } from "react"
import { Globe } from "lucide-react"
import { useLocale } from "next-intl"
import { useRouter, usePathname } from "@/navigation"
import { locales, type Locale } from "@/i18n"

const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  pt: "PT",
  es: "ES",
  fr: "FR",
}

export function LocaleSwitcher() {
  const [open, setOpen] = useState(false)
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale(next: Locale) {
    setOpen(false)
    router.replace(pathname, { locale: next })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-md hover:bg-[var(--bg-card)] border border-[var(--border)] transition-colors text-xs text-[var(--text-secondary)]"
      >
        <Globe size={13} />
        <span className="font-mono">{LOCALE_LABELS[locale]}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-24 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-xl z-20 overflow-hidden">
            {locales.map((l) => (
              <button
                key={l}
                onClick={() => switchLocale(l)}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                  l === locale
                    ? "text-[var(--accent)] bg-[var(--accent-glow)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)]"
                }`}
              >
                <span className="font-mono text-xs">{LOCALE_LABELS[l]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
