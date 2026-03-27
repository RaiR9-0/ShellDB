"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SetPinModal } from "@/components/owner-pin"
import { useDashboard } from "../layout"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AjustesPage() {
  const { session } = useDashboard()
  const { data: pinData, mutate } = useSWR<{ configured: boolean }>("/api/owner-pin", fetcher)
  const [setPinOpen, setSetPinOpen] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")

  const hasPin = pinData?.configured ?? false

  function onPinSuccess() {
    mutate()
    setSuccessMsg(hasPin ? "PIN actualizado correctamente." : "PIN configurado correctamente.")
    setTimeout(() => setSuccessMsg(""), 4000)
  }

  return (
    <div className="p-6 max-w-2xl">
      {/* Header */}
      <div className="bg-[#DAA520] rounded-lg px-6 py-4 mb-6">
        <h1 className="text-xl font-bold text-white">Ajustes</h1>
        <p className="text-sm text-white/80">Configuración de la cuenta y seguridad</p>
      </div>

      {successMsg && (
        <div className="rounded-md bg-[#27AE60]/10 border border-[#27AE60]/40 px-4 py-3 text-sm text-[#27AE60] mb-4">
          ✅ {successMsg}
        </div>
      )}

      {/* Info cuenta */}
      <Card className="border-[#D4A017]/30 bg-white mb-4">
        <CardContent className="pt-5">
          <h2 className="text-sm font-bold text-[#2C3E50] mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#DAA520]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Cuenta
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[#6B7280] text-xs">Usuario</p>
              <p className="font-bold text-[#2C3E50]">{session?.username}</p>
            </div>
            <div>
              <p className="text-[#6B7280] text-xs">Base de datos</p>
              <p className="font-mono font-bold text-[#2C3E50] text-xs">{session?.userDbName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PIN de Dueño */}
      <Card className="border-[#D4A017]/30 bg-white">
        <CardContent className="pt-5">
          <h2 className="text-sm font-bold text-[#2C3E50] mb-1 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#DAA520]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            PIN de Dueño
          </h2>
          <p className="text-xs text-[#6B7280] mb-4">
            El PIN protege acciones administrativas: registrar compras, editar empleados y agregar sucursales. Los empleados no pueden realizar estas acciones sin el PIN.
          </p>

          <div className="flex items-center justify-between p-3 rounded-lg border border-[#D4A017]/30 bg-[#FCF3CF]">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${hasPin ? "bg-[#27AE60]" : "bg-[#E74C3C]"}`} />
              <div>
                <p className="text-sm font-semibold text-[#2C3E50]">
                  {hasPin ? "PIN configurado" : "PIN no configurado"}
                </p>
                <p className="text-xs text-[#6B7280]">
                  {hasPin
                    ? "Las acciones administrativas están protegidas."
                    : "Sin PIN, cualquier usuario puede realizar acciones administrativas."}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setSetPinOpen(true)}
              className="bg-[#DAA520] hover:bg-[#B8860B] text-white font-bold text-sm cursor-pointer shrink-0"
            >
              {hasPin ? "Cambiar PIN" : "Configurar PIN"}
            </Button>
          </div>

          {/* Qué protege */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { icon: "🛒", label: "Nueva Compra" },
              { icon: "👥", label: "Empleados" },
              { icon: "🏪", label: "Sucursales" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#D4A017]/20 text-xs">
                <span>{item.icon}</span>
                <span className="text-[#2C3E50] font-medium">{item.label}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#DAA520] ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <SetPinModal
        open={setPinOpen}
        onOpenChange={setSetPinOpen}
        hasPin={hasPin}
        onSuccess={onPinSuccess}
      />
    </div>
  )
}
