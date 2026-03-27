"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Solo Gmail, Hotmail, Outlook, Yahoo, iCloud y dominios comunes
const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@(gmail|hotmail|outlook|yahoo|icloud|live|msn|protonmail|me)\.(com|mx|es|co|net|org)$/i

type Step = "email" | "codigo" | "datos"

export default function RegisterPage() {
  const router = useRouter()

  // ── Step actual ──────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("email")

  // ── Datos del formulario ─────────────────────────────────────────────
  const [email,          setEmail]          = useState("")
  const [codigo,         setCodigo]         = useState("")
  const [form, setForm] = useState({
    username: "", password: "", passwordConfirm: "", phone: "", activationCode: "",
  })

  // ── Estado UI ─────────────────────────────────────────────────────────
  const [error,   setError]   = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailOk, setEmailOk] = useState(false)   // email validado en cliente

  function update(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }))
  }

  // ── Validar email en tiempo real ────────────────────────────────────
  function handleEmailChange(val: string) {
    setEmail(val)
    setEmailOk(EMAIL_RE.test(val.trim()))
    setError("")
  }

  // ── STEP 1: Enviar código al correo ─────────────────────────────────
  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    if (!emailOk) { setError("Ingresa un correo válido (ej: ejemplo@gmail.com)"); return }
    setError(""); setLoading(true)
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Error al enviar código"); return }
      setSuccess(`Código enviado a ${email}. Revisa tu bandeja (y spam).`)
      setStep("codigo")
    } catch { setError("Error de conexión") } finally { setLoading(false) }
  }

  // ── STEP 2: Verificar código ─────────────────────────────────────────
  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    if (codigo.length !== 6) { setError("El código tiene 6 dígitos"); return }
    setError(""); setLoading(true)
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: codigo.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Código incorrecto"); return }
      setSuccess("¡Correo verificado! Completa tu registro.")
      setStep("datos")
    } catch { setError("Error de conexión") } finally { setLoading(false) }
  }

  // ── STEP 3: Registrar cuenta ─────────────────────────────────────────
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(""); setSuccess(""); setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, email: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Error al registrar"); return }
      setSuccess("¡Registro exitoso! Revisa tu correo. Redirigiendo...")
      setTimeout(() => router.push("/"), 2500)
    } catch { setError("Error de conexión") } finally { setLoading(false) }
  }

  // ─── INDICADOR DE PASOS ─────────────────────────────────────────────
  const steps = [
    { id: "email",  label: "Correo",       num: 1 },
    { id: "codigo", label: "Verificación", num: 2 },
    { id: "datos",  label: "Tu cuenta",    num: 3 },
  ]

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#E9D173] p-4">
      <Card className="w-full max-w-lg border-[#D4A017] shadow-xl bg-[#FCF3CF]">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#B8860B]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" x2="19" y1="8" y2="14" />
              <line x1="22" x2="16" y1="11" y2="11" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#2C3E50]">ShellDB — Registro</h1>
          <p className="text-sm text-[#6B7280]">Crea tu cuenta con código de activación</p>

          {/* Progress steps */}
          <div className="flex items-center justify-center gap-0 mt-4">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all ${
                    step === s.id ? "bg-[#B8860B] text-white shadow-md scale-110" :
                    steps.findIndex(x => x.id === step) > i ? "bg-[#27AE60] text-white" :
                    "bg-[#D4A01740] text-[#B8860B]"
                  }`}>
                    {steps.findIndex(x => x.id === step) > i ? "✓" : s.num}
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: step === s.id ? "#B8860B" : "#9B7D3A" }}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="w-12 h-0.5 mx-1 mb-4" style={{ background: steps.findIndex(x => x.id === step) > i ? "#27AE60" : "#D4A01740" }} />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="rounded-md bg-[#E74C3C]/10 border border-[#E74C3C]/30 px-4 py-3 text-sm text-[#E74C3C] mb-3">{error}</div>
          )}
          {success && (
            <div className="rounded-md bg-[#27AE60]/10 border border-[#27AE60]/30 px-4 py-3 text-sm text-[#27AE60] mb-3">{success}</div>
          )}

          {/* ── STEP 1: EMAIL ── */}
          {step === "email" && (
            <form onSubmit={handleSendCode} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-[#2C3E50] font-semibold text-sm">
                  Correo Electrónico
                </Label>
                <p className="text-xs text-[#6B7280]">Usaremos este correo para verificar tu cuenta y enviarte alertas importantes.</p>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    placeholder="ejemplo@gmail.com"
                    value={email}
                    onChange={e => handleEmailChange(e.target.value)}
                    required
                    className={`border-[#D4A017] bg-white text-[#2C3E50] focus-visible:ring-[#B8860B] pr-10 ${
                      email && !emailOk ? "border-[#E74C3C]" : email && emailOk ? "border-[#27AE60]" : ""
                    }`}
                  />
                  {email && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base">
                      {emailOk ? "✅" : "❌"}
                    </span>
                  )}
                </div>
                {email && !emailOk && (
                  <p className="text-xs text-[#E74C3C]">
                    Usa un correo válido: @gmail.com, @hotmail.com, @outlook.com, @yahoo.com, etc.
                  </p>
                )}
              </div>
              <Button type="submit" disabled={loading || !emailOk}
                className="w-full bg-[#B8860B] text-white hover:bg-[#DAA520] font-bold py-5 cursor-pointer disabled:opacity-50">
                {loading ? "Enviando código..." : "Enviar código de verificación →"}
              </Button>
              <div className="text-center text-sm text-[#6B7280]">
                ¿Ya tienes cuenta?{" "}
                <Link href="/" className="text-[#B8860B] font-semibold hover:underline">Inicia sesión</Link>
              </div>
            </form>
          )}

          {/* ── STEP 2: CÓDIGO ── */}
          {step === "codigo" && (
            <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
              <div className="rounded-xl p-4 text-center" style={{ background: "#FFF8DC", border: "1px solid #D4A01740" }}>
                <p className="text-sm font-semibold text-[#2C3E50]">Código enviado a:</p>
                <p className="text-base font-black text-[#B8860B] mt-1">{email}</p>
                <p className="text-xs text-[#6B7280] mt-1">Revisa tu bandeja de entrada y carpeta de spam</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="codigo" className="text-[#2C3E50] font-semibold text-sm">
                  Código de 6 dígitos
                </Label>
                <Input
                  id="codigo"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={codigo}
                  onChange={e => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  required
                  className="border-[#D4A017] bg-white text-[#2C3E50] focus-visible:ring-[#B8860B] text-center text-2xl tracking-[0.5em] font-black"
                />
              </div>
              <Button type="submit" disabled={loading || codigo.length !== 6}
                className="w-full bg-[#B8860B] text-white hover:bg-[#DAA520] font-bold py-5 cursor-pointer disabled:opacity-50">
                {loading ? "Verificando..." : "Verificar código →"}
              </Button>
              <button type="button" onClick={() => { setStep("email"); setError(""); setSuccess(""); setCodigo("") }}
                className="text-center text-sm text-[#B8860B] font-semibold hover:underline cursor-pointer">
                ← Cambiar correo
              </button>
              <button type="button" onClick={handleSendCode} disabled={loading}
                className="text-center text-xs text-[#6B7280] hover:text-[#B8860B] cursor-pointer">
                ¿No llegó? Reenviar código
              </button>
            </form>
          )}

          {/* ── STEP 3: DATOS ── */}
          {step === "datos" && (
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              {/* Email verificado (readonly) */}
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "#27AE6015", border: "1px solid #27AE6040" }}>
                <span className="text-base">✅</span>
                <div>
                  <p className="text-xs font-bold text-[#27AE60]">Correo verificado</p>
                  <p className="text-xs text-[#2C3E50] font-mono">{email}</p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username" className="text-[#2C3E50] font-semibold text-sm">Usuario</Label>
                <Input id="username" value={form.username} onChange={e => update("username", e.target.value)} required
                  className="border-[#D4A017] bg-white text-[#2C3E50] focus-visible:ring-[#B8860B]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password" className="text-[#2C3E50] font-semibold text-sm">Contraseña</Label>
                  <Input id="password" type="password" value={form.password} onChange={e => update("password", e.target.value)} required
                    className="border-[#D4A017] bg-white text-[#2C3E50] focus-visible:ring-[#B8860B]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="passwordConfirm" className="text-[#2C3E50] font-semibold text-sm">Confirmar</Label>
                  <Input id="passwordConfirm" type="password" value={form.passwordConfirm} onChange={e => update("passwordConfirm", e.target.value)} required
                    className="border-[#D4A017] bg-white text-[#2C3E50] focus-visible:ring-[#B8860B]" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone" className="text-[#2C3E50] font-semibold text-sm">Teléfono (opcional)</Label>
                <Input id="phone" type="tel" value={form.phone} onChange={e => update("phone", e.target.value)}
                  className="border-[#D4A017] bg-white text-[#2C3E50] focus-visible:ring-[#B8860B]" />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="activationCode" className="text-[#2C3E50] font-semibold text-sm">Código de Activación</Label>
                <Input id="activationCode" value={form.activationCode} onChange={e => update("activationCode", e.target.value)} required
                  placeholder="" className="border-[#D4A017] bg-white text-[#2C3E50] focus-visible:ring-[#B8860B] uppercase" />
              </div>

              <Button type="submit" disabled={loading}
                className="w-full bg-[#B8860B] text-white hover:bg-[#DAA520] font-bold text-base py-5 mt-1 cursor-pointer">
                {loading ? "Registrando..." : "Crear mi cuenta ✓"}
              </Button>

              <div className="text-center text-sm text-[#6B7280]">
                ¿Ya tienes cuenta?{" "}
                <Link href="/" className="text-[#B8860B] font-semibold hover:underline">Inicia sesión</Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
