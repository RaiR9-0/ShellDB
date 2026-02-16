"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { useDashboard } from "../layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Producto {
  _id: string
  codigo: string
  nombre: string
  categoria: string
  categoria_codigo: string
  precio_compra: number
  precio_venta: number
  stock: number
  stock_minimo: number
}

interface Categoria {
  codigo: string
  nombre: string
}

const emptyForm = {
  codigo: "",
  nombre: "",
  categoria_codigo: "CAT001",
  precio_compra: "",
  precio_venta: "",
  stock_inicial: "",
  stock_minimo: "10",
}

export default function ProductosPage() {
  const { sucursal } = useDashboard()
  const { data: productos, isLoading } = useSWR<Producto[]>(
    `/api/productos?sucursal=${sucursal}`,
    fetcher
  )
  const { data: categorias } = useSWR<Categoria[]>("/api/categorias", fetcher)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function openNew() {
    setForm(emptyForm)
    setEditing(null)
    setOpen(true)
  }

  function openEdit(p: Producto) {
    setForm({
      codigo: p.codigo,
      nombre: p.nombre,
      categoria_codigo: p.categoria_codigo,
      precio_compra: String(p.precio_compra),
      precio_venta: String(p.precio_venta),
      stock_inicial: String(p.stock),
      stock_minimo: String(p.stock_minimo),
    })
    setEditing(p.codigo)
    setOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editing) {
        await fetch(`/api/productos/${editing}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      } else {
        await fetch("/api/productos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      }
      mutate(`/api/productos?sucursal=${sucursal}`)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(codigo: string) {
    if (!confirm("Eliminar este producto?")) return
    await fetch(`/api/productos/${codigo}`, { method: "DELETE" })
    mutate(`/api/productos?sucursal=${sucursal}`)
  }

  return (
    <div className="p-6">
      <div className="bg-[#DAA520] rounded-lg px-6 py-4 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Productos</h1>
          <p className="text-sm text-white/80">Gestion del catalogo de productos</p>
        </div>
        <Button
          onClick={openNew}
          className="bg-[#27AE60] hover:bg-[#219A52] text-white font-bold cursor-pointer"
        >
          + Agregar
        </Button>
      </div>

      <Card className="border-[#D4A017]/30 bg-white">
        <CardContent className="pt-5">
          {isLoading ? (
            <p className="text-center text-[#6B7280] py-8">Cargando productos...</p>
          ) : (
            <div className="rounded-md border border-[#D4A017]/30 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#FCF3CF]">
                    <TableHead className="text-[#2C3E50] font-bold">Codigo</TableHead>
                    <TableHead className="text-[#2C3E50] font-bold">Nombre</TableHead>
                    <TableHead className="text-[#2C3E50] font-bold">Categoria</TableHead>
                    <TableHead className="text-[#2C3E50] font-bold text-right">P. Compra</TableHead>
                    <TableHead className="text-[#2C3E50] font-bold text-right">P. Venta</TableHead>
                    <TableHead className="text-[#2C3E50] font-bold text-right">Stock</TableHead>
                    <TableHead className="text-[#2C3E50] font-bold text-right">Min.</TableHead>
                    <TableHead className="text-[#2C3E50] font-bold text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productos?.map((p) => (
                    <TableRow key={p._id} className="hover:bg-[#FCF3CF]/50">
                      <TableCell className="font-mono text-sm">{p.codigo}</TableCell>
                      <TableCell>{p.nombre}</TableCell>
                      <TableCell>{p.categoria}</TableCell>
                      <TableCell className="text-right">${p.precio_compra.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${p.precio_venta.toFixed(2)}</TableCell>
                      <TableCell className={`text-right font-bold ${p.stock <= p.stock_minimo ? "text-[#E74C3C]" : "text-[#27AE60]"}`}>
                        {p.stock}
                      </TableCell>
                      <TableCell className="text-right">{p.stock_minimo}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(p)}
                            className="text-xs border-[#3498DB] text-[#3498DB] hover:bg-[#3498DB] hover:text-white cursor-pointer"
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(p.codigo)}
                            className="text-xs border-[#E74C3C] text-[#E74C3C] hover:bg-[#E74C3C] hover:text-white cursor-pointer"
                          >
                            Eliminar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {productos?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-[#6B7280] py-8">
                        No hay productos registrados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border-[#D4A017]">
          <DialogHeader>
            <DialogTitle className="text-[#2C3E50]">
              {editing ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[#2C3E50] font-semibold text-sm">Codigo</Label>
              <Input
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                disabled={!!editing}
                className="border-[#D4A017] bg-white text-[#2C3E50]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[#2C3E50] font-semibold text-sm">Nombre</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="border-[#D4A017] bg-white text-[#2C3E50]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[#2C3E50] font-semibold text-sm">Categoria</Label>
              <select
                value={form.categoria_codigo}
                onChange={(e) => setForm({ ...form, categoria_codigo: e.target.value })}
                className="rounded-md border border-[#D4A017] bg-white text-[#2C3E50] px-3 py-2 text-sm"
              >
                {(categorias || []).map((c) => (
                  <option key={c.codigo} value={c.codigo}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[#2C3E50] font-semibold text-sm">Precio Compra</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.precio_compra}
                  onChange={(e) => setForm({ ...form, precio_compra: e.target.value })}
                  className="border-[#D4A017] bg-white text-[#2C3E50]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[#2C3E50] font-semibold text-sm">Precio Venta</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.precio_venta}
                  onChange={(e) => setForm({ ...form, precio_venta: e.target.value })}
                  className="border-[#D4A017] bg-white text-[#2C3E50]"
                />
              </div>
            </div>
            {!editing && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[#2C3E50] font-semibold text-sm">Stock Inicial</Label>
                  <Input
                    type="number"
                    value={form.stock_inicial}
                    onChange={(e) => setForm({ ...form, stock_inicial: e.target.value })}
                    className="border-[#D4A017] bg-white text-[#2C3E50]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[#2C3E50] font-semibold text-sm">Stock Minimo</Label>
                  <Input
                    type="number"
                    value={form.stock_minimo}
                    onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })}
                    className="border-[#D4A017] bg-white text-[#2C3E50]"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-[#D4A017] text-[#2C3E50] cursor-pointer">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#B8860B] text-white hover:bg-[#DAA520] cursor-pointer">
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
