"use client"

import { useEffect, useState, createContext, useContext, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface SessionData {
  username: string
  userDbName: string
  email: string
}

interface Sucursal {
  codigo: string
  nombre: string
}

interface DashboardCtx {
  session: SessionData | null
  sucursal: string
  setSucursal: (s: string) => void
  sucursales: Sucursal[]
}

const DashboardContext = createContext<DashboardCtx>({
  session: null,
  sucursal: "SUC001",
  setSucursal: () => {},
  sucursales: [],
})

export function useDashboard() {
  return useContext(DashboardContext)
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" },
  { href: "/dashboard/productos", label: "Productos", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { href: "/dashboard/ventas/nueva", label: "Nueva Venta", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" },
  { href: "/dashboard/ventas", label: "Historial Ventas", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { href: "/dashboard/compras/nueva", label: "Nueva Compra", icon: "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" },
  { href: "/dashboard/compras", label: "Historial Compras", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { href: "/dashboard/empleados", label: "Empleados", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { href: "/dashboard/sucursales", label: "Sucursales", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { href: "/dashboard/proveedores", label: "Proveedores", icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
  { href: "/dashboard/inventario", label: "Inventario", icon: "M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16M10 11h4" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sucursal, setSucursalState] = useState("SUC001")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { data: session, error: sessionError } = useSWR<SessionData>(
    "/api/auth/session",
    fetcher
  )

  const { data: sucursalesData } = useSWR<Sucursal[]>("/api/sucursales", fetcher)

  useEffect(() => {
    if (sessionError || (session && "error" in session)) {
      router.push("/")
    }
  }, [session, sessionError, router])

  const setSucursal = useCallback((s: string) => {
    setSucursalState(s)
  }, [])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
  }

  if (!session || "error" in session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E9D173]">
        <p className="text-[#2C3E50] text-lg font-semibold">Cargando...</p>
      </div>
    )
  }

  const sucursales = Array.isArray(sucursalesData) ? sucursalesData : []

  return (
    <DashboardContext.Provider value={{ session, sucursal, setSucursal, sucursales }}>
      <div className="min-h-screen flex bg-[#E9D173]">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#B8860B] text-white
            flex flex-col transition-transform lg:translate-x-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* Logo */}
          <div className="bg-[#DAA520] px-5 py-4">
            <h1 className="text-xl font-bold text-white text-balance">Mi Tienda</h1>
            <p className="text-xs text-white/80 mt-0.5">{session.username}</p>
            <p className="text-[10px] text-white/60">BD: {session.userDbName}</p>
          </div>

          {/* Sucursal selector */}
          <div className="px-4 py-3 border-b border-[#DAA520]">
            <label className="text-xs font-semibold text-[#E9D173] block mb-1">
              Sucursal Activa
            </label>
            <select
              value={sucursal}
              onChange={(e) => setSucursal(e.target.value)}
              className="w-full rounded bg-[#DAA520] text-white text-sm px-2 py-1.5 border-0 outline-none cursor-pointer"
            >
              {sucursales.map((s) => (
                <option key={s.codigo} value={s.codigo}>
                  {s.nombre}
                </option>
              ))}
              {sucursales.length === 0 && (
                <option value="SUC001">Sucursal Central</option>
              )}
            </select>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-2">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-5 py-2.5 text-sm transition-colors
                    ${isActive ? "bg-[#DAA520] font-bold" : "hover:bg-[#D4A017]"}
                  `}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-[#E74C3C] hover:bg-[#C0392B] text-white text-sm font-bold py-2.5 rounded transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar Sesion
            </button>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top bar mobile */}
          <header className="lg:hidden bg-[#DAA520] text-white px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 cursor-pointer"
              aria-label="Abrir menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-base font-bold">Mi Tienda</h1>
            <span className="text-xs">{session.username}</span>
          </header>

          {/* Content */}
          <main className="flex-1 bg-[#FFF8DC] overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </DashboardContext.Provider>
  )
}
