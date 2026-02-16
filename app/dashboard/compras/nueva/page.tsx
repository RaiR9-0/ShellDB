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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Producto { codigo: string; nombre: string; precio_compra: number; stock: number }
interface Proveedor { codigo: string; nombre: string }
interface ItemCompra { codigo: string; nombre: string; precio_compra: number; cantidad: number }

export default function NuevaCompraPage() {
  const router = useRouter()
  const { sucursal } = useDashboard()
  const { data: productos } = useSWR<Producto[]>(`/api/productos?sucursal=${sucursal}`, fetcher)
  const { data: proveedores } = useSWR<Proveedor[]>("/api/proveedores", fetcher)

  const [items, setItems] = useState<ItemCompra[]>([])
  const [search, setSearch] = useState("")
  const [proveedorCodigo, setProveedorCodigo] = useState("")
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")

  const filtered = (productos || []).filter(
    (p) =>
      (p.nombre.toLowerCase().includes(search.toLowerCase()) || p.codigo.toLowerCase().includes(search.toLowerCase())) &&
      !items.find((i) => i.codigo === p.codigo)
  )

  function addItem(p: Producto) {
    setItems([...items, { codigo: p.codigo, nombre: p.nombre, precio_compra: p.precio_compra, cantidad: 1 }])
    setSearch("")
  }

  function updateQty(codigo: string, qty: number) {
    setItems(items.map((i) => i.codigo === codigo ? { ...i, cantidad: Math.max(1, qty) } : i))
  }

  function removeItem(codigo: string) {
    setItems(items.filter((i) => i.codigo !== codigo))
  }

  const total = items.reduce((s, i) => s + i.precio_compra * i.cantidad, 0)

  const selectedProv = (proveedores || []).find((p) => p.codigo === proveedorCodigo)

  async function procesarCompra() {
    if (!proveedorCodigo) { setError("Selecciona un proveedor"); return }
    if (items.length === 0) { setError("Agrega al menos un producto"); return }
    setProcessing(true); setError("")
    try {
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sucursal_codigo: sucursal,
          proveedor_codigo: proveedorCodigo,
          proveedor_nombre: selectedProv?.nombre || proveedorCodigo,
          items,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push("/dashboard/compras")
    } catch { setError("Error de conexion") } finally { setProcessing(false) }
  }

  return (
    <div className="p-6">
      <div className="bg-[#DAA520] rounded-lg px-6 py-4 mb-6">
        <h1 className="text-xl font-bold text-white">Nueva Compra</h1>
        <p className="text-sm text-white/80">Registra una compra y el stock aumentara automaticamente</p>
      </div>

      {error && (
        <div className="rounded-md bg-[#E74C3C]/10 border border-[#E74C3C]/30 px-4 py-3 text-sm text-[#E74C3C] mb-4">{error}</div>
      )}

      {/* Proveedor selector */}
      <Card className="border-[#D4A017]/30 bg-white mb-4">
        <CardContent className="pt-5">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#2C3E50] font-semibold text-sm">Proveedor</Label>
            <select
              value={proveedorCodigo}
              onChange={(e) => setProveedorCodigo(e.target.value)}
              className="rounded-md border border-[#D4A017] bg-white text-[#2C3E50] px-3 py-2 text-sm"
            >
              <option value="">-- Selecciona proveedor --</option>
              {(proveedores || []).map((p) => (
                <option key={p.codigo} value={p.codigo}>{p.nombre} ({p.codigo})</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-[#D4A017]/30 bg-white lg:col-span-1">
          <CardContent className="pt-5">
            <h2 className="text-sm font-bold text-[#2C3E50] mb-3">Buscar Producto</h2>
            <Input
              placeholder="Buscar por nombre o codigo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-[#D4A017] bg-white text-[#2C3E50] mb-3"
            />
            <div className="max-h-64 overflow-y-auto flex flex-col gap-1.5">
              {filtered.slice(0, 15).map((p) => (
                <button
                  key={p.codigo}
                  onClick={() => addItem(p)}
                  className="flex items-center justify-between p-2.5 rounded-md border border-[#D4A017]/20 hover:bg-[#FCF3CF] transition-colors text-left cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#2C3E50]">{p.nombre}</p>
                    <p className="text-xs text-[#6B7280]">{p.codigo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#E67E22]">${p.precio_compra.toFixed(2)}</p>
                    <p className="text-xs text-[#6B7280]">Stock: {p.stock}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#D4A017]/30 bg-white lg:col-span-2">
          <CardContent className="pt-5">
            <h2 className="text-sm font-bold text-[#2C3E50] mb-3">Items de la Compra</h2>
            {items.length === 0 ? (
              <div className="text-center py-12 text-[#6B7280]">
                <p className="text-lg">Selecciona productos para comprar</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border border-[#D4A017]/30 overflow-auto mb-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#FCF3CF]">
                        <TableHead className="text-[#2C3E50] font-bold">Producto</TableHead>
                        <TableHead className="text-[#2C3E50] font-bold text-center w-28">Cantidad</TableHead>
                        <TableHead className="text-[#2C3E50] font-bold text-right">Precio</TableHead>
                        <TableHead className="text-[#2C3E50] font-bold text-right">Subtotal</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.codigo}>
                          <TableCell>
                            <p className="font-semibold text-sm">{item.nombre}</p>
                            <p className="text-xs text-[#6B7280]">{item.codigo}</p>
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              value={item.cantidad}
                              onChange={(e) => updateQty(item.codigo, Number(e.target.value))}
                              min={1}
                              className="w-20 text-center border-[#D4A017] text-sm mx-auto"
                            />
                          </TableCell>
                          <TableCell className="text-right">${item.precio_compra.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-bold text-[#E67E22]">
                            ${(item.precio_compra * item.cantidad).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <button onClick={() => removeItem(item.codigo)} className="text-[#E74C3C] hover:text-[#C0392B] cursor-pointer" aria-label={`Remover ${item.nombre}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#FCF3CF] rounded-lg">
                  <p className="text-sm text-[#6B7280]">{items.length} producto(s)</p>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-[#6B7280]">TOTAL COMPRA</p>
                      <p className="text-2xl font-bold text-[#2C3E50]">
                        ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Button
                      onClick={procesarCompra}
                      disabled={processing}
                      className="bg-[#3498DB] hover:bg-[#2980B9] text-white font-bold px-8 py-6 text-base cursor-pointer"
                    >
                      {processing ? "Procesando..." : "Procesar Compra"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
