"use client"

import { useState } from "react"
import useSWR from "swr"
import { useDashboard } from "../layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Venta {
  _id: string; fecha: string; total: number; items_count: number
  sucursal_codigo: string; empleado_nombre: string | null; empleado_codigo: string | null
}

interface DetalleVenta {
  producto_codigo: string; producto_nombre: string; cantidad: number
  precio_unitario: number; subtotal: number
}

interface VentaDetalle extends Venta {
  usuario: string; detalles: DetalleVenta[]
}

export default function VentasPage() {
  const { sucursal } = useDashboard()
  const { data: ventas, isLoading } = useSWR<Venta[]>(
    `/api/ventas?sucursal=${sucursal}`,
    fetcher
  )

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<VentaDetalle | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  async function verDetalle(id: string) {
    setLoadingDetail(true)
    setDetailOpen(true)
    try {
      const res = await fetch(`/api/ventas/${id}`)
      const data = await res.json()
      setDetail(data)
    } catch {
      setDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E50]">Historial de Ventas</h1>
          <p className="text-[#7F8C8D]">Registro completo de ventas realizadas</p>
        </div>
      </div>

      <Card className="border-[#D4A017]/30">
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-center text-[#7F8C8D]">Cargando ventas...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#FCF3CF]">
                    <TableHead className="text-[#2C3E50]">ID</TableHead>
                    <TableHead className="text-[#2C3E50]">Fecha</TableHead>
                    <TableHead className="text-[#2C3E50]">Empleado</TableHead>
                    <TableHead className="text-[#2C3E50]">Articulos</TableHead>
                    <TableHead className="text-[#2C3E50]">Total</TableHead>
                    <TableHead className="text-[#2C3E50]">Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ventas?.map((v) => (
                    <TableRow key={v._id}>
                      <TableCell className="font-mono text-[#2C3E50]">{v._id.slice(-8)}</TableCell>
                      <TableCell className="text-[#2C3E50]">
                        {new Date(v.fecha).toLocaleString("es-MX", {
                          year: "numeric", month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-[#2C3E50]">
                        {v.empleado_nombre ? (
                          <div>
                            <p className="font-medium text-sm">{v.empleado_nombre}</p>
                            <p className="text-xs text-[#7F8C8D]">{v.empleado_codigo}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-[#BDC3C7]">--</span>
                        )}
                      </TableCell>
                      <TableCell className="text-[#2C3E50]">{v.items_count}</TableCell>
                      <TableCell className="font-semibold text-[#D4A017]">
                        ${v.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline" size="sm"
                          onClick={() => verDetalle(v._id)}
                          className="text-xs border-[#B8860B] text-[#B8860B] hover:bg-[#B8860B] hover:text-white cursor-pointer"
                        >
                          Ver Detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {ventas?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-[#7F8C8D] py-8">
                        No hay ventas registradas. Realiza tu primera venta.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-[#FDFEFE] border-[#D4A017] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#2C3E50]">
              Detalle de Venta {detail ? `#${detail._id.slice(-8)}` : ""}
            </DialogTitle>
          </DialogHeader>
          {loadingDetail ? (
            <p className="text-center text-[#7F8C8D] py-4">Cargando detalle...</p>
          ) : detail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#7F8C8D]">Fecha</p>
                  <p className="font-medium text-[#2C3E50]">
                    {new Date(detail.fecha).toLocaleString("es-MX")}
                  </p>
                </div>
                <div>
                  <p className="text-[#7F8C8D]">Usuario</p>
                  <p className="font-medium text-[#2C3E50]">{detail.usuario}</p>
                </div>
                <div>
                  <p className="text-[#7F8C8D]">Sucursal</p>
                  <p className="font-medium text-[#2C3E50]">{detail.sucursal_codigo}</p>
                </div>
                <div>
                  <p className="text-[#7F8C8D]">Empleado</p>
                  {detail.empleado_nombre ? (
                    <p className="font-medium text-[#2C3E50]">
                      {detail.empleado_nombre} <span className="text-xs text-[#7F8C8D]">({detail.empleado_codigo})</span>
                    </p>
                  ) : (
                    <p className="text-[#BDC3C7]">--</p>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#FCF3CF]">
                      <TableHead className="text-[#2C3E50]">Codigo</TableHead>
                      <TableHead className="text-[#2C3E50]">Producto</TableHead>
                      <TableHead className="text-[#2C3E50]">Cantidad</TableHead>
                      <TableHead className="text-[#2C3E50]">P. Unitario</TableHead>
                      <TableHead className="text-[#2C3E50]">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.detalles.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-[#2C3E50]">{d.producto_codigo}</TableCell>
                        <TableCell className="text-[#2C3E50]">{d.producto_nombre}</TableCell>
                        <TableCell className="text-[#2C3E50]">{d.cantidad}</TableCell>
                        <TableCell className="text-[#2C3E50]">${d.precio_unitario.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold text-[#D4A017]">
                          ${d.subtotal.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end pt-2 border-t border-[#D4A017]/20">
                <div className="text-right">
                  <p className="text-sm text-[#7F8C8D]">TOTAL DE LA VENTA</p>
                  <p className="text-2xl font-bold text-[#D4A017]">
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
