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
  sucursal_codigo: string; telefono: string; salario: number; tiene_clave: boolean
}

const emptyForm = { codigo: "", nombre: "", puesto: "", sucursal_codigo: "SUC001", telefono: "", salario: "", clave: "" }

export default function EmpleadosPage() {
  const { sucursales } = useDashboard()
  const { data: empleados, isLoading } = useSWR<Empleado[]>("/api/empleados", fetcher)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function openNew() { setForm(emptyForm); setEditing(null); setError(""); setOpen(true) }
  function openEdit(e: Empleado) {
    setForm({
      codigo: e.codigo, nombre: e.nombre, puesto: e.puesto,
      sucursal_codigo: e.sucursal_codigo, telefono: e.telefono, salario: String(e.salario),
      clave: "",
    })
    setEditing(e.codigo); setError(""); setOpen(true)
  }

  async function handleSave() {
    if (!editing && (!form.clave || form.clave.length < 4)) {
      setError("La clave debe tener al menos 4 caracteres")
      return
    }
    if (editing && form.clave && form.clave.length < 4) {
      setError("La clave debe tener al menos 4 caracteres")
      return
    }
    setSaving(true)
    setError("")
    try {
      const payload = { ...form }
      if (editing && !payload.clave) {
        const { clave: _, ...rest } = payload
        void _
        if (editing) {
          await fetch(`/api/empleados/${editing}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rest) })
        }
      } else {
        if (editing) {
          await fetch(`/api/empleados/${editing}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        } else {
          await fetch("/api/empleados", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        }
      }
      mutate("/api/empleados"); setOpen(false)
    } catch {
      setError("Error al guardar")
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E50]">Empleados</h1>
          <p className="text-[#7F8C8D]">Gestion del personal</p>
        </div>
        <Button onClick={openNew} className="bg-[#D4A017] hover:bg-[#B8860B] text-white cursor-pointer">+ Agregar</Button>
      </div>

      <Card className="border-[#D4A017]/30">
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-center text-[#7F8C8D]">Cargando...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#FCF3CF]">
                    <TableHead className="text-[#2C3E50]">Codigo</TableHead>
                    <TableHead className="text-[#2C3E50]">Nombre</TableHead>
                    <TableHead className="text-[#2C3E50]">Puesto</TableHead>
                    <TableHead className="text-[#2C3E50]">Sucursal</TableHead>
                    <TableHead className="text-[#2C3E50]">Telefono</TableHead>
                    <TableHead className="text-[#2C3E50]">Salario</TableHead>
                    <TableHead className="text-[#2C3E50]">Clave</TableHead>
                    <TableHead className="text-[#2C3E50]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empleados?.map((e) => (
                    <TableRow key={e._id}>
                      <TableCell className="font-mono text-[#2C3E50]">{e.codigo}</TableCell>
                      <TableCell className="text-[#2C3E50]">{e.nombre}</TableCell>
                      <TableCell className="text-[#2C3E50]">{e.puesto}</TableCell>
                      <TableCell className="text-[#2C3E50]">{sucMap[e.sucursal_codigo] || e.sucursal_codigo}</TableCell>
                      <TableCell className="text-[#2C3E50]">{e.telefono}</TableCell>
                      <TableCell className="text-[#2C3E50]">${e.salario.toLocaleString()}</TableCell>
                      <TableCell>
                        {e.tiene_clave ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">Asignada</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">Sin clave</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(e)} className="text-xs border-[#3498DB] text-[#3498DB] hover:bg-[#3498DB] hover:text-white cursor-pointer">Editar</Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(e.codigo)} className="text-xs border-[#E74C3C] text-[#E74C3C] hover:bg-[#E74C3C] hover:text-white cursor-pointer">Eliminar</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {empleados?.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-[#7F8C8D] py-8">No hay empleados</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#FDFEFE] border-[#D4A017]">
          <DialogHeader>
            <DialogTitle className="text-[#2C3E50]">{editing ? "Editar" : "Nuevo"} Empleado</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[#2C3E50]">Codigo</Label>
              <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} disabled={!!editing} className="border-[#D4A017] bg-white text-[#2C3E50]" />
            </div>
            <div>
              <Label className="text-[#2C3E50]">Nombre</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="border-[#D4A017] bg-white text-[#2C3E50]" />
            </div>
            <div>
              <Label className="text-[#2C3E50]">Puesto</Label>
              <Input value={form.puesto} onChange={(e) => setForm({ ...form, puesto: e.target.value })} className="border-[#D4A017] bg-white text-[#2C3E50]" />
            </div>
            <div>
              <Label className="text-[#2C3E50]">Sucursal</Label>
              <select value={form.sucursal_codigo} onChange={(e) => setForm({ ...form, sucursal_codigo: e.target.value })} className="w-full rounded-md border border-[#D4A017] bg-white text-[#2C3E50] px-3 py-2 text-sm">
                {sucursales.map((s) => <option key={s.codigo} value={s.codigo}>{s.nombre}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[#2C3E50]">Telefono</Label>
                <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="border-[#D4A017] bg-white text-[#2C3E50]" />
              </div>
              <div>
                <Label className="text-[#2C3E50]">Salario</Label>
                <Input type="number" value={form.salario} onChange={(e) => setForm({ ...form, salario: e.target.value })} className="border-[#D4A017] bg-white text-[#2C3E50]" />
              </div>
            </div>
            <div>
              <Label className="text-[#2C3E50]">
                {editing ? "Nueva Clave (dejar vacio para no cambiar)" : "Clave de Venta *"}
              </Label>
              <Input
                type="password"
                value={form.clave}
                onChange={(e) => setForm({ ...form, clave: e.target.value })}
                placeholder={editing ? "Dejar vacio para mantener la actual" : "Minimo 4 caracteres"}
                className="border-[#D4A017] bg-white text-[#2C3E50]"
              />
              <p className="text-xs text-[#7F8C8D] mt-1">
                Esta clave sera requerida para autorizar ventas a nombre de este empleado.
              </p>
            </div>
            {error && <p className="text-sm text-[#E74C3C]">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-[#D4A017] text-[#2C3E50] cursor-pointer">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#D4A017] hover:bg-[#B8860B] text-white cursor-pointer">{saving ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
