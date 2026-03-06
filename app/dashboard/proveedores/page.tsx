"use client"

import { Card, CardContent } from "@/components/ui/card"
import { PageHeader, CrudTable, CrudDialog, useCrud, styles, type ColumnConfig, type FieldConfig } from "@/components/crud"

interface Proveedor { _id: string; codigo: string; nombre: string; contacto: string; telefono: string; email: string }
type ProveedorForm = { codigo: string; nombre: string; contacto: string; telefono: string; email: string }
const emptyForm: ProveedorForm = { codigo: "", nombre: "", contacto: "", telefono: "", email: "" }

const columns: ColumnConfig<Proveedor>[] = [
  { key: "codigo", label: "Codigo", className: "font-mono text-sm" },
  { key: "nombre", label: "Nombre", className: "font-semibold" },
  { key: "contacto", label: "Contacto" },
  { key: "telefono", label: "Telefono" },
  { key: "email", label: "Email" },
]

const fields: FieldConfig[] = [
  { name: "codigo", label: "Codigo", colSpan: 2 },
  { name: "nombre", label: "Nombre", colSpan: 2 },
  { name: "contacto", label: "Contacto", colSpan: 2 },
  { name: "telefono", label: "Telefono" },
  { name: "email", label: "Email", type: "email" },
]

export default function ProveedoresPage() {
  const crud = useCrud<Proveedor, ProveedorForm>("/api/proveedores", emptyForm)

  return (
    <div className="p-6">
      <PageHeader title="Proveedores" subtitle="Directorio de proveedores" actionLabel="Agregar" onAction={crud.openNew} />
      <Card className={styles.table.wrapper}>
        <CardContent className="pt-5">
          <CrudTable data={crud.data} columns={columns} isLoading={crud.isLoading} emptyMessage="No hay proveedores" />
        </CardContent>
      </Card>
      <CrudDialog open={crud.open} onOpenChange={crud.setOpen} title="Proveedor" fields={fields} form={crud.form} onChange={crud.updateField} onSave={crud.handleSave} saving={crud.saving} editing={crud.editing} />
    </div>
  )
}
