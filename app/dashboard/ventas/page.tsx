"use client"

import { useDashboard } from "../layout"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader, CrudTable, HistorialDetailDialog, useHistorial, styles, type ColumnConfig } from "@/components/crud"

interface Venta { _id: string; fecha: string; total: number; items_count: number; sucursal_codigo: string; empleado_nombre: string | null; empleado_codigo: string | null }
interface VentaDetalle extends Venta { usuario: string; detalles: { producto_codigo: string; producto_nombre: string; cantidad: number; precio_unitario: number; subtotal: number }[] }

export default function VentasPage() {
  const { sucursal } = useDashboard()
  const { data, isLoading, detailOpen, setDetailOpen, detail, loadingDetail, verDetalle } = useHistorial<Venta, VentaDetalle>(`/api/ventas?sucursal=${sucursal}`, "/api/ventas")

  const columns: ColumnConfig<Venta>[] = [
    { key: "_id", label: "ID", format: (v) => (v as string).slice(-8), className: "font-mono" },
    { key: "fecha", label: "Fecha", format: (v) => new Date(v as string).toLocaleString("es-MX", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) },
    { key: "empleado_nombre", label: "Empleado", format: (v, row) => v ? <div><p className="font-medium text-sm">{v as string}</p><p className="text-xs text-[#7F8C8D]">{row.empleado_codigo}</p></div> : <span className="text-xs text-[#BDC3C7]">--</span> },
    { key: "items_count", label: "Articulos" },
    { key: "total", label: "Total", format: (v) => `$${(v as number).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, className: "font-semibold text-[#D4A017]" },
  ]

  return (
    <div className="p-6">
      <PageHeader title="Historial de Ventas" subtitle="Registro completo de ventas realizadas" />
      <Card className={styles.table.wrapper}>
        <CardContent className="pt-5">
          <CrudTable data={data} columns={columns} isLoading={isLoading} emptyMessage="No hay ventas registradas" onDetail={(v) => verDetalle(v._id)} />
        </CardContent>
      </Card>
      <HistorialDetailDialog open={detailOpen} onOpenChange={setDetailOpen} loading={loadingDetail} title="Detalle de Venta" id={detail?._id.slice(-8)} metadata={detail ? [{ label: "Fecha", value: new Date(detail.fecha).toLocaleString("es-MX") }, { label: "Usuario", value: detail.usuario }, { label: "Sucursal", value: detail.sucursal_codigo }] : []} detalles={detail?.detalles} total={detail?.total} />
    </div>
  )
}
