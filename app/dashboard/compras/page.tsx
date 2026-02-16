"use client"

import { useState } from "react"
import useSWR from "swr"
import { useDashboard } from "../layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Compra {
  _id: string; fecha: string; total: number; items_count: number
  proveedor_codigo: string; proveedor_nombre: string
}

interface DetalleCompra {
  producto_codigo: string; producto_nombre: string; cantidad: number
  precio_unitario: number; subtotal: number
}

interface CompraDetalle extends Compra {
  usuario: string; sucursal_codigo: string; detalles: DetalleCompra[]
}

export default function ComprasPage() {
  const { sucursal } = useDashboard()
  const { data: compras, isLoading } = useSWR<Compra[]>(`/api/compras?sucursal=${sucursal}`, fetcher)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<CompraDetalle | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  async function verDetalle(id: string) {
    setLoadingDetail(true); setDetailOpen(true)
    try {
      const res = await fetch(`/api/compras/${id}`)
      setDetail(await res.json())
    } catch { setDetail(null) } finally { setLoadingDetail(false) }
  }

  return (
    <div className="p-6">
      <div className="bg-[#DAA520] rounded-lg px-6 py-4 mb-6">
        <h1 className="text-xl font-bold text-white">Historial de Compras</h1>
        <p className="text-sm text-white/80">Registro de compras a proveedores</p>
      </div>

      <Card className="border-[#D4A017]/30 bg-white">
        <CardContent className="pt-5">
          {isLoading ? (
            <p className="text-center text-[#6B7280] py-8">Cargando compras...</p>
          ) : (
            <div className="rounded-md border border-[#D4A017]/30 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#FCF3CF]">
                    <TableHead className="text-[#2C3E50] font-bold">ID</TableHead>
                    <TableHead className="text-[#2C3E50] font-bold">Fecha</TableHead>
                    <TableHead className="text-[#2C3E50] font-bold">Proveedor</TableHead>
                    <TableHead className="text-[#2C3E50] font-bold text-right">Items</TableHead>
                    <TableHead className="text-[#2C3E50] font-bold text-right">Total</TableHead>
                    <TableHead className="text-[#2C3E50] font-bold text-center">Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compras?.map((c) => (
                    <TableRow key={c._id} className="hover:bg-[#FCF3CF]/50">
                      <TableCell className="font-mono text-sm">{c._id.slice(-8)}</TableCell>
                      <TableCell>
                        {new Date(c.fecha).toLocaleString("es-MX", {
                          year: "numeric", month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="font-semibold">{c.proveedor_nombre}</TableCell>
                      <TableCell className="text-right">{c.items_count}</TableCell>
                      <TableCell className="text-right font-bold text-[#E67E22]">
                        ${c.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" onClick={() => verDetalle(c._id)}
                          className="text-xs border-[#B8860B] text-[#B8860B] hover:bg-[#B8860B] hover:text-white cursor-pointer">
                          Ver Detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {compras?.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-[#6B7280] py-8">No hay compras registradas</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-white border-[#D4A017] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#2C3E50]">
              Detalle de Compra {detail ? `#${detail._id.slice(-8)}` : ""}
            </DialogTitle>
          </DialogHeader>
          {loadingDetail ? (
            <p className="text-center text-[#6B7280] py-8">Cargando detalle...</p>
          ) : detail ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-[#FCF3CF] rounded-md p-3">
                  <p className="text-[#6B7280] text-xs">Fecha</p>
                  <p className="font-semibold text-[#2C3E50]">{new Date(detail.fecha).toLocaleString("es-MX")}</p>
                </div>
                <div className="bg-[#FCF3CF] rounded-md p-3">
                  <p className="text-[#6B7280] text-xs">Proveedor</p>
                  <p className="font-semibold text-[#2C3E50]">{detail.proveedor_nombre}</p>
                </div>
                <div className="bg-[#FCF3CF] rounded-md p-3">
                  <p className="text-[#6B7280] text-xs">Sucursal</p>
                  <p className="font-semibold text-[#2C3E50]">{detail.sucursal_codigo}</p>
                </div>
              </div>
              <div className="rounded-md border border-[#D4A017]/30 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#FCF3CF]">
                      <TableHead className="text-[#2C3E50] font-bold">Codigo</TableHead>
                      <TableHead className="text-[#2C3E50] font-bold">Producto</TableHead>
                      <TableHead className="text-[#2C3E50] font-bold text-right">Cantidad</TableHead>
                      <TableHead className="text-[#2C3E50] font-bold text-right">P. Unitario</TableHead>
                      <TableHead className="text-[#2C3E50] font-bold text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.detalles.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-sm">{d.producto_codigo}</TableCell>
                        <TableCell>{d.producto_nombre}</TableCell>
                        <TableCell className="text-right">{d.cantidad}</TableCell>
                        <TableCell className="text-right">${d.precio_unitario.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-bold text-[#E67E22]">${d.subtotal.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end p-3 bg-[#3498DB] rounded-md">
                <div className="text-right">
                  <p className="text-xs text-white/80">TOTAL DE LA COMPRA</p>
                  <p className="text-2xl font-bold text-white">
                    ${detail.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-[#E74C3C] py-4">Error al cargar detalle</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
