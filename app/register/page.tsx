"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    username: "",
    password: "",
    passwordConfirm: "",
    email: "",
    phone: "",
    activationCode: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error al registrar")
        return
      }
      setSuccess("Registro exitoso. Redirigiendo al login...")
      setTimeout(() => router.push("/"), 2000)
    } catch {
      setError("Error de conexion al servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#E9D173] p-4">
      <Card className="w-full max-w-lg border-[#D4A017] shadow-xl bg-[#FCF3CF]">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#B8860B]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" x2="19" y1="8" y2="14" />
              <line x1="22" x2="16" y1="11" y2="11" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#2C3E50]">ShellDB - Registro</h1>
          <p className="text-sm text-[#6B7280]">Crea tu cuenta con codigo de activacion</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            {error && (
              <div className="rounded-md bg-[#E74C3C]/10 border border-[#E74C3C]/30 px-4 py-3 text-sm text-[#E74C3C]">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md bg-[#27AE60]/10 border border-[#27AE60]/30 px-4 py-3 text-sm text-[#27AE60]">
                {success}
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username" className="text-[#2C3E50] font-semibold text-sm">
                Usuario
              </Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                required
                className="border-[#D4A017] bg-white text-[#2C3E50] focus-visible:ring-[#B8860B]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-[#2C3E50] font-semibold text-sm">
                  Contrasena
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  required
                  className="border-[#D4A017] bg-white text-[#2C3E50] focus-visible:ring-[#B8860B]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="passwordConfirm" className="text-[#2C3E50] font-semibold text-sm">
                  Confirmar
                </Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  value={form.passwordConfirm}
                  onChange={(e) => update("passwordConfirm", e.target.value)}
                  required
                  className="border-[#D4A017] bg-white text-[#2C3E50] focus-visible:ring-[#B8860B]"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-[#2C3E50] font-semibold text-sm">
                Correo Electronico
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
                className="border-[#D4A017] bg-white text-[#2C3E50] focus-visible:ring-[#B8860B]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone" className="text-[#2C3E50] font-semibold text-sm">
                Telefono (opcional)
              </Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="border-[#D4A017] bg-white text-[#2C3E50] focus-visible:ring-[#B8860B]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="activationCode" className="text-[#2C3E50] font-semibold text-sm">
                Codigo de Activacion
              </Label>
              <Input
                id="activationCode"
                value={form.activationCode}
                onChange={(e) => update("activationCode", e.target.value)}
                required
                placeholder="Ej: ACT001, DEMO2024"
                className="border-[#D4A017] bg-white text-[#2C3E50] focus-visible:ring-[#B8860B] uppercase"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#B8860B] text-white hover:bg-[#DAA520] font-bold text-base py-5 mt-2 cursor-pointer"
            >
              {loading ? "Registrando..." : "Registrar"}
            </Button>
            <div className="text-center text-sm text-[#6B7280]">
              {"Ya tienes cuenta? "}
              <Link href="/" className="text-[#B8860B] font-semibold hover:underline">
                Inicia sesion
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
