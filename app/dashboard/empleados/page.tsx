"use client"

import { useState, useCallback, useEffect } from "react"
import useSWR, { mutate } from "swr"
import { useDashboard } from "../layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { PageHeader, CrudTable, styles, type ColumnConfig } from "@/components/crud"
import { OwnerPinModal } from "@/components/owner-pin"

interface Empleado { _id: string; codigo: string; nombre: string; puesto: string; sucursal_codigo: string; telefono: string; salario: number; tiene_clave: boolean }
type EmpleadoForm = { codigo: string; nombre: string; puesto: string; sucursal_codigo: string; telefono: string; salario: string; clave: string }
const emptyForm: EmpleadoForm = { codigo: "", nombre: "", puesto: "", sucursal_codigo: "SUC001", telefono: "", salario: "", clave: "" }

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function EmpleadosPage() {
  const { sucursales } = useDashboard()
  const { data: empleados, isLoading } = useSWR<Empleado[]>("/api/empleados", fetcher)
  const { data: pinData } = useSWR<{ configured: boolean }>("/api/owner-pin", fetcher)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<EmpleadoForm>(emptyForm)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // PIN state
  const [pinOpen, setPinOpen] = useState(false)
  const [pinVerified, setPinVerified] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  // Si hay PIN y aun no verificado, bloquear al cargar
  useEffect(() => {
    if (pinData?.configured && !pinVerified) setPinOpen(true)
  }, [pinData, pinVerified])

  const sucMap: Record<string, string> = {}
  for (const s of sucursales) sucMap[s.codigo] = s.nombre

  function requirePin(action: () => void) {
    if (!pinData?.configured || pinVerified) { action(); return }
    setPendingAction(() => action)
    setPinOpen(true)
  }

  function onPinSuccess() {
    setPinVerified(true)
    if (pendingAction) { pendingAction(); setPendingAction(null) }
  }

  const openNew = useCallback(() => {
    requirePin(() => { setForm(emptyForm); setEditing(null); setError(""); setOpen(true) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinData, pinVerified])

  const openEdit = useCallback((e: Empleado) => {
    requirePin(() => {
      setForm({ codigo: e.codigo, nombre: e.nombre, puesto: e.puesto, sucursal_codigo: e.sucursal_codigo, telefono: e.telefono, salario: String(e.salario), clave: "" })
      setEditing(e.codigo); setError(""); setOpen(true)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinData, pinVerified])

  const handleSave = useCallback(async () => {
    if (!editing && (!form.clave || form.clave.length < 4)) { setError("La clave debe tener al menos 4 caracteres"); return }
    if (editing && form.clave && form.clave.length < 4) { setError("La clave debe tener al menos 4 caracteres"); return }
    setSaving(true); setError("")
    try {
      const payload = editing && !form.clave ? (({ clave: _, ...rest }) => rest)(form) : form
      await fetch(editing ? `/api/empleados/${editing}` : "/api/empleados", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      mutate("/api/empleados"); setOpen(false)
    } catch { setError("Error al guardar") } finally { setSaving(false) }
  }, [editing, form])

  const handleDelete = useCallback(async (e: Empleado) => {
    requirePin(async () => {
      if (!confirm("Eliminar este empleado?")) return
      await fetch(`/api/empleados/${e.codigo}`, { method: "DELETE" })
      mutate("/api/empleados")
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinData, pinVerified])

  const columns: ColumnConfig<Empleado>[] = [
    { key: "codigo", label: "Codigo", className: "font-mono" },
    { key: "nombre", label: "Nombre" },
    { key: "puesto", label: "Puesto" },
    { key: "sucursal_codigo", label: "Sucursal", format: (v) => sucMap[v as string] || v },
    { key: "telefono", label: "Telefono" },
    { key: "salario", label: "Salario", format: (v) => `$${(v as number).toLocaleString()}` },
    { key: "tiene_clave", label: "Clave", format: (v) => v ? <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">Asignada</span> : <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">Sin clave</span> },
  ]

  return (
    <div className="p-6">
      <PageHeader title="Empleados" subtitle="Gestión del personal — zona protegida" actionLabel="Agregar" onAction={openNew}
        actionExtra={pinData?.configured ? (
          <div className="flex items-center gap-1.5 bg-[#DAA520]/10 border border-[#DAA520]/30 rounded-full px-3 py-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-[#DAA520]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-[#DAA520] text-xs font-semibold">Zona Dueño</span>
          </div>
        ) : undefined}
      />
      <Card className={styles.table.wrapper}>
        <CardContent className="pt-5">
          <CrudTable data={empleados} columns={columns} isLoading={isLoading} emptyMessage="No hay empleados" onEdit={openEdit} onDelete={handleDelete} />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={styles.dialog.content}>
          <DialogHeader><DialogTitle className={styles.dialog.title}>{editing ? "Editar" : "Nuevo"} Empleado</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5"><Label className={styles.label}>Codigo</Label><Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} disabled={!!editing} className={styles.input.default} /></div>
            <div className="flex flex-col gap-1.5"><Label className={styles.label}>Nombre</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className={styles.input.default} /></div>
            <div className="flex flex-col gap-1.5"><Label className={styles.label}>Puesto</Label><Input value={form.puesto} onChange={(e) => setForm({ ...form, puesto: e.target.value })} className={styles.input.default} /></div>
            <div className="flex flex-col gap-1.5">
              <Label className={styles.label}>Sucursal</Label>
              <select value={form.sucursal_codigo} onChange={(e) => setForm({ ...form, sucursal_codigo: e.target.value })} className={styles.input.select}>
                {sucursales.map((s) => <option key={s.codigo} value={s.codigo}>{s.nombre}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5"><Label className={styles.label}>Telefono</Label><Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className={styles.input.default} /></div>
              <div className="flex flex-col gap-1.5"><Label className={styles.label}>Salario</Label><Input type="number" value={form.salario} onChange={(e) => setForm({ ...form, salario: e.target.value })} className={styles.input.default} /></div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={styles.label}>{editing ? "Nueva Clave (vacío = mantener)" : "Clave de Venta *"}</Label>
              <Input type="password" value={form.clave} onChange={(e) => setForm({ ...form, clave: e.target.value })} placeholder={editing ? "Dejar vacío para mantener" : "Mínimo 4 caracteres"} className={styles.input.default} />
              <p className="text-xs text-[#7F8C8D]">Esta clave será requerida para autorizar ventas.</p>
            </div>
            {error && <p className="text-sm text-[#E74C3C]">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className={styles.button.cancel}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className={styles.button.primary}>{saving ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <OwnerPinModal open={pinOpen} onOpenChange={setPinOpen} onSuccess={onPinSuccess} title="Acceso a Empleados" />
    </div>
  )
}
