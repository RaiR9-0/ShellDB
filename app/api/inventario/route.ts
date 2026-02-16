import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getUserDb } from "@/lib/mongodb"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const sucursal = searchParams.get("sucursal") || "SUC001"

  const db = await getUserDb(session.userDbName)
  const movimientos = await db
    .collection("movimientos_inventario")
    .find({ sucursal_codigo: sucursal })
    .sort({ fecha: -1 })
    .limit(100)
    .toArray()

  return NextResponse.json(
    movimientos.map((m) => ({
      _id: String(m._id),
      producto_codigo: m.producto_codigo,
      producto_nombre: m.producto_nombre,
      sucursal_codigo: m.sucursal_codigo,
      tipo: m.tipo,
      motivo: m.motivo,
      cantidad: m.cantidad,
      fecha: m.fecha,
      usuario: m.usuario,
    }))
  )
}
