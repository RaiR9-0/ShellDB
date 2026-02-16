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

interface Proveedor { _id: string; codigo: string; nombre: string; contacto: string; telefono: string; email: string }

export default function ProveedoresPage() {
  const { data: proveedores, isLoading } = useSWR<Proveedor[]>("/api/proveedores", fetcher)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ codigo: "", nombre: "", contacto: "", telefono: "", email: "" })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await fetch("/api/proveedores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      mutate("/api/proveedores"); setOpen(false)
      setForm({ codigo: "", nombre: "", contacto: "", telefono: "", email: "" })
    } finally { setSaving(false) }
  }

  return (
    <div className="p-6">
      <div className="bg-[#DAA520] rounded-lg px-6 py-4 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Proveedores</h1>
          <p className="text-sm text-white/80">Directorio de proveedores</p>
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
                    <TableHead className="text-[#2C3E50] font-bold">Contacto</TableHead>
                    <TableHead className="text-[#2C3E50] font-bold">Telefono</TableHead>
                    <TableHead className="text-[#2C3E50] font-bold">Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proveedores?.map((p) => (
                    <TableRow key={p._id} className="hover:bg-[#FCF3CF]/50">
                      <TableCell className="font-mono text-sm">{p.codigo}</TableCell>
                      <TableCell className="font-semibold">{p.nombre}</TableCell>
                      <TableCell>{p.contacto}</TableCell>
                      <TableCell>{p.telefono}</TableCell>
                      <TableCell>{p.email}</TableCell>
                    </TableRow>
                  ))}
                  {proveedores?.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-[#6B7280] py-8">No hay proveedores</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border-[#D4A017]">
          <DialogHeader><DialogTitle className="text-[#2C3E50]">Nuevo Proveedor</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3">
            {["codigo", "nombre", "contacto", "telefono", "email"].map((field) => (
              <div key={field} className="flex flex-col gap-1.5">
                <Label className="text-[#2C3E50] font-semibold text-sm capitalize">{field}</Label>
                <Input
                  value={form[field as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  type={field === "email" ? "email" : "text"}
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
