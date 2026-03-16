"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, Check, AlertCircle } from "lucide-react"

interface Profile {
  id: string
  name: string
  email: string
  username: string | null
  bio: string | null
  image: string | null
  city: string | null
  state: string | null
  country: string | null
  emailVerified: string | null
  notifEmailDigest: boolean
  notifExpiringPredictions: boolean
  isGoogleUser: boolean
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card mb-4">
      <h2 className="font-display font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [country, setCountry] = useState("")
  const [notifDigest, setNotifDigest] = useState(true)
  const [notifExpiring, setNotifExpiring] = useState(true)

  const [currentPwd, setCurrentPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [pwdLoading, setPwdLoading] = useState(false)

  const [resendLoading, setResendLoading] = useState(false)
  const [resendMsg, setResendMsg] = useState("")

  useEffect(() => {
    fetch("/api/user/profile").then(r => r.json()).then((p: Profile) => {
      setProfile(p)
      setUsername(p.username ?? "")
      setBio(p.bio ?? "")
      setCity(p.city ?? "")
      setState(p.state ?? "")
      setCountry(p.country ?? "")
      setNotifDigest(p.notifEmailDigest)
      setNotifExpiring(p.notifExpiringPredictions)
      setLoading(false)
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg(null)
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username || undefined, bio: bio || null, city: city || null, state: state || null, country: country || null, notifEmailDigest: notifDigest, notifExpiringPredictions: notifExpiring }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      setSaveMsg({ type: "ok", text: "Perfil guardado." })
      router.refresh()
    } else {
      setSaveMsg({ type: "err", text: data.error ?? "Erro ao guardar." })
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwdLoading(true)
    setPwdMsg(null)
    const res = await fetch("/api/user/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
    })
    const data = await res.json()
    setPwdLoading(false)
    if (res.ok) { setPwdMsg({ type: "ok", text: "Senha alterada com sucesso." }); setCurrentPwd(""); setNewPwd("") }
    else setPwdMsg({ type: "err", text: data.error ?? "Erro ao alterar senha." })
  }

  async function handleResend() {
    setResendLoading(true)
    await fetch("/api/user/resend-verification", { method: "POST" })
    setResendMsg("Email enviado! Verifique a sua caixa de entrada.")
    setResendLoading(false)
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <Loader2 size={28} className="animate-spin" style={{ color: "var(--text-muted)" }} />
    </div>
  )

  if (!profile) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="font-display text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
        Perfil
      </h1>

      {/* Email verification banner — not shown for Google users */}
      {!profile.emailVerified && !profile.isGoogleUser && (
        <div className="mb-4 p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)" }}>
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--yellow)" }} />
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: "var(--yellow)" }}>Email não confirmado</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Confirme o seu email para aceder a todas as funcionalidades.
            </p>
          </div>
          <button onClick={handleResend} disabled={resendLoading} className="text-xs btn-ghost py-1">
            {resendLoading ? <Loader2 size={12} className="animate-spin" /> : "Reenviar"}
          </button>
        </div>
      )}
      {resendMsg && <p className="text-xs text-green-400 mb-4">{resendMsg}</p>}

      {/* Profile info */}
      <form onSubmit={handleSave}>
        <Section title="Informações do Perfil">
          {/* Name (read-only) */}
          <div className="mb-3">
            <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Nome</label>
            <input value={profile.name} disabled className="input-base opacity-50 cursor-not-allowed" />
          </div>

          <div className="mb-3">
            <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Username <span style={{ color: "var(--text-muted)" }}>(público)</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>@</span>
              <input
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                className="input-base pl-7"
                placeholder="o_teu_username"
                maxLength={30}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Bio <span style={{ color: "var(--text-muted)" }}>(opcional)</span></label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="input-base resize-none"
              rows={2}
              maxLength={200}
              placeholder="Apresenta-te em poucas palavras..."
            />
          </div>
        </Section>

        <Section title="Localização">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Cidade</label>
              <input value={city} onChange={e => setCity(e.target.value)} className="input-base" placeholder="São Paulo" maxLength={100} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Estado</label>
              <input value={state} onChange={e => setState(e.target.value)} className="input-base" placeholder="SP" maxLength={100} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>País</label>
              <input value={country} onChange={e => setCountry(e.target.value)} className="input-base" placeholder="Brasil" maxLength={100} />
            </div>
          </div>
        </Section>

        <Section title="Notificações por Email">
          <div className="flex flex-col gap-3">
            {[
              { label: "Resumo semanal de previsões", desc: "Receba um email com o seu desempenho da semana", value: notifDigest, set: setNotifDigest },
              { label: "Previsões a expirar", desc: "Alerta quando tiver previsões a expirar em breve", value: notifExpiring, set: setNotifExpiring },
            ].map(({ label, desc, value, set }) => (
              <label key={label} className="flex items-start gap-3 cursor-pointer">
                <div className="relative mt-0.5">
                  <input type="checkbox" className="sr-only" checked={value} onChange={e => set(e.target.checked)} />
                  <div
                    onClick={() => set(!value)}
                    className="w-9 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0"
                    style={{ background: value ? "var(--accent)" : "var(--border)" }}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow transition-transform mt-0.5"
                      style={{ marginLeft: value ? "18px" : "2px" }} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </Section>

        {saveMsg && (
          <div className="flex items-center gap-2 text-sm mb-3 p-3 rounded-lg"
            style={{ background: saveMsg.type === "ok" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: saveMsg.type === "ok" ? "var(--green)" : "var(--red)" }}>
            <Check size={14} />
            {saveMsg.text}
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? <Loader2 size={16} className="animate-spin inline mr-2" /> : null}
          Guardar Perfil
        </button>
      </form>

      {/* Change password — only for email/password accounts (not Google) */}
      {!profile.isGoogleUser && (
        <div className="mt-4 card">
          <h2 className="font-display font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>
            Alterar Senha
          </h2>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Senha atual</label>
              <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} className="input-base" required />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Nova senha</label>
              <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} className="input-base" minLength={8} required />
            </div>
            {pwdMsg && (
              <p className="text-xs p-2 rounded" style={{ background: pwdMsg.type === "ok" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: pwdMsg.type === "ok" ? "var(--green)" : "var(--red)" }}>
                {pwdMsg.text}
              </p>
            )}
            <button type="submit" disabled={pwdLoading} className="btn-ghost w-full">
              {pwdLoading ? "A alterar..." : "Alterar Senha"}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
