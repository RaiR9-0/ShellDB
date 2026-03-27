"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader, CrudTable, CrudDialog, useCrud, styles, type ColumnConfig, type FieldConfig } from "@/components/crud"
import { OwnerPinModal } from "@/components/owner-pin"

interface Sucursal { _id: string; codigo: string; nombre: string; direccion: string; telefono: string }
type SucursalForm = { codigo: string; nombre: string; direccion: string; telefono: string }
const emptyForm: SucursalForm = { codigo: "", nombre: "", direccion: "", telefono: "" }

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const columns: ColumnConfig<Sucursal>[] = [
  { key: "codigo", label: "Codigo", className: "font-mono text-sm" },
  { key: "nombre", label: "Nombre", className: "font-semibold" },
  { key: "direccion", label: "Direccion" },
  { key: "telefono", label: "Telefono" },
]

const fields: FieldConfig[] = [
  { name: "codigo", label: "Codigo", colSpan: 2 },
  { name: "nombre", label: "Nombre", colSpan: 2 },
  { name: "direccion", label: "Direccion", colSpan: 2 },
  { name: "telefono", label: "Telefono", colSpan: 2 },
]

export default function SucursalesPage() {
  const crud = useCrud<Sucursal, SucursalForm>("/api/sucursales", emptyForm)
  const { data: pinData } = useSWR<{ configured: boolean }>("/api/owner-pin", fetcher)

  const [pinOpen, setPinOpen] = useState(false)
  const [pinVerified, setPinVerified] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  useEffect(() => {
    if (pinData?.configured && !pinVerified) setPinOpen(true)
  }, [pinData, pinVerified])

  function requirePin(action: () => void) {
    if (!pinData?.configured || pinVerified) { action(); return }
    setPendingAction(() => action)
    setPinOpen(true)
  }

  function onPinSuccess() {
    setPinVerified(true)
    if (pendingAction) { pendingAction(); setPendingAction(null) }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Sucursales"
        subtitle="Administración de sucursales — zona protegida"
        actionLabel="Agregar"
        onAction={() => requirePin(crud.openNew)}
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
          <CrudTable
            data={crud.data} columns={columns} isLoading={crud.isLoading}
            emptyMessage="No hay sucursales"
            onEdit={(s) => requirePin(() => crud.openEdit(s))}
            onDelete={(s) => requirePin(() => crud.handleDelete(s))}
          />
        </CardContent>
      </Card>
      <CrudDialog open={crud.open} onOpenChange={crud.setOpen} title="Sucursal" fields={fields} form={crud.form} onChange={crud.updateField} onSave={crud.handleSave} saving={crud.saving} editing={crud.editing} />
      <OwnerPinModal open={pinOpen} onOpenChange={setPinOpen} onSuccess={onPinSuccess} title="Acceso a Sucursales" />
    </div>
  )
}
