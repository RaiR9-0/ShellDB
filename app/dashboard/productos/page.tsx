"use client"

import { useState, useCallback } from "react"
import useSWR, { mutate } from "swr"
import { useDashboard } from "../layout"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader, CrudTable, CrudDialog, styles, type ColumnConfig, type FieldConfig } from "@/components/crud"

interface Producto { _id: string; codigo: string; nombre: string; categoria: string; categoria_codigo: string; precio_compra: number; precio_venta: number; stock: number; stock_minimo: number }
interface Categoria { codigo: string; nombre: string }
type ProductoForm = { codigo: string; nombre: string; categoria_codigo: string; precio_compra: string; precio_venta: string; stock_inicial: string; stock_minimo: string }
const emptyForm: ProductoForm = { codigo: "", nombre: "", categoria_codigo: "CAT001", precio_compra: "", precio_venta: "", stock_inicial: "", stock_minimo: "10" }

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ProductosPage() {
  const { sucursal } = useDashboard()
  const apiUrl = `/api/productos?sucursal=${sucursal}`
  
  const { data: productos, isLoading } = useSWR<Producto[]>(apiUrl, fetcher)
  const { data: categorias } = useSWR<Categoria[]>("/api/categorias", fetcher)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<ProductoForm>(emptyForm)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const updateField = useCallback((field: keyof ProductoForm, value: string) => setForm((p) => ({ ...p, [field]: value })), [])

  const openNew = useCallback(() => { setForm(emptyForm); setEditing(null); setOpen(true) }, [])
  
  const openEdit = useCallback((p: Producto) => {
    setForm({ codigo: p.codigo, nombre: p.nombre, categoria_codigo: p.categoria_codigo, precio_compra: String(p.precio_compra), precio_venta: String(p.precio_venta), stock_inicial: String(p.stock), stock_minimo: String(p.stock_minimo) })
    setEditing(p.codigo)
    setOpen(true)
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await fetch(editing ? `/api/productos/${editing}` : "/api/productos", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      mutate(apiUrl)
      setOpen(false)
    } finally { setSaving(false) }
  }, [apiUrl, editing, form])

  const handleDelete = useCallback(async (p: Producto) => {
    if (!confirm("Eliminar este producto?")) return
    await fetch(`/api/productos/${p.codigo}`, { method: "DELETE" })
    mutate(apiUrl)
  }, [apiUrl])

  const columns: ColumnConfig<Producto>[] = [
    { key: "codigo", label: "Codigo", className: "font-mono text-sm" },
    { key: "nombre", label: "Nombre" },
    { key: "categoria", label: "Categoria" },
    { key: "precio_compra", label: "P. Compra", align: "right", format: (v) => `$${(v as number).toFixed(2)}` },
    { key: "precio_venta", label: "P. Venta", align: "right", format: (v) => `$${(v as number).toFixed(2)}` },
    { key: "stock", label: "Stock", align: "right", format: (v, row) => <span className={`font-bold ${(v as number) <= row.stock_minimo ? "text-[#E74C3C]" : "text-[#27AE60]"}`}>{v as number}</span> },
    { key: "stock_minimo", label: "Min.", align: "right" },
  ]

  const fields: FieldConfig[] = [
    { name: "codigo", label: "Codigo", disabled: () => !!editing, colSpan: 2 },
    { name: "nombre", label: "Nombre", colSpan: 2 },
    { name: "categoria_codigo", label: "Categoria", type: "select", options: (categorias || []).map((c) => ({ value: c.codigo, label: c.nombre })), colSpan: 2 },
    { name: "precio_compra", label: "Precio Compra", type: "number" },
    { name: "precio_venta", label: "Precio Venta", type: "number" },
    ...(!editing ? [{ name: "stock_inicial", label: "Stock Inicial", type: "number" as const }, { name: "stock_minimo", label: "Stock Minimo", type: "number" as const }] : []),
  ]

  return (
    <div className="p-6">
      <PageHeader title="Productos" subtitle="Gestion del catalogo" actionLabel="Agregar" onAction={openNew} />
      <Card className={styles.table.wrapper}>
        <CardContent className="pt-5">
          <CrudTable data={productos} columns={columns} isLoading={isLoading} emptyMessage="No hay productos" onEdit={openEdit} onDelete={handleDelete} />
        </CardContent>
      </Card>
      <CrudDialog open={open} onOpenChange={setOpen} title="Producto" fields={fields} form={form} onChange={updateField} onSave={handleSave} saving={saving} editing={!!editing} />
    </div>
  )
}
