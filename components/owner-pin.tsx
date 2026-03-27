"use client"

import { useState, useCallback, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// ─── Modal de PIN del dueño ────────────────────────────────────────────────────

interface OwnerPinModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
  onCancel?: () => void
  title?: string
}

export function OwnerPinModal({ open, onOpenChange, onSuccess, onCancel, title = "Acción restringida" }: OwnerPinModalProps) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function verificar() {
    if (pin.length < 4) { setError("Ingresa tu PIN de dueño"); return }
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/owner-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "PIN incorrecto"); return }
      setPin("")
      onOpenChange(false)
      onSuccess()
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setPin(""); setError(""); onOpenChange(false)
    if (onCancel) onCancel()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm bg-white">
        <DialogHeader>
          <DialogTitle className="text-[#2C3E50] flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#DAA520]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-[#6B7280]">Esta acción requiere el PIN del dueño.</p>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#2C3E50]">PIN de Dueño</label>
            <Input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
              onKeyDown={(e) => e.key === "Enter" && verificar()}
              className="border-[#DAA520] text-center text-xl tracking-widest"
              autoFocus
            />
          </div>
          {error && (
            <div className="rounded-md bg-[#E74C3C]/10 border border-[#E74C3C]/30 px-3 py-2 text-sm text-[#E74C3C]">
              {error}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={handleClose} className="flex-1 border-[#D4A017] text-[#B8860B] cursor-pointer">
              Cancelar
            </Button>
            <Button onClick={verificar} disabled={loading || pin.length < 4}
              className="flex-1 bg-[#DAA520] hover:bg-[#B8860B] text-white font-bold cursor-pointer">
              {loading ? "Verificando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Modal de configuración de PIN ────────────────────────────────────────────

interface SetPinModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  hasPin: boolean
  onSuccess: () => void
}

export function SetPinModal({ open, onOpenChange, hasPin, onSuccess }: SetPinModalProps) {
  const [pinActual, setPinActual] = useState("")
  const [pinNuevo, setPinNuevo] = useState("")
  const [pinConfirm, setPinConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function guardar() {
    if (pinNuevo.length < 4) { setError("El PIN debe tener al menos 4 dígitos"); return }
    if (pinNuevo !== pinConfirm) { setError("Los PINs no coinciden"); return }
    if (hasPin && !pinActual) { setError("Ingresa el PIN actual"); return }
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/owner-pin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinNuevo, pinActual: hasPin ? pinActual : undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Error al guardar"); return }
      setPinActual(""); setPinNuevo(""); setPinConfirm("")
      onOpenChange(false)
      onSuccess()
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setPinActual(""); setPinNuevo(""); setPinConfirm(""); setError(""); onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm bg-white">
        <DialogHeader>
          <DialogTitle className="text-[#2C3E50] flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#DAA520]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            {hasPin ? "Cambiar PIN de Dueño" : "Configurar PIN de Dueño"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <p className="text-xs text-[#6B7280]">El PIN protege acciones administrativas: compras, empleados y sucursales.</p>
          {hasPin && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#2C3E50]">PIN Actual</label>
              <Input type="password" inputMode="numeric" placeholder="••••" value={pinActual}
                onChange={(e) => setPinActual(e.target.value.replace(/\D/g, "").slice(0, 8))}
                className="border-[#D4A017] text-center tracking-widest" />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#2C3E50]">Nuevo PIN</label>
            <Input type="password" inputMode="numeric" placeholder="Mínimo 4 dígitos" value={pinNuevo}
              onChange={(e) => setPinNuevo(e.target.value.replace(/\D/g, "").slice(0, 8))}
              className="border-[#D4A017] text-center tracking-widest" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#2C3E50]">Confirmar PIN</label>
            <Input type="password" inputMode="numeric" placeholder="Repite el PIN" value={pinConfirm}
              onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 8))}
              onKeyDown={(e) => e.key === "Enter" && guardar()}
              className="border-[#D4A017] text-center tracking-widest" />
          </div>
          {error && (
            <div className="rounded-md bg-[#E74C3C]/10 border border-[#E74C3C]/30 px-3 py-2 text-xs text-[#E74C3C]">{error}</div>
          )}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={handleClose} className="flex-1 border-[#D4A017] text-[#B8860B] cursor-pointer">Cancelar</Button>
            <Button onClick={guardar} disabled={loading}
              className="flex-1 bg-[#DAA520] hover:bg-[#B8860B] text-white font-bold cursor-pointer">
              {loading ? "Guardando..." : "Guardar PIN"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Hook para generar PDF de tickets ─────────────────────────────────────────

export interface TicketVenta {
  tipo: "venta"
  id: string
  fecha: Date
  sucursal: string
  empleado?: string
  items: { nombre: string; cantidad: number; precio: number; subtotal: number }[]
  total: number
}

export interface TicketCompra {
  tipo: "compra"
  id: string
  fecha: Date
  sucursal: string
  proveedor: string
  items: { nombre: string; cantidad: number; precio: number; subtotal: number }[]
  total: number
}

export type Ticket = TicketVenta | TicketCompra

export function generarPdfTicket(ticket: Ticket) {
  // Usamos la API de impresión del navegador con una ventana nueva
  const fecha = ticket.fecha instanceof Date ? ticket.fecha : new Date(ticket.fecha)
  const fechaStr = fecha.toLocaleString("es-MX", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  })

  const itemsHtml = ticket.items.map((item) => `
    <tr>
      <td style="padding:4px 2px;font-size:12px;border-bottom:1px dashed #eee;">${item.nombre}</td>
      <td style="padding:4px 2px;font-size:12px;text-align:center;border-bottom:1px dashed #eee;">${item.cantidad}</td>
      <td style="padding:4px 2px;font-size:12px;text-align:right;border-bottom:1px dashed #eee;">$${item.precio.toFixed(2)}</td>
      <td style="padding:4px 2px;font-size:12px;text-align:right;font-weight:bold;border-bottom:1px dashed #eee;">$${item.subtotal.toFixed(2)}</td>
    </tr>
  `).join("")

  const tipoLabel = ticket.tipo === "venta" ? "TICKET DE VENTA" : "TICKET DE COMPRA"
  const extraInfo = ticket.tipo === "venta"
    ? `<p style="margin:2px 0;font-size:11px;">Empleado: <b>${(ticket as TicketVenta).empleado || "—"}</b></p>`
    : `<p style="margin:2px 0;font-size:11px;">Proveedor: <b>${(ticket as TicketCompra).proveedor}</b></p>`

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${tipoLabel} - ${ticket.id}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 8px; color: #000; }
    .header { text-align:center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
    .logo { font-size:22px; font-weight:900; letter-spacing:2px; }
    .tipo { font-size:11px; font-weight:bold; letter-spacing:1px; margin-top:2px; }
    .info { margin-bottom:8px; font-size:11px; line-height:1.6; }
    table { width:100%; border-collapse:collapse; }
    th { font-size:10px; text-align:left; padding:3px 2px; border-bottom:2px solid #000; border-top:1px solid #000; }
    th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align:right; }
    th:nth-child(2) { text-align:center; }
    .total-row { border-top:2px solid #000; }
    .total-row td { padding:6px 2px; font-size:14px; font-weight:900; }
    .footer { text-align:center; margin-top:12px; font-size:10px; border-top:1px dashed #000; padding-top:8px; }
    @media print { body { width:80mm; } button { display:none; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">ShellDB</div>
    <div class="tipo">${tipoLabel}</div>
  </div>
  <div class="info">
    <p style="margin:2px 0;font-size:11px;">ID: <b>#${ticket.id.slice(-8).toUpperCase()}</b></p>
    <p style="margin:2px 0;font-size:11px;">Fecha: <b>${fechaStr}</b></p>
    <p style="margin:2px 0;font-size:11px;">Sucursal: <b>${ticket.sucursal}</b></p>
    ${extraInfo}
  </div>
  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th style="text-align:center;">Cant.</th>
        <th style="text-align:right;">P.U.</th>
        <th style="text-align:right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="3" style="text-align:right;">TOTAL:</td>
        <td style="text-align:right;">$${ticket.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
      </tr>
    </tfoot>
  </table>
  <div class="footer">
    <p>¡Gracias por su preferencia!</p>
    <p style="margin-top:4px;">ShellDB · Sistema de gestión</p>
  </div>
  <div style="text-align:center;margin-top:12px;">
    <button onclick="window.print();window.close();"
      style="background:#DAA520;color:white;border:none;padding:8px 24px;font-size:13px;font-weight:bold;border-radius:6px;cursor:pointer;">
      🖨️ Imprimir
    </button>
  </div>
</body>
</html>`

  const ventana = window.open("", "_blank", "width=400,height=600")
  if (ventana) {
    ventana.document.write(html)
    ventana.document.close()
  }
}
