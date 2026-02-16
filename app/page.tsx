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
      <Card className="w-full max-w-md border-[#D4A017] shadow-xl bg-[#FCF3CF]">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#B8860B]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8"
            >
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
              <Label htmlFor="username" className="text-[#2C3E50] font-semibold">
                Usuario
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="border-[#D4A017] bg-white text-[#2C3E50] focus-visible:ring-[#B8860B]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-[#2C3E50] font-semibold">
                Contrasena
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingresa tu contrasena"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-[#D4A017] bg-white text-[#2C3E50] focus-visible:ring-[#B8860B]"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#B8860B] text-white hover:bg-[#DAA520] font-bold text-base py-5 cursor-pointer"
            >
              {loading ? "Iniciando sesion..." : "Iniciar Sesion"}
            </Button>
            <div className="text-center text-sm text-[#6B7280]">
              {"No tienes cuenta? "}
              <Link href="/register" className="text-[#B8860B] font-semibold hover:underline">
                Registrate aqui
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
