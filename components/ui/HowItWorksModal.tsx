"use client"

import { useState } from "react"
import { X, ChevronRight, ChevronLeft, Info } from "lucide-react"
import { useTranslations } from "next-intl"

const ILLUSTRATIONS = [
  // Step 1 — Choose a market
  (
    <svg viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="280" height="160" rx="12" fill="#111118"/>
      {/* Globe */}
      <circle cx="140" cy="80" r="50" stroke="#7c6af7" strokeWidth="1.5" strokeDasharray="4 3"/>
      <circle cx="140" cy="80" r="50" fill="rgba(124,106,247,0.06)"/>
      {/* Latitude lines */}
      <ellipse cx="140" cy="80" rx="30" ry="50" stroke="#7c6af7" strokeWidth="1" strokeOpacity="0.4"/>
      <line x1="90" y1="80" x2="190" y2="80" stroke="#7c6af7" strokeWidth="1" strokeOpacity="0.4"/>
      <line x1="95" y1="60" x2="185" y2="60" stroke="#7c6af7" strokeWidth="1" strokeOpacity="0.3"/>
      <line x1="95" y1="100" x2="185" y2="100" stroke="#7c6af7" strokeWidth="1" strokeOpacity="0.3"/>
      {/* Market pins */}
      <circle cx="120" cy="68" r="5" fill="#34d399"/>
      <circle cx="155" cy="85" r="5" fill="#fbbf24"/>
      <circle cx="135" cy="95" r="5" fill="#f87171"/>
      {/* Pulse on green pin */}
      <circle cx="120" cy="68" r="9" stroke="#34d399" strokeWidth="1" strokeOpacity="0.4"/>
    </svg>
  ),
  // Step 2 — Set probability
  (
    <svg viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="280" height="160" rx="12" fill="#111118"/>
      {/* Slider track */}
      <rect x="50" y="78" width="180" height="4" rx="2" fill="#1e1e2e"/>
      <rect x="50" y="78" width="130" height="4" rx="2" fill="#7c6af7"/>
      {/* Slider thumb */}
      <circle cx="180" cy="80" r="10" fill="#7c6af7"/>
      <circle cx="180" cy="80" r="5" fill="white"/>
      {/* Percentage label */}
      <rect x="162" y="50" width="46" height="22" rx="6" fill="#3d3580"/>
      <text x="185" y="65" textAnchor="middle" fill="#e8e8f0" fontSize="11" fontFamily="monospace" fontWeight="bold">72%</text>
      {/* Scale labels */}
      <text x="50" y="105" fill="#555570" fontSize="9" fontFamily="monospace">1%</text>
      <text x="260" y="105" textAnchor="end" fill="#555570" fontSize="9" fontFamily="monospace">99%</text>
      <text x="155" y="105" textAnchor="middle" fill="#555570" fontSize="9" fontFamily="monospace">50%</text>
    </svg>
  ),
  // Step 3 — Track & resolve
  (
    <svg viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="280" height="160" rx="12" fill="#111118"/>
      {/* Chart line */}
      <polyline points="50,120 90,95 130,105 160,70 200,55 240,40" stroke="#7c6af7" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Area fill */}
      <polygon points="50,120 90,95 130,105 160,70 200,55 240,40 240,130 50,130" fill="rgba(124,106,247,0.08)"/>
      {/* Data points */}
      <circle cx="90" cy="95" r="3" fill="#7c6af7"/>
      <circle cx="130" cy="105" r="3" fill="#7c6af7"/>
      <circle cx="160" cy="70" r="3" fill="#7c6af7"/>
      <circle cx="200" cy="55" r="3" fill="#7c6af7"/>
      {/* Checkmark at end */}
      <circle cx="240" cy="40" r="10" fill="#34d399"/>
      <polyline points="235,40 238,44 246,35" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Axes */}
      <line x1="50" y1="130" x2="240" y2="130" stroke="#1e1e2e" strokeWidth="1"/>
      <line x1="50" y1="30" x2="50" y2="130" stroke="#1e1e2e" strokeWidth="1"/>
    </svg>
  ),
  // Step 4 — Build reputation
  (
    <svg viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="280" height="160" rx="12" fill="#111118"/>
      {/* Trophy */}
      <path d="M120 40 h40 v45 c0 15-10 25-20 28 c-10-3-20-13-20-28 Z" fill="rgba(124,106,247,0.15)" stroke="#7c6af7" strokeWidth="1.5"/>
      <path d="M100 48 h20 v20 c0 8-4 12-10 12 s-10-4-10-12 Z" fill="rgba(124,106,247,0.08)" stroke="#7c6af7" strokeWidth="1" strokeOpacity="0.5"/>
      <path d="M160 48 h20 v20 c0 8-4 12-10 12 s-10-4-10-12 Z" fill="rgba(124,106,247,0.08)" stroke="#7c6af7" strokeWidth="1" strokeOpacity="0.5"/>
      <rect x="130" y="113" width="20" height="8" rx="2" fill="#7c6af7" fillOpacity="0.6"/>
      <rect x="118" y="121" width="44" height="6" rx="3" fill="#7c6af7" fillOpacity="0.4"/>
      {/* Stars */}
      <text x="140" y="72" textAnchor="middle" fontSize="18" fill="#fbbf24">★</text>
      {/* Ranking rows */}
      <rect x="50" y="38" width="30" height="6" rx="3" fill="#fbbf24" fillOpacity="0.8"/>
      <text x="55" y="44" fill="#0a0a0f" fontSize="6" fontWeight="bold">#1</text>
      <rect x="50" y="50" width="28" height="6" rx="3" fill="#8888aa" fillOpacity="0.5"/>
      <text x="55" y="56" fill="#e8e8f0" fontSize="6">#2</text>
      <rect x="50" y="62" width="25" height="6" rx="3" fill="#8888aa" fillOpacity="0.3"/>
      <text x="55" y="68" fill="#e8e8f0" fontSize="6">#3</text>
    </svg>
  ),
]

export function HowItWorksModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const t = useTranslations("HowItWorks")

  const steps = [
    { emoji: "🌍", number: "①", title: t("step1Title"), desc: t("step1Desc"), detail: t("step1Detail") },
    { emoji: "📊", number: "②", title: t("step2Title"), desc: t("step2Desc"), detail: t("step2Detail") },
    { emoji: "🔥", number: "③", title: t("step3Title"), desc: t("step3Desc"), detail: t("step3Detail") },
    { emoji: "🏆", number: "④", title: t("step4Title"), desc: t("step4Desc"), detail: t("step4Detail") },
  ]

  function open_modal() {
    setStep(0)
    setOpen(true)
  }

  const isLast = step === steps.length - 1
  const current = steps[step]

  return (
    <>
      <button
        onClick={open_modal}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-md hover:bg-[var(--bg-card)] border border-[var(--border)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
      >
        <Info size={13} />
        <span className="text-xs font-mono">{t("buttonTitle")}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >

            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors z-10"
            >
              <X size={15} />
            </button>

            {/* Illustration */}
            <div className="h-44 rounded-t-2xl overflow-hidden bg-[var(--bg)]">
              {ILLUSTRATIONS[step]}
            </div>

            {/* Content */}
            <div className="px-6 pt-5 pb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-xs text-[var(--accent)]">{current.number}</span>
                <span className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-widest">
                  {t("label")}
                </span>
              </div>

              <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mb-2">
                {current.title}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-1">{current.desc}</p>
              <p className="text-xs text-[var(--text-muted)] italic">{current.detail}</p>

              {/* Dots */}
              <div className="flex justify-center gap-1.5 mt-6 mb-5">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={`rounded-full transition-all ${
                      i === step
                        ? "w-5 h-1.5 bg-[var(--accent)]"
                        : "w-1.5 h-1.5 bg-[var(--border-bright)] hover:bg-[var(--text-muted)]"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="flex items-center gap-1 px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg)] transition-colors"
                  >
                    <ChevronLeft size={14} />
                    {t("back")}
                  </button>
                )}
                <button
                  onClick={isLast ? () => setOpen(false) : () => setStep(step + 1)}
                  className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-dim)] text-white text-sm font-medium transition-colors"
                >
                  {isLast ? t("close") : t("next")}
                  {!isLast && <ChevronRight size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
