"use client"

import { useState, useEffect, useCallback } from "react"
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts"

const C = {
  gold: "#B8860B", amber: "#DAA520", light: "#FCF3CF", cream: "#FFF8DC",
  bg: "#E9D173", dark: "#2C3E50", gray: "#6B7280",
  red: "#E74C3C", green: "#27AE60", blue: "#3498DB",
  orange: "#E67E22", purple: "#9B59B6",
}
const PAL = [C.gold, C.orange, C.blue, C.green, C.purple, C.red, "#1ABC9C", "#F39C12"]
const TT = { backgroundColor: C.cream, border: `1px solid #D4A017`, borderRadius: "8px", fontSize: "12px", color: C.dark }

function Kpi({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon: string }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm" style={{ background: C.light, border: `1px solid ${color}40` }}>
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{label}</p>
      </div>
      <p className="text-2xl font-black" style={{ color: C.dark }}>{value}</p>
      {sub && <p className="text-[10px] font-mono" style={{ color: C.gray }}>{sub}</p>}
    </div>
  )
}

function Sec({ title, op, color }: { title: string; op: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1 h-6 rounded-full" style={{ background: color }} />
      <h3 className="font-black text-sm flex-1" style={{ color: C.dark }}>{title}</h3>
      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>{op}</span>
    </div>
  )
}

function Box({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl p-5 shadow-sm ${className}`} style={{ background: C.light, border: "1px solid #D4A01740" }}>{children}</div>
}

// ─── TIPOS ───────────────────────────────────────────────────────────────────
interface UserRow {
  _id: string; username: string; email: string; phone: string
  database_name: string; createdAt: string | null
  max_sucursales: number; tienda_bloqueada: boolean
  stats: { productos: number; ventas: number; compras: number; empleados: number; sucursales: number; ultima_venta: string | null }
}

interface SparkData {
  spark: boolean
  login_usuarios: {
    total_fallidos: number; total_exitosos: number
    serie_diaria: { dia: string; fallidos: number; exitosos: number }[]
    top_ips: { ip: string; intentos: number }[]
    top_users_fail: { usuario: string; intentos: number }[]
    serie_hora: { hora: string; intentos: number }[]
    motivos: { motivo: string; count: number }[]
    ips_peligrosas: { ip: string; total_fallos: number; ultimo_fallo: string | null }[]
  } | null
  login_superadmin: {
    total_fallidos: number; total_exitosos: number
    serie_diaria: { dia: string; intentos: number }[]
    top_ips: { ip: string; intentos: number; ultimo: string | null }[]
    serie_hora: { hora: string; intentos: number }[]
    ultimos: { ip: string; username: string; motivo: string; fecha: string | null; ua: string }[]
  } | null
  ranking_tiendas: { ranking: number; db_name: string; username: string; n_ventas: number; total_ventas: number; avg_venta: number }[] | null
  usuarios_resumen: { total: number; registros_por_mes: { mes: string; nuevos_usuarios: number }[] } | null
  _meta: { procesadoEn: string | null; totalUsuarios: number; totalTiendas: number }
}

// ═══════════════════════════════════════════════════════════════════
//  PANTALLA LOGIN
// ═══════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState(""); const [pass, setPass] = useState("")
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true)
    try {
      const r = await fetch("/api/superadmin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: user, password: pass }) })
      const d = await r.json()
      if (!r.ok) { setError(d.error || "Credenciales incorrectas"); return }
      onLogin()
    } catch { setError("Error de conexion") } finally { setLoading(false) }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ background: C.bg }}>
      <div className="w-full max-w-sm">
        <div className="rounded-2xl shadow-xl p-8 flex flex-col gap-5" style={{ background: C.light, border: "1px solid #D4A017" }}>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: C.gold }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-xl font-black" style={{ color: C.dark }}>Administrador Total</h1>
            <p className="text-sm mt-1" style={{ color: C.gray }}>ShellDB · Panel de Control Global</p>
          </div>
          {error && <div className="rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: "#E74C3C15", border: "1px solid #E74C3C40", color: C.red }}>{error}</div>}
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold" style={{ color: C.dark }}>Usuario</label>
              <input type="text" value={user} onChange={e => setUser(e.target.value)} required autoFocus placeholder="admin"
                className="rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: "white", border: "1.5px solid #D4A017", color: C.dark }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold" style={{ color: C.dark }}>Contrasena</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} required placeholder="••••••"
                className="rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: "white", border: "1.5px solid #D4A017", color: C.dark }} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-black text-white text-sm cursor-pointer"
              style={{ background: loading ? "#D4A017" : C.gold }}>
              {loading ? "Verificando..." : "Acceder al Panel"}
            </button>
          </form>
          <a href="/" className="text-center text-xs cursor-pointer" style={{ color: C.gray }}>← Volver al inicio de sesion</a>
        </div>
        <p className="text-center text-xs mt-4" style={{ color: "#9B7D3A" }}>Credenciales configuradas en variables de entorno</p>
      </div>
    </main>
  )
}

// ═══════════════════════════════════════════════════════════════════
//  PANTALLA SIN SPARK
// ═══════════════════════════════════════════════════════════════════
function NoSparkScreen() {
  return (
    <div className="rounded-2xl p-8 flex flex-col items-center gap-5 text-center" style={{ background: C.light, border: "1px solid #D4A01740" }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: C.amber + "20" }}>⚡</div>
      <div>
        <p className="font-black text-lg" style={{ color: C.dark }}>Pipeline Spark no ejecutado</p>
        <p className="text-sm mt-1" style={{ color: C.gray }}>El análisis de seguridad usa Apache Spark. Ejecuta el script para ver los datos.</p>
      </div>
      <div className="w-full max-w-lg rounded-2xl p-5 text-left" style={{ background: C.cream, border: "1px solid #D4A01740" }}>
        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: C.gold }}>Comando para ejecutar</p>
        <div className="space-y-1">
          {[
            "# Script dedicado para el panel de administrador:",
            "python3 analisis_spark_admin.py",
            "",
            "# Lee la BD 'proyecto' (login_attempts, sa_login_attempts,",
            "# usuarios) y TODAS las BDs de tiendas registradas.",
            "# Guarda resultados en: proyecto → spark_results_admin",
          ].map((line, i) => (
            <p key={i} className={`font-mono text-xs ${line.startsWith("#") ? "" : line === "" ? "h-2 block" : "rounded px-2 py-1 mt-1"}`}
              style={{ color: line.startsWith("#") ? C.green : C.dark, background: line.startsWith("#") || line === "" ? "transparent" : "#FFF8DC" }}>
              {line}
            </p>
          ))}
        </div>
      </div>
      <p className="text-xs font-mono" style={{ color: C.gray }}>Los resultados se actualizan cada vez que ejecutas el script</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════════
function Dashboard() {
  const [tab, setTab] = useState<"usuarios" | "seguridad">("usuarios")
  const [users, setUsers] = useState<UserRow[]>([])
  const [spark, setSpark] = useState<SparkData | null>(null)
  const [loadU, setLoadU] = useState(true)
  const [loadS, setLoadS] = useState(true)
  const [search, setSearch] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    setLoadU(true)
    try { const r = await fetch("/api/superadmin/users"); if (r.ok) setUsers(await r.json()) }
    finally { setLoadU(false) }
  }, [])

  const loadSpark = useCallback(async () => {
    setLoadS(true)
    try { const r = await fetch("/api/superadmin/security"); if (r.ok) setSpark(await r.json()) }
    finally { setLoadS(false) }
  }, [])

  useEffect(() => { loadUsers(); loadSpark() }, [loadUsers, loadSpark])

  async function patchUser(id: string, body: Record<string, unknown>) {
    setUpdatingId(id)
    try {
      const r = await fetch(`/api/superadmin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (r.ok) {
        setUsers(prev => prev.map(u => u._id === id ? { ...u, ...body } : u))
      }
    } catch { /* ignore */ }
    finally { setUpdatingId(null) }
  }

  async function logout() { await fetch("/api/superadmin/logout", { method: "POST" }); window.location.reload() }

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.database_name.toLowerCase().includes(search.toLowerCase())
  )

  const lu = spark?.login_usuarios
  const lsa = spark?.login_superadmin

  return (
    <main className="min-h-screen" style={{ background: C.bg }}>
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between shadow-sm" style={{ background: C.gold }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: "rgba(255,255,255,0.2)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-black text-base leading-none">Administrador Total</h1>
            <p className="text-white/70 text-[11px] font-mono">
              {spark?._meta?.procesadoEn
                ? `Spark: ${new Date(spark._meta.procesadoEn).toLocaleString("es-MX")}`
                : "⚡ Spark: pendiente de ejecutar"}
            </p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-white cursor-pointer" style={{ background: "rgba(231,76,60,0.9)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Salir
        </button>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
        {/* KPIs globales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Kpi label="Tiendas Activas"       value={users.length}                        sub="usuarios registrados"        color={C.gold}   icon="🏪" />
          <Kpi label="Fallidos SA"           value={lsa?.total_fallidos ?? "—"}          sub="intentos superadmin"         color={C.red}    icon="🚨" />
          <Kpi label="Fallidos Usuarios"     value={lu?.total_fallidos  ?? "—"}          sub="logins rechazados"           color={C.orange} icon="⚠️" />
          <Kpi label="Exitosos Usuarios"     value={lu?.total_exitosos  ?? "—"}          sub="logins correctos"            color={C.green}  icon="✅" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: C.light, border: "1px solid #D4A01730" }}>
          {[{ id: "usuarios", label: "Usuarios & Tiendas", icon: "🏪" }, { id: "seguridad", label: "Analytics Spark · Seguridad", icon: "⚡" }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold flex-1 justify-center transition-all cursor-pointer"
              style={tab === t.id ? { background: C.gold, color: "white" } : { color: C.gray }}>
              <span>{t.icon}</span><span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── TAB USUARIOS ── */}
        {tab === "usuarios" && (
          <div className="space-y-4">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke={C.gray} strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Buscar por usuario, email o tienda..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: C.light, border: "1.5px solid #D4A017", color: C.dark }} />
            </div>
            {loadU ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${C.gold} transparent transparent transparent` }} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((u, i) => (
                  <div key={u._id} className="rounded-2xl p-5 shadow-sm flex flex-col gap-4 hover:shadow-md transition-all"
                    style={{ background: C.light, border: "1px solid #D4A01740" }}>
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl font-black text-white text-base shrink-0" style={{ background: PAL[i % PAL.length] }}>
                        {u.username[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm truncate" style={{ color: C.dark }}>{u.username}</p>
                        <p className="text-xs truncate" style={{ color: C.gray }}>{u.email || "Sin email"}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: `${PAL[i % PAL.length]}20`, color: PAL[i % PAL.length], border: `1px solid ${PAL[i % PAL.length]}30` }}>#{i + 1}</span>
                    </div>
                    <div className="rounded-xl px-3 py-2" style={{ background: C.cream, border: "1px solid #D4A01730" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: C.gold }}>BD / Tienda</p>
                      <p className="text-sm font-black font-mono" style={{ color: C.dark }}>{u.database_name || "—"}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Ventas",     value: u.stats.ventas,     icon: "🧾" },
                        { label: "Compras",    value: u.stats.compras,    icon: "📦" },
                        { label: "Productos",  value: u.stats.productos,  icon: "🏷️" },
                        { label: "Empleados",  value: u.stats.empleados,  icon: "👤" },
                        { label: "Sucursales", value: u.stats.sucursales, icon: "🏪" },
                        { label: "Desde",      value: u.createdAt ? new Date(u.createdAt).toLocaleDateString("es-MX", { month: "short", year: "2-digit" }) : "—", icon: "📅" },
                      ].map(s => (
                        <div key={s.label} className="rounded-xl px-2 py-2 text-center" style={{ background: "white", border: "1px solid #D4A01720" }}>
                          <p className="text-base leading-none mb-0.5">{s.icon}</p>
                          <p className="text-xs font-black" style={{ color: C.dark }}>{s.value}</p>
                          <p className="text-[9px] font-mono" style={{ color: C.gray }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                    {u.stats.ultima_venta && (
                      <p className="text-[10px] font-mono text-right" style={{ color: C.gray }}>
                        Última venta: {new Date(u.stats.ultima_venta).toLocaleString("es-MX")}
                      </p>
                    )}

                    {/* ── CONTROLES DE ADMINISTRACIÓN ── */}
                    <div className="mt-3 pt-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center"
                      style={{ borderTop: `1px solid ${C.gold}25` }}>

                      {/* Límite de sucursales */}
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap" style={{ color: C.gray }}>
                          🏪 Máx. sucursales
                        </span>
                        <div className="flex gap-1">
                          {[1, 2, 3].map(n => (
                            <button
                              key={n}
                              disabled={updatingId === u._id}
                              onClick={() => patchUser(u._id, { max_sucursales: n })}
                              className="w-8 h-7 rounded-lg text-xs font-black transition-all"
                              style={{
                                background: u.max_sucursales === n ? C.gold : `${C.gold}15`,
                                color: u.max_sucursales === n ? "#fff" : C.dark,
                                border: `1.5px solid ${u.max_sucursales === n ? C.gold : `${C.gold}30`}`,
                                opacity: updatingId === u._id ? 0.5 : 1,
                              }}>
                              {n}
                            </button>
                          ))}
                        </div>
                        <span className="text-[9px] font-mono" style={{ color: C.gray }}>
                          ({u.stats.sucursales}/{u.max_sucursales} activas)
                        </span>
                      </div>

                      {/* Bloqueo de tienda */}
                      <button
                        disabled={updatingId === u._id}
                        onClick={() => patchUser(u._id, { tienda_bloqueada: !u.tienda_bloqueada })}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap"
                        style={{
                          background: u.tienda_bloqueada ? "#E74C3C15" : `${C.green}15`,
                          color: u.tienda_bloqueada ? C.red : C.green,
                          border: `1.5px solid ${u.tienda_bloqueada ? "#E74C3C40" : `${C.green}40`}`,
                          opacity: updatingId === u._id ? 0.5 : 1,
                        }}>
                        <span>{u.tienda_bloqueada ? "🔒" : "🔓"}</span>
                        <span>{u.tienda_bloqueada ? "Tienda bloqueada" : "Tienda activa"}</span>
                        {updatingId === u._id && (
                          <span className="w-3 h-3 rounded-full border border-t-transparent animate-spin inline-block"
                            style={{ borderColor: "currentColor", borderTopColor: "transparent" }} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loadU && filtered.length === 0 && (
              <div className="text-center py-16" style={{ color: C.gray }}>
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-bold">Sin resultados para "{search}"</p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB SEGURIDAD SPARK ── */}
        {tab === "seguridad" && (
          <div className="space-y-5">
            {loadS ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${C.gold} transparent transparent transparent` }} />
                  <div className="absolute inset-0 flex items-center justify-center text-xl">⚡</div>
                </div>
                <p className="font-bold" style={{ color: C.gray }}>Cargando resultados Spark...</p>
              </div>
            ) : !spark?.spark ? (
              <NoSparkScreen />
            ) : (
              <>
                {/* Badge Spark */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: C.amber + "15", border: `1px solid ${C.amber}30` }}>
                  <span className="text-xl">⚡</span>
                  <div className="flex-1">
                    <p className="text-xs font-black" style={{ color: C.gold }}>Apache Spark · Admin Pipeline · BD: proyecto → spark_results_admin</p>
                    <p className="text-[11px] font-mono" style={{ color: C.gray }}>
                      {spark._meta.procesadoEn
                        ? `Procesado: ${new Date(spark._meta.procesadoEn).toLocaleString("es-MX")} · ${spark._meta.totalUsuarios} usuarios · ${spark._meta.totalTiendas} tiendas`
                        : "Sin metadata"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: `${C.green}20`, border: `1px solid ${C.green}30` }}>
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.green }} />
                    <span className="text-[10px] font-bold" style={{ color: C.green }}>LIVE</span>
                  </div>
                </div>

                {/* ── SUPERADMIN SECURITY ── */}
                <div className="rounded-2xl px-5 py-3" style={{ background: "#E74C3C10", border: "1px solid #E74C3C30" }}>
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: C.red }}>🚨 Intentos al Panel Superadmin · sa_login_attempts</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Kpi label="Fallidos SA"   value={lsa?.total_fallidos ?? 0} sub="COUNT(tipo=fallido)"  color={C.red}    icon="❌" />
                  <Kpi label="Exitosos SA"   value={lsa?.total_exitosos ?? 0} sub="COUNT(tipo=exitoso)"  color={C.green}  icon="✅" />
                  <Kpi label="IPs únicas"    value={lsa?.top_ips?.length ?? 0} sub="GROUP BY ip"         color={C.purple} icon="🌐" />
                  <Kpi label="Tasa fallo SA"
                    value={lsa && (lsa.total_fallidos + lsa.total_exitosos) > 0
                      ? `${Math.round(lsa.total_fallidos / (lsa.total_fallidos + lsa.total_exitosos) * 100)}%`
                      : "0%"}
                    sub="fallidos / total" color={C.orange} icon="📊" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {lsa && lsa.serie_diaria.length > 0 && (
                    <Box>
                      <Sec title="Intentos fallidos SA por día" op="GroupBy DATE · COUNT" color={C.red} />
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={lsa.serie_diaria}>
                          <defs>
                            <linearGradient id="saG" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor={C.red} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={C.red} stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#D4A01720" />
                          <XAxis dataKey="dia"      tick={{ fontSize: 9, fill: C.gray }} />
                          <YAxis tick={{ fontSize: 9, fill: C.gray }} allowDecimals={false} />
                          <Tooltip contentStyle={TT} formatter={(v: number) => [v, "Intentos"]} />
                          <Area type="monotone" dataKey="intentos" stroke={C.red} fill="url(#saG)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  )}

                  {lsa && lsa.serie_hora.length > 0 && (
                    <Box>
                      <Sec title="Distribución horaria · SA" op="EXTRACT(HOUR)" color={C.orange} />
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={lsa.serie_hora}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#D4A01720" />
                          <XAxis dataKey="hora" tick={{ fontSize: 8, fill: C.gray }} />
                          <YAxis tick={{ fontSize: 8, fill: C.gray }} allowDecimals={false} />
                          <Tooltip contentStyle={TT} formatter={(v: number) => [v, "Intentos"]} />
                          <Bar dataKey="intentos" fill={C.orange} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}

                  {lsa && lsa.top_ips.length > 0 && (
                    <Box>
                      <Sec title="Top IPs sospechosas · SA" op="GROUP BY ip ORDER BY COUNT DESC" color={C.purple} />
                      <div className="space-y-2">
                        {lsa.top_ips.map((ip, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: C.cream }}>
                            <span className="text-[10px] font-bold w-5 text-center">{i + 1}</span>
                            <code className="flex-1 text-xs font-bold font-mono" style={{ color: C.dark }}>{ip.ip}</code>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-black" style={{ background: "#E74C3C15", color: C.red, border: "1px solid #E74C3C30" }}>{ip.intentos}x</span>
                          </div>
                        ))}
                      </div>
                    </Box>
                  )}

                  {lsa && lsa.ultimos.length > 0 && (
                    <Box>
                      <Sec title="Últimos intentos fallidos SA" op="ORDER BY fecha DESC LIMIT 15" color={C.red} />
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {lsa.ultimos.map((a, i) => (
                          <div key={i} className="rounded-xl px-3 py-2 flex flex-col gap-0.5" style={{ background: C.cream, border: "1px solid #E74C3C15" }}>
                            <div className="flex items-center justify-between gap-2">
                              <code className="text-xs font-bold font-mono" style={{ color: C.red }}>{a.ip}</code>
                              <span className="text-[10px] font-mono" style={{ color: C.gray }}>{a.fecha ? new Date(a.fecha).toLocaleString("es-MX") : "—"}</span>
                            </div>
                            <p className="text-[11px]" style={{ color: C.gray }}>
                              Usuario: <span style={{ color: C.dark, fontWeight: 700 }}>{a.username}</span>
                              {" · "}{a.motivo.replace(/_/g, " ")}
                            </p>
                            <p className="text-[10px] truncate font-mono" style={{ color: C.gray }}>{a.ua}</p>
                          </div>
                        ))}
                      </div>
                    </Box>
                  )}
                </div>

                {/* ── USUARIOS LOGIN ── */}
                <div className="rounded-2xl px-5 py-3 mt-2" style={{ background: "#E67E2210", border: "1px solid #E67E2230" }}>
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: C.orange }}>⚠️ Intentos de login · Usuarios normales · login_attempts</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Kpi label="Fallidos"        value={lu?.total_fallidos ?? 0}       sub="logins rechazados"   color={C.orange} icon="❌" />
                  <Kpi label="Exitosos"        value={lu?.total_exitosos ?? 0}       sub="logins correctos"    color={C.green}  icon="✅" />
                  <Kpi label="IPs únicas"      value={lu?.top_ips?.length ?? 0}      sub="GROUP BY ip"         color={C.blue}   icon="🌐" />
                  <Kpi label="Usuarios blancos" value={lu?.top_users_fail?.length ?? 0} sub="con intentos fallidos" color={C.purple} icon="👤" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {lu && lu.serie_diaria.length > 0 && (
                    <Box>
                      <Sec title="Login diario usuarios · fallidos vs exitosos" op="GroupBy DATE · PIVOT tipo" color={C.blue} />
                      <ResponsiveContainer width="100%" height={210}>
                        <AreaChart data={lu.serie_diaria}>
                          <defs>
                            <linearGradient id="uFG" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor={C.orange} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={C.orange} stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="uOG" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor={C.green} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={C.green} stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#D4A01720" />
                          <XAxis dataKey="dia" tick={{ fontSize: 9, fill: C.gray }} />
                          <YAxis tick={{ fontSize: 9, fill: C.gray }} allowDecimals={false} />
                          <Tooltip contentStyle={TT} />
                          <Area type="monotone" dataKey="exitosos" name="Exitosos" stroke={C.green}  fill="url(#uOG)" strokeWidth={2} />
                          <Area type="monotone" dataKey="fallidos" name="Fallidos" stroke={C.orange} fill="url(#uFG)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  )}

                  {lu && lu.motivos.length > 0 && (
                    <Box>
                      <Sec title="Motivos de fallo" op="GROUP BY motivo" color={C.orange} />
                      <div className="space-y-2 mt-1">
                        {lu.motivos.map((m, i) => {
                          const max = lu.motivos[0]?.count || 1
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <p className="text-xs w-36 truncate" style={{ color: C.dark }}>{m.motivo}</p>
                              <div className="flex-1 h-2 rounded-full" style={{ background: "#D4A01720" }}>
                                <div className="h-2 rounded-full transition-all" style={{ width: `${(m.count / max) * 100}%`, background: PAL[i % PAL.length] }} />
                              </div>
                              <span className="text-xs font-black w-8 text-right" style={{ color: C.dark }}>{m.count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </Box>
                  )}

                  {lu && lu.top_users_fail.length > 0 && (
                    <Box>
                      <Sec title="Usuarios con más intentos fallidos" op="GROUP BY username ORDER BY COUNT DESC" color={C.orange} />
                      <ResponsiveContainer width="100%" height={210}>
                        <BarChart data={lu.top_users_fail} layout="vertical" margin={{ left: 90, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#D4A01720" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 9, fill: C.gray }} allowDecimals={false} />
                          <YAxis type="category" dataKey="usuario" tick={{ fontSize: 10, fill: C.dark }} width={85} />
                          <Tooltip contentStyle={TT} formatter={(v: number) => [v, "Intentos"]} />
                          <Bar dataKey="intentos" radius={[0, 6, 6, 0]}>
                            {lu.top_users_fail.map((_: unknown, i: number) => <Cell key={i} fill={PAL[i % PAL.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}

                  {lu && lu.top_ips.length > 0 && (
                    <Box>
                      <Sec title="Top IPs con fallos · Usuarios" op="GROUP BY ip ORDER BY COUNT DESC" color={C.blue} />
                      <div className="space-y-2">
                        {lu.top_ips.map((ip, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: C.cream }}>
                            <span className="text-[10px] font-bold w-5 text-center">{i + 1}</span>
                            <code className="flex-1 text-xs font-bold font-mono" style={{ color: C.dark }}>{ip.ip}</code>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-black" style={{ background: "#E67E2215", color: C.orange, border: "1px solid #E67E2230" }}>{ip.intentos}x</span>
                          </div>
                        ))}
                      </div>
                    </Box>
                  )}

                  {lu && lu.serie_hora.length > 0 && (
                    <Box>
                      <Sec title="Fallos por hora del día · Usuarios" op="EXTRACT(HOUR FROM fecha)" color={C.purple} />
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={lu.serie_hora}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#D4A01720" />
                          <XAxis dataKey="hora" tick={{ fontSize: 8, fill: C.gray }} />
                          <YAxis tick={{ fontSize: 8, fill: C.gray }} allowDecimals={false} />
                          <Tooltip contentStyle={TT} formatter={(v: number) => [v, "Intentos"]} />
                          <Bar dataKey="intentos" fill={C.purple} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}

                  {lu && lu.ips_peligrosas.length > 0 && (
                    <Box>
                      <Sec title="IPs más peligrosas · Window Function" op="RANK() OVER (ORDER BY total_fallos DESC)" color={C.red} />
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr style={{ borderBottom: "1px solid #D4A01730" }}>
                              {["#", "IP", "Total Fallos", "Último fallo"].map(h => (
                                <th key={h} className="py-2 px-3 text-left font-black" style={{ color: C.gray, fontSize: "9px", textTransform: "uppercase" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {lu.ips_peligrosas.map((ip, i) => (
                              <tr key={i} style={{ borderBottom: "1px solid #D4A01715" }}>
                                <td className="py-2 px-3 font-mono" style={{ color: C.gray }}>{i + 1}</td>
                                <td className="py-2 px-3 font-bold font-mono" style={{ color: C.dark }}>{ip.ip}</td>
                                <td className="py-2 px-3">
                                  <span className="px-2 py-0.5 rounded-full font-black text-[11px]" style={{ background: "#E74C3C15", color: C.red, border: "1px solid #E74C3C30" }}>{ip.total_fallos}</span>
                                </td>
                                <td className="py-2 px-3 font-mono" style={{ color: C.gray }}>{ip.ultimo_fallo ? new Date(ip.ultimo_fallo).toLocaleString("es-MX") : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Box>
                  )}
                </div>

                {/* ── RANKING TIENDAS ── */}
                {spark.ranking_tiendas && spark.ranking_tiendas.length > 0 && (
                  <>
                    <div className="rounded-2xl px-5 py-3 mt-2" style={{ background: `${C.gold}15`, border: `1px solid ${C.gold}30` }}>
                      <p className="text-xs font-black uppercase tracking-widest" style={{ color: C.gold }}>🏆 Ranking de tiendas por ventas · Spark Window RANK()</p>
                    </div>
                    <Box>
                      <Sec title="Ranking global de tiendas" op="RANK() OVER (ORDER BY total_ventas DESC)" color={C.gold} />
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={spark.ranking_tiendas} layout="vertical" margin={{ left: 100, right: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#D4A01720" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 9, fill: C.gray }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                          <YAxis type="category" dataKey="username" tick={{ fontSize: 11, fill: C.dark }} width={95} />
                          <Tooltip contentStyle={TT} formatter={(v: number) => [`$${v.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, "Total ventas"]} />
                          <Bar dataKey="total_ventas" radius={[0, 6, 6, 0]}>
                            {spark.ranking_tiendas!.map((_: unknown, i: number) => <Cell key={i} fill={PAL[i % PAL.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </>
                )}

                {/* Pie distribución */}
                {lu && (lu.total_fallidos + lu.total_exitosos + (lsa?.total_fallidos ?? 0) + (lsa?.total_exitosos ?? 0)) > 0 && (
                  <Box>
                    <Sec title="Distribución global de intentos de login" op="UNION ALL · COUNT GROUP BY tipo" color={C.gold} />
                    <div className="flex items-center gap-6 flex-wrap">
                      <ResponsiveContainer width={220} height={180}>
                        <PieChart>
                          <Pie data={[
                            { name: "SA Fallidos",     value: lsa?.total_fallidos ?? 0 },
                            { name: "SA Exitosos",     value: lsa?.total_exitosos ?? 0 },
                            { name: "Users Fallidos",  value: lu?.total_fallidos  ?? 0 },
                            { name: "Users Exitosos",  value: lu?.total_exitosos  ?? 0 },
                          ].filter(d => d.value > 0)} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                            {[C.red, C.green, C.orange, "#27AE60"].map((c, i) => <Cell key={i} fill={c} />)}
                          </Pie>
                          <Tooltip contentStyle={TT} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-2">
                        {[
                          { label: "SA Fallidos",    value: lsa?.total_fallidos ?? 0, color: C.red },
                          { label: "SA Exitosos",    value: lsa?.total_exitosos ?? 0, color: C.green },
                          { label: "Users Fallidos", value: lu?.total_fallidos  ?? 0, color: C.orange },
                          { label: "Users Exitosos", value: lu?.total_exitosos  ?? 0, color: "#27AE60" },
                        ].map((d, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <div className="w-3 h-3 rounded-sm" style={{ background: d.color }} />
                            <span style={{ color: C.gray }}>{d.label}</span>
                            <span className="font-black ml-1" style={{ color: C.dark }}>{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Box>
                )}

                {/* No data fallback */}
                {!lsa?.total_fallidos && !lu?.total_fallidos && (
                  <div className="text-center py-16 rounded-2xl" style={{ background: C.light, border: "1px solid #D4A01730" }}>
                    <p className="text-5xl mb-3">🛡️</p>
                    <p className="font-black text-lg" style={{ color: C.dark }}>Sin intentos fallidos registrados</p>
                    <p className="text-sm mt-1" style={{ color: C.gray }}>Pipeline Spark ejecutado — el sistema está seguro por ahora</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

// ═══════════════════════════════════════════════════════════════════
//  ROOT
// ═══════════════════════════════════════════════════════════════════
export default function SuperAdminPage() {
  const [checked, setChecked] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    fetch("/api/superadmin/session")
      .then(r => { setAuthed(r.ok); setChecked(true) })
      .catch(() => { setAuthed(false); setChecked(true) })
  }, [])

  if (!checked) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${C.gold} transparent transparent transparent` }} />
    </main>
  )

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />
  return <Dashboard />
}
