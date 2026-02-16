import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getSession } from "@/lib/auth"
import { getUserDb } from "@/lib/mongodb"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id } = await params
  const db = await getUserDb(session.userDbName)

  let objectId: ObjectId
  try {
    objectId = new ObjectId(id)
  } catch {
    return NextResponse.json({ error: "ID de venta invalido" }, { status: 400 })
  }

  const venta = await db.collection("ventas").findOne({ _id: objectId })
  if (!venta) {
    return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
  }

  const detalles = await db
    .collection("detalle_ventas")
    .find({ venta_id: objectId })
    .toArray()

  return NextResponse.json({
    _id: String(venta._id),
    fecha: venta.fecha,
    total: venta.total,
    items_count: venta.items_count,
    sucursal_codigo: venta.sucursal_codigo,
    usuario: venta.usuario,
    detalles: detalles.map((d) => ({
      producto_codigo: d.producto_codigo,
      producto_nombre: d.producto_nombre,
      cantidad: d.cantidad,
      precio_unitario: d.precio_unitario,
      subtotal: d.subtotal,
    })),
  })
}
