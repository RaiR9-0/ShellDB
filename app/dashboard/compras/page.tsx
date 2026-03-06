"use client"

import { useDashboard } from "../layout"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader, CrudTable, HistorialDetailDialog, useHistorial, styles, type ColumnConfig } from "@/components/crud"

interface Compra { _id: string; fecha: string; total: number; items_count: number; proveedor_codigo: string; proveedor_nombre: string }
interface CompraDetalle extends Compra { usuario: string; sucursal_codigo: string; detalles: { producto_codigo: string; producto_nombre: string; cantidad: number; precio_unitario: number; subtotal: number }[] }

export default function ComprasPage() {
  const { sucursal } = useDashboard()
  const { data, isLoading, detailOpen, setDetailOpen, detail, loadingDetail, verDetalle } = useHistorial<Compra, CompraDetalle>(`/api/compras?sucursal=${sucursal}`, "/api/compras")

  const columns: ColumnConfig<Compra>[] = [
    { key: "_id", label: "ID", format: (v) => (v as string).slice(-8), className: "font-mono text-sm" },
    { key: "fecha", label: "Fecha", format: (v) => new Date(v as string).toLocaleString("es-MX", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) },
    { key: "proveedor_nombre", label: "Proveedor", className: "font-semibold" },
    { key: "items_count", label: "Items", align: "right" },
    { key: "total", label: "Total", align: "right", format: (v) => `$${(v as number).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, className: "font-bold text-[#E67E22]" },
  ]

  return (
    <div className="p-6">
      <PageHeader title="Historial de Compras" subtitle="Registro de compras a proveedores" />
      <Card className={styles.table.wrapper}>
        <CardContent className="pt-5">
          <CrudTable data={data} columns={columns} isLoading={isLoading} emptyMessage="No hay compras registradas" onDetail={(c) => verDetalle(c._id)} />
        </CardContent>
      </Card>
      <HistorialDetailDialog open={detailOpen} onOpenChange={setDetailOpen} loading={loadingDetail} title="Detalle de Compra" id={detail?._id.slice(-8)} metadata={detail ? [{ label: "Fecha", value: new Date(detail.fecha).toLocaleString("es-MX") }, { label: "Proveedor", value: detail.proveedor_nombre }, { label: "Sucursal", value: detail.sucursal_codigo }] : []} detalles={detail?.detalles} total={detail?.total} />
    </div>
  )
}
