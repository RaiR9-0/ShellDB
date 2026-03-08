"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { useDashboard } from "../../layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Producto {
  codigo: string; nombre: string; precio_venta: number; stock: number
}

interface ItemVenta {
  codigo: string; nombre: string; precio_venta: number; cantidad: number; stock: number
}

interface EmpleadoAutorizado {
  codigo: string
  nombre: string
  clave: string
}

export default function NuevaVentaPage() {
  const router = useRouter()
  const { sucursal } = useDashboard()
  const { data: productos } = useSWR<Producto[]>(`/api/productos?sucursal=${sucursal}`, fetcher)

  // --- Identificacion de empleado (obligatoria al entrar) ---
  const [empleado, setEmpleado] = useState<EmpleadoAutorizado | null>(null)
  const [authOpen, setAuthOpen] = useState(true)
  const [empCodigo, setEmpCodigo] = useState("")
  const [empClave, setEmpClave] = useState("")
  const [authError, setAuthError] = useState("")
  const [authLoading, setAuthLoading] = useState(false)

  // --- Venta ---
  const [items, setItems] = useState<ItemVenta[]>([])
  const [search, setSearch] = useState("")
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function autorizarEmpleado() {
    if (!empCodigo.trim()) { setAuthError("Ingresa tu codigo de empleado"); return }
    if (!empClave.trim()) { setAuthError("Ingresa tu clave"); return }
    setAuthLoading(true)
    setAuthError("")
    try {
      const res = await fetch("/api/empleados/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: empCodigo.trim(), clave: empClave }),
      })
      const data = await res.json()
      if (!res.ok) { setAuthError(data.error || "Credenciales incorrectas"); return }
      setEmpleado({ codigo: empCodigo.trim(), nombre: data.nombre, clave: empClave })
      setAuthOpen(false)
    } catch {
      setAuthError("Error de conexion")
    } finally {
      setAuthLoading(false)
    }
  }

  const filtered = (productos || []).filter(
    (p) =>
      (p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.codigo.toLowerCase().includes(search.toLowerCase())) &&
      !items.find((i) => i.codigo === p.codigo)
  )

  function addItem(p: Producto) {
    if (p.stock <= 0) { setError(`${p.nombre} sin stock disponible`); return }
    setItems([...items, { ...p, cantidad: 1 }])
    setSearch("")
    setError("")
  }

  function updateQty(codigo: string, qty: number) {
    setItems(items.map((i) => {
      if (i.codigo !== codigo) return i
      return { ...i, cantidad: Math.max(1, Math.min(qty, i.stock)) }
    }))
  }

  function removeItem(codigo: string) {
    setItems(items.filter((i) => i.codigo !== codigo))
  }

  const total = items.reduce((s, i) => s + i.precio_venta * i.cantidad, 0)

  async function procesarVenta() {
    if (items.length === 0) { setError("Agrega al menos un producto"); return }
    setProcessing(true)
    setError("")
    try {
      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sucursal_codigo: sucursal,
          items,
          empleado_codigo: empleado!.codigo,
          empleado_clave: empleado!.clave,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Error al procesar la venta"); setConfirmOpen(false); return }
      router.push("/dashboard/ventas")
    } catch {
      setError("Error de conexion")
    } finally {
      setProcessing(false)
      setConfirmOpen(false)
    }
  }

  return (
    <div>
      {/* Dialog de identificacion — se abre al entrar, no se puede cerrar sin autenticar */}
      <Dialog
        open={authOpen}
        onOpenChange={(open) => {
          if (!open && !empleado) { router.push("/dashboard/ventas"); return }
          setAuthOpen(open)
        }}
      >
        <DialogContent className="bg-[#FDFEFE] border-[#D4A017] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#2C3E50] text-lg">Identificacion de Empleado</DialogTitle>
            <p className="text-sm text-[#7F8C8D]">
              Ingresa tu codigo y clave para comenzar a registrar la venta.
            </p>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-[#2C3E50] font-medium">Codigo de Empleado</Label>
              <Input
                value={empCodigo}
                onChange={(e) => setEmpCodigo(e.target.value)}
                placeholder="Ej: VND-2503-A7"
                className="border-[#D4A017] bg-white text-[#2C3E50] mt-1 font-mono"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-[#2C3E50] font-medium">Clave</Label>
              <Input
                type="password"
                value={empClave}
                onChange={(e) => setEmpClave(e.target.value)}
                placeholder="Tu clave de acceso"
                className="border-[#D4A017] bg-white text-[#2C3E50] mt-1"
                onKeyDown={(e) => { if (e.key === "Enter") autorizarEmpleado() }}
              />
            </div>
            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {authError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/ventas")}
              disabled={authLoading}
              className="border-[#D4A017] text-[#2C3E50] cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={autorizarEmpleado}
              disabled={authLoading}
              className="bg-[#D4A017] hover:bg-[#B8860B] text-white cursor-pointer"
            >
              {authLoading ? "Verificando..." : "Continuar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Encabezado con badge del empleado autorizado */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E50]">Nueva Venta</h1>
          <p className="text-[#7F8C8D]">Registra una venta y el stock se actualizara automaticamente</p>
        </div>
        {empleado && (
          <div className="flex items-center gap-2 bg-[#FCF3CF] border border-[#D4A017]/40 rounded-lg px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-[#27AE60]" />
            <div className="text-right">
              <p className="text-xs text-[#7F8C8D]">Empleado autorizado</p>
              <p className="text-sm font-semibold text-[#2C3E50]">{empleado.nombre}</p>
              <p className="text-xs font-mono text-[#7F8C8D]">{empleado.codigo}</p>
            </div>
            <button
              onClick={() => {
                setEmpleado(null)
                setEmpCodigo("")
                setEmpClave("")
                setAuthError("")
                setAuthOpen(true)
              }}
              className="ml-1 text-[#7F8C8D] hover:text-[#E74C3C] text-xs cursor-pointer"
              title="Cambiar empleado"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* UI bloqueada hasta que el empleado se identifique */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${!empleado ? "pointer-events-none opacity-40 select-none" : ""}`}>
        {/* Busqueda de productos */}
        <Card className="border-[#D4A017]/30">
          <CardContent className="p-4">
            <h3 className="font-semibold text-[#2C3E50] mb-3">Buscar Producto</h3>
            <Input
              placeholder="Buscar por nombre o codigo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-[#D4A017] bg-white text-[#2C3E50] mb-3"
            />
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filtered.slice(0, 20).map((p) => (
                <button
                  key={p.codigo}
                  onClick={() => addItem(p)}
                  className="w-full flex items-center justify-between p-2.5 rounded-md border border-[#D4A017]/20 hover:bg-[#FCF3CF] transition-colors text-left cursor-pointer"
                >
                  <div>
                    <p className="font-medium text-[#2C3E50] text-sm">{p.nombre}</p>
                    <p className="text-xs text-[#7F8C8D]">{p.codigo}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#D4A017] text-sm">${p.precio_venta.toFixed(2)}</p>
                    <p className={`text-xs ${p.stock > 0 ? "text-green-600" : "text-red-500"}`}>
                      Stock: {p.stock}
                    </p>
                  </div>
                </button>
              ))}
              {search && filtered.length === 0 && (
                <p className="text-center text-[#7F8C8D] py-4 text-sm">Sin resultados</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Carrito */}
        <Card className="border-[#D4A017]/30">
          <CardContent className="p-4">
            <h3 className="font-semibold text-[#2C3E50] mb-3">Items de la Venta</h3>
            {items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#7F8C8D]">Selecciona productos para vender</p>
                <p className="text-[#BDC3C7] text-sm">Busca y haz click en un producto para agregarlo</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#FCF3CF]">
                        <TableHead className="text-[#2C3E50]">Producto</TableHead>
                        <TableHead className="text-[#2C3E50]">Cantidad</TableHead>
                        <TableHead className="text-[#2C3E50]">Precio</TableHead>
                        <TableHead className="text-[#2C3E50]">Subtotal</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.codigo}>
                          <TableCell>
                            <p className="font-medium text-[#2C3E50] text-sm">{item.nombre}</p>
                            <p className="text-xs text-[#7F8C8D]">{item.codigo} | Stock: {item.stock}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateQty(item.codigo, item.cantidad - 1)}
                                className="w-7 h-7 rounded bg-[#FCF3CF] text-[#2C3E50] font-bold hover:bg-[#E9D173] cursor-pointer"
                              >-</button>
                              <Input
                                type="number"
                                value={item.cantidad}
                                onChange={(e) => updateQty(item.codigo, Number(e.target.value))}
                                min={1}
                                max={item.stock}
                                className="w-14 text-center border-[#D4A017] text-sm"
                              />
                              <button
                                onClick={() => updateQty(item.codigo, item.cantidad + 1)}
                                className="w-7 h-7 rounded bg-[#FCF3CF] text-[#2C3E50] font-bold hover:bg-[#E9D173] cursor-pointer"
                              >+</button>
                            </div>
                          </TableCell>
                          <TableCell className="text-[#2C3E50]">${item.precio_venta.toFixed(2)}</TableCell>
                          <TableCell className="font-semibold text-[#2C3E50]">
                            ${(item.precio_venta * item.cantidad).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => removeItem(item.codigo)}
                              className="text-[#E74C3C] hover:text-[#C0392B] cursor-pointer"
                              aria-label={`Remover ${item.nombre}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 pt-4 border-t border-[#D4A017]/20">
                  <p className="text-sm text-[#7F8C8D] mb-2">{items.length} producto(s)</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#7F8C8D]">TOTAL</p>
                      <p className="text-2xl font-bold text-[#D4A017]">
                        ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        if (items.length === 0) { setError("Agrega al menos un producto"); return }
                        setConfirmOpen(true)
                      }}
                      className="bg-[#27AE60] hover:bg-[#219A52] text-white px-6 py-3 text-base cursor-pointer"
                    >
                      Procesar Venta
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmacion final — sin pedir credenciales de nuevo */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-[#FDFEFE] border-[#D4A017] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#2C3E50] text-lg">Confirmar Venta</DialogTitle>
            <p className="text-sm text-[#7F8C8D]">Revisa el resumen antes de procesar.</p>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="p-3 bg-[#FCF3CF] rounded-md space-y-1">
              <p className="text-sm font-semibold text-[#2C3E50]">Empleado</p>
              <p className="text-sm text-[#2C3E50]">{empleado?.nombre}</p>
              <p className="text-xs font-mono text-[#7F8C8D]">{empleado?.codigo}</p>
            </div>
            <div className="p-3 bg-[#FCF3CF] rounded-md space-y-1">
              <p className="text-sm font-semibold text-[#2C3E50]">Resumen</p>
              <p className="text-sm text-[#7F8C8D]">{items.length} producto(s)</p>
              <p className="text-2xl font-bold text-[#D4A017]">
                Total: ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={processing} className="border-[#D4A017] text-[#2C3E50] cursor-pointer">
              Cancelar
            </Button>
            <Button onClick={procesarVenta} disabled={processing} className="bg-[#27AE60] hover:bg-[#219A52] text-white cursor-pointer">
              {processing ? "Procesando..." : "Confirmar Venta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
