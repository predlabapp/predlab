"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Info, X, ChevronRight, ChevronLeft } from "lucide-react"
import { useTranslations } from "next-intl"

const ILLUSTRATIONS = [
  <svg key="1" viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="280" height="160" rx="12" fill="#111118"/>
    <circle cx="140" cy="80" r="50" stroke="#7c6af7" strokeWidth="1.5" strokeDasharray="4 3"/>
    <circle cx="140" cy="80" r="50" fill="rgba(124,106,247,0.06)"/>
    <ellipse cx="140" cy="80" rx="30" ry="50" stroke="#7c6af7" strokeWidth="1" strokeOpacity="0.4"/>
    <line x1="90" y1="80" x2="190" y2="80" stroke="#7c6af7" strokeWidth="1" strokeOpacity="0.4"/>
    <circle cx="120" cy="68" r="5" fill="#34d399"/>
    <circle cx="155" cy="85" r="5" fill="#fbbf24"/>
    <circle cx="135" cy="95" r="5" fill="#f87171"/>
    <circle cx="120" cy="68" r="9" stroke="#34d399" strokeWidth="1" strokeOpacity="0.4"/>
  </svg>,
  <svg key="2" viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="280" height="160" rx="12" fill="#111118"/>
    <rect x="50" y="78" width="180" height="4" rx="2" fill="#1e1e2e"/>
    <rect x="50" y="78" width="130" height="4" rx="2" fill="#7c6af7"/>
    <circle cx="180" cy="80" r="10" fill="#7c6af7"/>
    <circle cx="180" cy="80" r="5" fill="white"/>
    <rect x="162" y="50" width="46" height="22" rx="6" fill="#3d3580"/>
    <text x="185" y="65" textAnchor="middle" fill="#e8e8f0" fontSize="11" fontFamily="monospace" fontWeight="bold">72%</text>
    <text x="50" y="105" fill="#555570" fontSize="9" fontFamily="monospace">1%</text>
    <text x="260" y="105" textAnchor="end" fill="#555570" fontSize="9" fontFamily="monospace">99%</text>
    <text x="155" y="105" textAnchor="middle" fill="#555570" fontSize="9" fontFamily="monospace">50%</text>
  </svg>,
  <svg key="3" viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="280" height="160" rx="12" fill="#111118"/>
    <polyline points="50,120 90,95 130,105 160,70 200,55 240,40" stroke="#7c6af7" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <polygon points="50,120 90,95 130,105 160,70 200,55 240,40 240,130 50,130" fill="rgba(124,106,247,0.08)"/>
    <circle cx="90" cy="95" r="3" fill="#7c6af7"/>
    <circle cx="130" cy="105" r="3" fill="#7c6af7"/>
    <circle cx="160" cy="70" r="3" fill="#7c6af7"/>
    <circle cx="200" cy="55" r="3" fill="#7c6af7"/>
    <circle cx="240" cy="40" r="10" fill="#34d399"/>
    <polyline points="235,40 238,44 246,35" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <line x1="50" y1="130" x2="240" y2="130" stroke="#1e1e2e" strokeWidth="1"/>
    <line x1="50" y1="30" x2="50" y2="130" stroke="#1e1e2e" strokeWidth="1"/>
  </svg>,
  <svg key="4" viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="280" height="160" rx="12" fill="#111118"/>
    <path d="M120 40 h40 v45 c0 15-10 25-20 28 c-10-3-20-13-20-28 Z" fill="rgba(124,106,247,0.15)" stroke="#7c6af7" strokeWidth="1.5"/>
    <path d="M100 48 h20 v20 c0 8-4 12-10 12 s-10-4-10-12 Z" fill="rgba(124,106,247,0.08)" stroke="#7c6af7" strokeWidth="1" strokeOpacity="0.5"/>
    <path d="M160 48 h20 v20 c0 8-4 12-10 12 s-10-4-10-12 Z" fill="rgba(124,106,247,0.08)" stroke="#7c6af7" strokeWidth="1" strokeOpacity="0.5"/>
    <rect x="130" y="113" width="20" height="8" rx="2" fill="#7c6af7" fillOpacity="0.6"/>
    <rect x="118" y="121" width="44" height="6" rx="3" fill="#7c6af7" fillOpacity="0.4"/>
    <text x="140" y="72" textAnchor="middle" fontSize="18" fill="#fbbf24">★</text>
    <rect x="50" y="38" width="30" height="6" rx="3" fill="#fbbf24" fillOpacity="0.8"/>
    <text x="55" y="44" fill="#0a0a0f" fontSize="6" fontWeight="bold">#1</text>
    <rect x="50" y="50" width="28" height="6" rx="3" fill="#8888aa" fillOpacity="0.5"/>
    <text x="55" y="56" fill="#e8e8f0" fontSize="6">#2</text>
    <rect x="50" y="62" width="25" height="6" rx="3" fill="#8888aa" fillOpacity="0.3"/>
    <text x="55" y="68" fill="#e8e8f0" fontSize="6">#3</text>
  </svg>,
]

export function MobileHowItWorksBar() {
  const [dismissed, setDismissed] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [mounted, setMounted] = useState(false)
  const tLanding = useTranslations("Landing")
  const tHow = useTranslations("HowItWorks")

  useEffect(() => { setMounted(true) }, [])

  const steps = [
    { number: "①", title: tHow("step1Title"), desc: tHow("step1Desc"), detail: tHow("step1Detail") },
    { number: "②", title: tHow("step2Title"), desc: tHow("step2Desc"), detail: tHow("step2Detail") },
    { number: "③", title: tHow("step3Title"), desc: tHow("step3Desc"), detail: tHow("step3Detail") },
    { number: "④", title: tHow("step4Title"), desc: tHow("step4Desc"), detail: tHow("step4Detail") },
  ]

  const isLast = step === steps.length - 1
  const current = steps[step]

  const openModal = () => {
    setStep(0)
    setModalOpen(true)
  }

  const modal = (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
      }}
      onClick={() => setModalOpen(false)}
    >
      <div
        style={{
          position: "relative", width: "100%", maxWidth: "384px",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "16px", boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setModalOpen(false)}
          style={{ position: "absolute", top: 12, right: 12, zIndex: 10, padding: 6, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
        >
          <X size={15} />
        </button>

        <div style={{ height: 176, background: "var(--bg)", overflow: "hidden" }}>
          {ILLUSTRATIONS[step]}
        </div>

        <div style={{ padding: "20px 24px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--accent)" }}>{current.number}</span>
            <span style={{ fontFamily: "monospace", fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{tHow("label")}</span>
          </div>

          <h2 style={{ fontFamily: "var(--font-syne)", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
            {current.title}
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 4 }}>{current.desc}</p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>{current.detail}</p>

          <div style={{ display: "flex", justifyContent: "center", gap: 6, margin: "20px 0 16px" }}>
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                style={{
                  borderRadius: 99, border: "none", cursor: "pointer",
                  width: i === step ? 20 : 6, height: 6,
                  background: i === step ? "var(--accent)" : "var(--border-bright)",
                  transition: "all 0.2s",
                  padding: 0,
                }}
              />
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "10px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: 14, cursor: "pointer" }}
              >
                <ChevronLeft size={14} />{tHow("back")}
              </button>
            )}
            <button
              onClick={isLast ? () => setModalOpen(false) : () => setStep(step + 1)}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "10px 16px", borderRadius: 10, border: "none", background: "var(--accent)", color: "white", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
            >
              {isLast ? tHow("close") : tHow("next")}
              {!isLast && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  if (dismissed) return null

  return (
    <>
      {/* Floating bar — mobile only */}
      <div
        className="fixed bottom-4 left-4 right-4 z-30 sm:hidden flex items-center gap-3 rounded-xl px-4 py-3 shadow-xl"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-bright)",
        }}
      >
        <Info size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />

        <button
          className="flex-1 text-left text-sm truncate"
          style={{ color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          onClick={openModal}
        >
          {tLanding("howItWorksBar")}
        </button>

        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-md flex-shrink-0"
          style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>

      {/* Modal portal */}
      {mounted && modalOpen && createPortal(modal, document.body)}
    </>
  )
}
