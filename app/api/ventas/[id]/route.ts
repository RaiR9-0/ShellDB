import { ObjectId } from "mongodb"
import { withAuthParams, jsonResponse, errorResponse } from "@/lib/api-helpers"

export const GET = withAuthParams<{ id: string }>(async ({ db }, _request, { id }) => {
  let objectId: ObjectId
  try {
    objectId = new ObjectId(id)
  } catch {
    return errorResponse("ID de venta invalido")
  }

  const venta = await db.collection("ventas").findOne({ _id: objectId })
  if (!venta) {
    return errorResponse("Venta no encontrada", 404)
  }

  const detalles = await db
    .collection("detalle_ventas")
    .find({ venta_id: objectId })
    .toArray()

  return jsonResponse({
    _id: String(venta._id),
    fecha: venta.fecha,
    total: venta.total,
    items_count: venta.items_count,
    sucursal_codigo: venta.sucursal_codigo,
    usuario: venta.usuario,
    empleado_codigo: venta.empleado_codigo || null,
    empleado_nombre: venta.empleado_nombre || null,
    detalles: detalles.map((d) => ({
      producto_codigo: d.producto_codigo,
      producto_nombre: d.producto_nombre,
      cantidad: d.cantidad,
      precio_unitario: d.precio_unitario,
      subtotal: d.subtotal,
    })),
  })
})
