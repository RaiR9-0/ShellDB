"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Sucursal { _id: string; codigo: string; nombre: string; direccion: string; telefono: string }

export default function SucursalesPage() {
  const { data: sucursales, isLoading } = useSWR<Sucursal[]>("/api/sucursales", fetcher)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ codigo: "", nombre: "", direccion: "", telefono: "" })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await fetch("/api/sucursales", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      mutate("/api/sucursales"); setOpen(false)
      setForm({ codigo: "", nombre: "", direccion: "", telefono: "" })
    } finally { setSaving(false) }
  }

  return (
    <div className="p-6">
      <div className="bg-[#DAA520] rounded-lg px-6 py-4 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Sucursales</h1>
          <p className="text-sm text-white/80">Administracion de sucursales</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-[#27AE60] hover:bg-[#219A52] text-white font-bold cursor-pointer">+ Agregar</Button>
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
                    <TableHead className="text-[#2C3E50] font-bold">Direccion</TableHead>
                    <TableHead className="text-[#2C3E50] font-bold">Telefono</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sucursales?.map((s) => (
                    <TableRow key={s._id} className="hover:bg-[#FCF3CF]/50">
                      <TableCell className="font-mono text-sm">{s.codigo}</TableCell>
                      <TableCell className="font-semibold">{s.nombre}</TableCell>
                      <TableCell>{s.direccion}</TableCell>
                      <TableCell>{s.telefono}</TableCell>
                    </TableRow>
                  ))}
                  {sucursales?.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-[#6B7280] py-8">No hay sucursales</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border-[#D4A017]">
          <DialogHeader><DialogTitle className="text-[#2C3E50]">Nueva Sucursal</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3">
            {["codigo", "nombre", "direccion", "telefono"].map((field) => (
              <div key={field} className="flex flex-col gap-1.5">
                <Label className="text-[#2C3E50] font-semibold text-sm capitalize">{field}</Label>
                <Input
                  value={form[field as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="border-[#D4A017] bg-white text-[#2C3E50]"
                />
              </div>
            ))}
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
