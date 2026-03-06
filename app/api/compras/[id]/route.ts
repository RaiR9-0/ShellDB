import { ObjectId } from "mongodb"
import { withAuthParams, jsonResponse, errorResponse } from "@/lib/api-helpers"

export const GET = withAuthParams<{ id: string }>(async ({ db }, _request, { id }) => {
  let objectId: ObjectId
  try {
    objectId = new ObjectId(id)
  } catch {
    return errorResponse("ID invalido")
  }

  const compra = await db.collection("compras").findOne({ _id: objectId })
  if (!compra) {
    return errorResponse("Compra no encontrada", 404)
  }

  const detalles = await db
    .collection("detalle_compras")
    .find({ compra_id: objectId })
    .toArray()

  return jsonResponse({
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
})
