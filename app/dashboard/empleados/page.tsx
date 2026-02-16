"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { useDashboard } from "../layout"
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

interface Empleado {
  _id: string; codigo: string; nombre: string; puesto: string
  sucursal_codigo: string; telefono: string; salario: number
}

const emptyForm = { codigo: "", nombre: "", puesto: "", sucursal_codigo: "SUC001", telefono: "", salario: "" }

export default function EmpleadosPage() {
  const { sucursales } = useDashboard()
  const { data: empleados, isLoading } = useSWR<Empleado[]>("/api/empleados", fetcher)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function openNew() { setForm(emptyForm); setEditing(null); setOpen(true) }
  function openEdit(e: Empleado) {
    setForm({
      codigo: e.codigo, nombre: e.nombre, puesto: e.puesto,
      sucursal_codigo: e.sucursal_codigo, telefono: e.telefono, salario: String(e.salario),
    })
    setEditing(e.codigo); setOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editing) {
        await fetch(`/api/empleados/${editing}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      } else {
        await fetch("/api/empleados", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      }
      mutate("/api/empleados"); setOpen(false)
    } finally { setSaving(false) }
  }

  async function handleDelete(codigo: string) {
    if (!confirm("Eliminar este empleado?")) return
    await fetch(`/api/empleados/${codigo}`, { method: "DELETE" })
    mutate("/api/empleados")
  }

  const sucMap: Record<string, string> = {}
  for (const s of sucursales) sucMap[s.codigo] = s.nombre

  return (
    <div className="p-6">
      <div className="bg-[#DAA520] rounded-lg px-6 py-4 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Empleados</h1>
          <p className="text-sm text-white/80">Gestion del personal</p>
        </div>
        <Button onClick={openNew} className="bg-[#27AE60] hover:bg-[#219A52] text-white font-bold cursor-pointer">+ Agregar</Button>
      </div>

      <Card className="border-[#D4A017]/30 bg-white">
        <CardContent className="pt-5">
          {isLoading ? (
            <p className="text-center text-[#6B7280] py-8">Cargando...</p>
          ) : (
            <div className="rounded-md border border-[#D4A017]/30 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#FCF3CF]">
                    <TableHead className="text-[#2C3E50] font-bold">Codigo</TableHead>
                    <TableHead className="text-[#2C3E50] font-bold">Nombre</TableHead>
                    <TableHead className="text-[#2C3E50] font-bold">Puesto</TableHead>
                    <TableHead className="text-[#2C3E50] font-bold">Sucursal</TableHead>
                    <TableHead className="text-[#2C3E50] font-bold">Telefono</TableHead>
                    <TableHead className="text-[#2C3E50] font-bold text-right">Salario</TableHead>
                    <TableHead className="text-[#2C3E50] font-bold text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empleados?.map((e) => (
                    <TableRow key={e._id} className="hover:bg-[#FCF3CF]/50">
                      <TableCell className="font-mono text-sm">{e.codigo}</TableCell>
                      <TableCell>{e.nombre}</TableCell>
                      <TableCell>{e.puesto}</TableCell>
                      <TableCell>{sucMap[e.sucursal_codigo] || e.sucursal_codigo}</TableCell>
                      <TableCell>{e.telefono}</TableCell>
                      <TableCell className="text-right font-bold">${e.salario.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="outline" size="sm" onClick={() => openEdit(e)} className="text-xs border-[#3498DB] text-[#3498DB] hover:bg-[#3498DB] hover:text-white cursor-pointer">Editar</Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(e.codigo)} className="text-xs border-[#E74C3C] text-[#E74C3C] hover:bg-[#E74C3C] hover:text-white cursor-pointer">Eliminar</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {empleados?.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-[#6B7280] py-8">No hay empleados</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border-[#D4A017]">
          <DialogHeader><DialogTitle className="text-[#2C3E50]">{editing ? "Editar" : "Nuevo"} Empleado</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[#2C3E50] font-semibold text-sm">Codigo</Label>
              <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} disabled={!!editing} className="border-[#D4A017] bg-white text-[#2C3E50]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[#2C3E50] font-semibold text-sm">Nombre</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="border-[#D4A017] bg-white text-[#2C3E50]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[#2C3E50] font-semibold text-sm">Puesto</Label>
              <Input value={form.puesto} onChange={(e) => setForm({ ...form, puesto: e.target.value })} className="border-[#D4A017] bg-white text-[#2C3E50]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[#2C3E50] font-semibold text-sm">Sucursal</Label>
              <select value={form.sucursal_codigo} onChange={(e) => setForm({ ...form, sucursal_codigo: e.target.value })} className="rounded-md border border-[#D4A017] bg-white text-[#2C3E50] px-3 py-2 text-sm">
                {sucursales.map((s) => <option key={s.codigo} value={s.codigo}>{s.nombre}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[#2C3E50] font-semibold text-sm">Telefono</Label>
                <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="border-[#D4A017] bg-white text-[#2C3E50]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[#2C3E50] font-semibold text-sm">Salario</Label>
                <Input type="number" value={form.salario} onChange={(e) => setForm({ ...form, salario: e.target.value })} className="border-[#D4A017] bg-white text-[#2C3E50]" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-[#D4A017] text-[#2C3E50] cursor-pointer">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#B8860B] text-white hover:bg-[#DAA520] cursor-pointer">{saving ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
