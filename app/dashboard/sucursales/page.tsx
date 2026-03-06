"use client"

import { Card, CardContent } from "@/components/ui/card"
import { PageHeader, CrudTable, CrudDialog, useCrud, styles, type ColumnConfig, type FieldConfig } from "@/components/crud"

interface Sucursal { _id: string; codigo: string; nombre: string; direccion: string; telefono: string }
type SucursalForm = { codigo: string; nombre: string; direccion: string; telefono: string }
const emptyForm: SucursalForm = { codigo: "", nombre: "", direccion: "", telefono: "" }

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

  return (
    <div className="p-6">
      <PageHeader title="Sucursales" subtitle="Administracion de sucursales" actionLabel="Agregar" onAction={crud.openNew} />
      <Card className={styles.table.wrapper}>
        <CardContent className="pt-5">
          <CrudTable data={crud.data} columns={columns} isLoading={crud.isLoading} emptyMessage="No hay sucursales" />
        </CardContent>
      </Card>
      <CrudDialog open={crud.open} onOpenChange={crud.setOpen} title="Sucursal" fields={fields} form={crud.form} onChange={crud.updateField} onSave={crud.handleSave} saving={crud.saving} editing={crud.editing} />
    </div>
  )
}
