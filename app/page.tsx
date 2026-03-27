"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error al iniciar sesion")
        return
      }
      router.push("/dashboard")
    } catch {
      setError("Error de conexion al servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#E9D173] p-4">
      <div className="w-full max-w-md flex flex-col gap-3">
        <Card className="w-full border-[#D4A017] shadow-xl bg-[#FCF3CF]">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#B8860B]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#2C3E50]">ShellDB</h1>
            <p className="text-sm text-[#6B7280]">Sistema de Abarrotes</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {error && (
                <div className="rounded-md bg-[#E74C3C]/10 border border-[#E74C3C]/30 px-4 py-3 text-sm text-[#E74C3C]">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="username" className="text-[#2C3E50] font-semibold">Usuario</Label>
                <Input id="username" type="text" placeholder="Ingresa tu usuario" value={username} onChange={(e) => setUsername(e.target.value)} required className="border-[#D4A017] bg-white text-[#2C3E50] focus-visible:ring-[#B8860B]" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-[#2C3E50] font-semibold">Contrasena</Label>
                <Input id="password" type="password" placeholder="Ingresa tu contrasena" value={password} onChange={(e) => setPassword(e.target.value)} required className="border-[#D4A017] bg-white text-[#2C3E50] focus-visible:ring-[#B8860B]" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-[#B8860B] text-white hover:bg-[#DAA520] font-bold text-base py-5 cursor-pointer">
                {loading ? "Iniciando sesion..." : "Iniciar Sesion"}
              </Button>
              <div className="text-center text-sm text-[#6B7280]">
                {"No tienes cuenta? "}
                <Link href="/register" className="text-[#B8860B] font-semibold hover:underline">Registrate aqui</Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Boton Administrador Total */}
        <Link href="/superadmin" className="block">
          <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#B8860B]/40 bg-[#FFF8DC]/80 hover:bg-[#FCF3CF] hover:border-[#B8860B]/70 transition-all cursor-pointer shadow-sm group">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#B8860B]/15 group-hover:bg-[#B8860B]/25 transition-colors shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#B8860B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#7A5C00]">Administrador Total</p>
              <p className="text-xs text-[#9B7D3A]">Panel de control global del sistema</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#B8860B]/50 group-hover:text-[#B8860B] transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>
    </main>
  )
}
