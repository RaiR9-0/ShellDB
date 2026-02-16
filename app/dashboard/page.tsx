"use client"

import useSWR from "swr"
import { useDashboard } from "./layout"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface DashboardData {
  totalProductos: number
  totalEmpleados: number
  stockTotal: number
  bajoStock: { codigo: string; nombre: string; stock: number; minimo: number }[]
  ventasHoy: number
  totalVendidoHoy: number
  ultimasVentas: { _id: string; fecha: string; items_count: number; total: number }[]
}

export default function DashboardPage() {
  const { sucursal } = useDashboard()
  const { data, isLoading } = useSWR<DashboardData>(
    `/api/dashboard?sucursal=${sucursal}`,
    fetcher,
    { refreshInterval: 10000 }
  )

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#B8860B] font-semibold">Cargando dashboard...</p>
      </div>
    )
  }

  const stats = [
    { label: "Productos", value: data.totalProductos, color: "#B8860B" },
    { label: "Stock Total", value: data.stockTotal, color: "#27AE60" },
    { label: "Bajo Stock", value: data.bajoStock.length, color: data.bajoStock.length > 0 ? "#E74C3C" : "#27AE60" },
    { label: "Ventas Hoy", value: data.ventasHoy, color: "#3498DB" },
    { label: "$ Vendido Hoy", value: `$${data.totalVendidoHoy.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, color: "#DAA520" },
    { label: "Empleados", value: data.totalEmpleados, color: "#E67E22" },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-[#DAA520] rounded-lg px-6 py-4 mb-6">
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-white/80">Vista general de tu tienda</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-0 shadow-md bg-white overflow-hidden">
            <div className="h-1.5" style={{ backgroundColor: stat.color }} />
            <CardContent className="pt-4 pb-3 text-center">
              <p
                className="text-2xl font-bold"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
              <p className="text-xs text-[#6B7280] mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock alerts */}
        {data.bajoStock.length > 0 && (
          <Card className="border-[#E74C3C]/30 bg-white">
            <CardContent className="pt-5">
              <h2 className="text-base font-bold text-[#E74C3C] mb-3">
                Alertas de Bajo Stock
              </h2>
              <div className="rounded-md border border-[#D4A017]/30 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#FCF3CF]">
                      <TableHead className="text-[#2C3E50] font-bold text-xs">Codigo</TableHead>
                      <TableHead className="text-[#2C3E50] font-bold text-xs">Producto</TableHead>
                      <TableHead className="text-[#2C3E50] font-bold text-xs text-right">Stock</TableHead>
                      <TableHead className="text-[#2C3E50] font-bold text-xs text-right">Minimo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.bajoStock.map((p) => (
                      <TableRow key={p.codigo}>
                        <TableCell className="text-xs font-mono">{p.codigo}</TableCell>
                        <TableCell className="text-xs">{p.nombre}</TableCell>
                        <TableCell className="text-xs text-right font-bold text-[#E74C3C]">
                          {p.stock}
                        </TableCell>
                        <TableCell className="text-xs text-right">{p.minimo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Latest sales */}
        {data.ultimasVentas.length > 0 && (
          <Card className="border-[#D4A017]/30 bg-white">
            <CardContent className="pt-5">
              <h2 className="text-base font-bold text-[#B8860B] mb-3">
                Ultimas Ventas
              </h2>
              <div className="rounded-md border border-[#D4A017]/30 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#FCF3CF]">
                      <TableHead className="text-[#2C3E50] font-bold text-xs">ID</TableHead>
                      <TableHead className="text-[#2C3E50] font-bold text-xs">Fecha</TableHead>
                      <TableHead className="text-[#2C3E50] font-bold text-xs text-right">Items</TableHead>
                      <TableHead className="text-[#2C3E50] font-bold text-xs text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.ultimasVentas.map((v) => (
                      <TableRow key={v._id}>
                        <TableCell className="text-xs font-mono">
                          {v._id.slice(-8)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(v.fecha).toLocaleString("es-MX", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="text-xs text-right">{v.items_count}</TableCell>
                        <TableCell className="text-xs text-right font-bold text-[#27AE60]">
                          ${v.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
