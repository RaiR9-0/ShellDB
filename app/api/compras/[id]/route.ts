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
    return NextResponse.json({ error: "ID invalido" }, { status: 400 })
  }

  const compra = await db.collection("compras").findOne({ _id: objectId })
  if (!compra) {
    return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 })
  }

  const detalles = await db
    .collection("detalle_compras")
    .find({ compra_id: objectId })
    .toArray()

  return NextResponse.json({
    _id: String(compra._id),
    fecha: compra.fecha,
    total: compra.total,
    items_count: compra.items_count,
    proveedor_codigo: compra.proveedor_codigo,
    proveedor_nombre: compra.proveedor_nombre,
    sucursal_codigo: compra.sucursal_codigo,
    usuario: compra.usuario,
    detalles: detalles.map((d) => ({
      producto_codigo: d.producto_codigo,
      producto_nombre: d.producto_nombre,
      cantidad: d.cantidad,
      precio_unitario: d.precio_unitario,
      subtotal: d.subtotal,
    })),
  })
}
