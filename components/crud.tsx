"use client"

import React from "react"
import { useState, useCallback } from "react"
import useSWR, { mutate } from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

// ============================================
// ESTILOS REUTILIZABLES
// ============================================
export const styles = {
  table: {
    wrapper: "rounded-md border border-[#D4A017]/30 overflow-auto",
    header: "bg-[#FCF3CF]",
    headerCell: "text-[#2C3E50] font-bold",
    row: "hover:bg-[#FCF3CF]/50",
    cell: "text-[#2C3E50]",
    empty: "text-center text-[#6B7280] py-8",
  },
  button: {
    primary: "bg-[#D4A017] hover:bg-[#B8860B] text-white cursor-pointer",
    success: "bg-[#27AE60] hover:bg-[#219A52] text-white font-bold cursor-pointer",
    save: "bg-[#B8860B] text-white hover:bg-[#DAA520] cursor-pointer",
    cancel: "border-[#D4A017] text-[#2C3E50] cursor-pointer",
    edit: "text-xs border-[#3498DB] text-[#3498DB] hover:bg-[#3498DB] hover:text-white cursor-pointer",
    delete: "text-xs border-[#E74C3C] text-[#E74C3C] hover:bg-[#E74C3C] hover:text-white cursor-pointer",
    detail: "text-xs border-[#B8860B] text-[#B8860B] hover:bg-[#B8860B] hover:text-white cursor-pointer",
  },
  input: {
    default: "border-[#D4A017] bg-white text-[#2C3E50]",
    select: "w-full rounded-md border border-[#D4A017] bg-white text-[#2C3E50] px-3 py-2 text-sm",
  },
  dialog: { content: "bg-white border-[#D4A017]", title: "text-[#2C3E50]" },
  header: {
    wrapper: "bg-[#DAA520] rounded-lg px-6 py-4 mb-6 flex items-center justify-between",
    title: "text-xl font-bold text-white",
    subtitle: "text-sm text-white/80",
  },
  label: "text-[#2C3E50] font-semibold text-sm",
  colors: {
    primary: "#D4A017", success: "#27AE60", error: "#E74C3C",
    textDark: "#2C3E50", textMuted: "#6B7280", bgLight: "#FCF3CF",
  },
} as const

// ============================================
// TIPOS
// ============================================
export interface ColumnConfig<T> {
  key: keyof T | string
  label: string
  align?: "left" | "center" | "right"
  format?: (value: unknown, row: T) => React.ReactNode
  className?: string
}

export type FieldType = "text" | "number" | "email" | "password" | "select" | "textarea"

export interface FieldConfig {
  name: string
  label: string
  type?: FieldType
  placeholder?: string
  required?: boolean
  disabled?: boolean | ((editing: boolean) => boolean)
  options?: { value: string; label: string }[]
  colSpan?: 1 | 2
  hint?: string
}

// ============================================
// PAGE HEADER
// ============================================
interface PageHeaderProps {
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
  actionExtra?: React.ReactNode
}

export function PageHeader({ title, subtitle, actionLabel, onAction, actionExtra }: PageHeaderProps) {
  return (
    <div className={styles.header.wrapper}>
      <div>
        <h1 className={styles.header.title}>{title}</h1>
        {subtitle && <p className={styles.header.subtitle}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actionExtra}
        {actionLabel && onAction && (
          <Button onClick={onAction} className={styles.button.success}>
            + {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

// ============================================
// CRUD TABLE
// ============================================
interface CrudTableProps<T> {
  data: T[] | undefined
  columns: ColumnConfig<T>[]
  isLoading?: boolean
  emptyMessage?: string
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  onDetail?: (item: T) => void
  getRowKey?: (item: T) => string
}

export function CrudTable<T extends { _id: string }>({
  data, columns, isLoading, emptyMessage = "No hay registros",
  onEdit, onDelete, onDetail, getRowKey = (item) => item._id,
}: CrudTableProps<T>) {
  const hasActions = onEdit || onDelete || onDetail

  return (
    <div className={styles.table.wrapper}>
      <Table>
        <TableHeader>
          <TableRow className={styles.table.header}>
            {columns.map((col) => (
              <TableHead key={String(col.key)} className={`${styles.table.headerCell} ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""}`}>
                {col.label}
              </TableHead>
            ))}
            {hasActions && <TableHead className={`${styles.table.headerCell} text-center`}>Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={columns.length + (hasActions ? 1 : 0)} className={styles.table.empty}>Cargando...</TableCell></TableRow>
          ) : !data?.length ? (
            <TableRow><TableCell colSpan={columns.length + (hasActions ? 1 : 0)} className={styles.table.empty}>{emptyMessage}</TableCell></TableRow>
          ) : data.map((item) => (
            <TableRow key={getRowKey(item)} className={styles.table.row}>
              {columns.map((col) => {
                const value = (item as Record<string, unknown>)[col.key as string]
                return (
                  <TableCell key={String(col.key)} className={`${styles.table.cell} ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""}`}>
                    {col.format ? col.format(value, item) : value as React.ReactNode}
                  </TableCell>
                )
              })}
              {hasActions && (
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {onDetail && <Button variant="outline" size="sm" onClick={() => onDetail(item)} className={styles.button.detail}>Ver</Button>}
                    {onEdit && <Button variant="outline" size="sm" onClick={() => onEdit(item)} className={styles.button.edit}>Editar</Button>}
                    {onDelete && <Button variant="outline" size="sm" onClick={() => onDelete(item)} className={styles.button.delete}>Eliminar</Button>}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ============================================
// CRUD DIALOG
// ============================================
interface CrudDialogProps<F> {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  fields: FieldConfig[]
  form: F
  onChange: (field: keyof F, value: string) => void
  onSave: () => void
  saving?: boolean
  editing?: boolean
  error?: string
}

export function CrudDialog<F extends Record<string, unknown>>({
  open, onOpenChange, title, fields, form, onChange, onSave, saving, editing, error,
}: CrudDialogProps<F>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialog.content}>
        <DialogHeader><DialogTitle className={styles.dialog.title}>{editing ? `Editar ${title}` : `Nuevo ${title}`}</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3">
          {fields.map((field, i) => {
            const next = fields[i + 1]
            if (field.colSpan === 2 || !next || next.colSpan === 2 || i % 2 === 1) return null
            return (
              <div key={field.name} className="grid grid-cols-2 gap-3">
                <FieldInput field={field} form={form} onChange={onChange} editing={!!editing} />
                {next && <FieldInput field={next} form={form} onChange={onChange} editing={!!editing} />}
              </div>
            )
          })}
          {fields.filter((f, i) => f.colSpan === 2 || (i % 2 === 0 && (!fields[i + 1] || fields[i + 1].colSpan === 2))).map((field) => (
            <FieldInput key={field.name} field={field} form={form} onChange={onChange} editing={!!editing} />
          ))}
        </div>
        {error && <p className="text-sm text-[#E74C3C]">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className={styles.button.cancel}>Cancelar</Button>
          <Button onClick={onSave} disabled={saving} className={styles.button.save}>{saving ? "Guardando..." : "Guardar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FieldInput<F extends Record<string, unknown>>({ field, form, onChange, editing }: {
  field: FieldConfig; form: F; onChange: (f: keyof F, v: string) => void; editing: boolean
}) {
  const value = form[field.name] as string
  const isDisabled = typeof field.disabled === "function" ? field.disabled(editing) : field.disabled

  return (
    <div className="flex flex-col gap-1.5">
      <Label className={styles.label}>{field.label}{field.required && !editing && <span className="text-[#E74C3C]"> *</span>}</Label>
      {field.type === "select" && field.options ? (
        <select value={value} onChange={(e) => onChange(field.name as keyof F, e.target.value)} disabled={isDisabled} className={styles.input.select}>
          {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <Input type={field.type || "text"} value={value} onChange={(e) => onChange(field.name as keyof F, e.target.value)} disabled={isDisabled} placeholder={field.placeholder} className={styles.input.default} />
      )}
      {field.hint && <p className="text-xs text-[#7F8C8D]">{field.hint}</p>}
    </div>
  )
}

// ============================================
// HISTORIAL DETAIL DIALOG
// ============================================
interface HistorialDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loading: boolean
  title: string
  id?: string
  metadata?: { label: string; value: string }[]
  detalles?: { producto_codigo: string; producto_nombre: string; cantidad: number; precio_unitario: number; subtotal: number }[]
  total?: number
}

export function HistorialDetailDialog({ open, onOpenChange, loading, title, id, metadata = [], detalles = [], total = 0 }: HistorialDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${styles.dialog.content} max-w-2xl`}>
        <DialogHeader><DialogTitle className={styles.dialog.title}>{title} {id ? `#${id}` : ""}</DialogTitle></DialogHeader>
        {loading ? (
          <p className="text-center text-[#6B7280] py-8">Cargando detalle...</p>
        ) : detalles.length > 0 ? (
          <div className="flex flex-col gap-4">
            {metadata.length > 0 && (
              <div className="grid grid-cols-3 gap-4 text-sm">
                {metadata.map((m, i) => (
                  <div key={i} className="bg-[#FCF3CF] rounded-md p-3">
                    <p className="text-[#6B7280] text-xs">{m.label}</p>
                    <p className="font-semibold text-[#2C3E50]">{m.value}</p>
                  </div>
                ))}
              </div>
            )}
            <div className={styles.table.wrapper}>
              <Table>
                <TableHeader>
                  <TableRow className={styles.table.header}>
                    <TableHead className={styles.table.headerCell}>Codigo</TableHead>
                    <TableHead className={styles.table.headerCell}>Producto</TableHead>
                    <TableHead className={`${styles.table.headerCell} text-right`}>Cant</TableHead>
                    <TableHead className={`${styles.table.headerCell} text-right`}>P.Unit</TableHead>
                    <TableHead className={`${styles.table.headerCell} text-right`}>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detalles.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm">{d.producto_codigo}</TableCell>
                      <TableCell>{d.producto_nombre}</TableCell>
                      <TableCell className="text-right">{d.cantidad}</TableCell>
                      <TableCell className="text-right">${d.precio_unitario.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold text-[#D4A017]">${d.subtotal.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end p-3 bg-[#FCF3CF] rounded-md">
              <div className="text-right">
                <p className="text-xs text-[#6B7280]">TOTAL</p>
                <p className="text-2xl font-bold text-[#D4A017]">${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-[#E74C3C] py-4">Error al cargar detalle</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// HOOKS
// ============================================
const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useCrud<T extends { _id: string }, F extends Record<string, unknown>>(
  apiUrl: string, emptyForm: F, codeField: keyof T = "codigo" as keyof T
) {
  const { data, isLoading } = useSWR<T[]>(apiUrl, fetcher)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<F>(emptyForm)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const updateField = useCallback((field: keyof F, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const openNew = useCallback(() => {
    setForm(emptyForm)
    setEditing(null)
    setError("")
    setOpen(true)
  }, [emptyForm])

  const openEdit = useCallback((item: T) => {
    const formData = { ...emptyForm }
    for (const key in emptyForm) {
      if (key in item) (formData as Record<string, unknown>)[key] = String((item as Record<string, unknown>)[key] ?? "")
    }
    setForm(formData)
    setEditing(item[codeField] as string)
    setError("")
    setOpen(true)
  }, [emptyForm, codeField])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setError("")
    try {
      const res = await fetch(editing ? `${apiUrl}/${editing}` : apiUrl, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al guardar")
      mutate(apiUrl)
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }, [apiUrl, editing, form])

  const handleDelete = useCallback(async (code: string) => {
    if (!confirm("Eliminar este registro?")) return
    await fetch(`${apiUrl}/${code}`, { method: "DELETE" })
    mutate(apiUrl)
  }, [apiUrl])

  return { data, isLoading, open, setOpen, form, setForm, updateField, editing: !!editing, openNew, openEdit, saving, handleSave, handleDelete, error, setError }
}

export function useHistorial<T extends { _id: string }, D>(apiUrl: string, detailUrl: string) {
  const { data, isLoading } = useSWR<T[]>(apiUrl, fetcher)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<D | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const verDetalle = useCallback(async (id: string) => {
    setLoadingDetail(true)
    setDetailOpen(true)
    try {
      const res = await fetch(`${detailUrl}/${id}`)
      setDetail(await res.json())
    } catch {
      setDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }, [detailUrl])

  return { data, isLoading, detailOpen, setDetailOpen, detail, loadingDetail, verDetalle }
}
