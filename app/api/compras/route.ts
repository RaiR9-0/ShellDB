import { withAuth, jsonResponse, errorResponse } from "@/lib/api-helpers"

export const GET = withAuth(async ({ db }, request) => {
  const { searchParams } = new URL(request.url)
  const sucursal = searchParams.get("sucursal") || "SUC001"

  const compras = await db
    .collection("compras")
    .find({ sucursal_codigo: sucursal })
    .sort({ fecha: -1 })
    .toArray()

  return jsonResponse(
    compras.map((c) => ({
      _id: String(c._id),
      fecha: c.fecha,
      total: c.total,
      items_count: c.items_count,
      proveedor_codigo: c.proveedor_codigo,
      proveedor_nombre: c.proveedor_nombre,
      sucursal_codigo: c.sucursal_codigo,
    }))
  )
})

export const POST = withAuth(async ({ session, db }, request) => {
  const { sucursal_codigo, proveedor_codigo, proveedor_nombre, items } = await request.json()

  if (!items || items.length === 0) {
    return errorResponse("No hay items en la compra")
  }

  const total = items.reduce(
    (sum: number, it: { precio_compra: number; cantidad: number }) =>
      sum + it.precio_compra * it.cantidad,
    0
  )

  const compraResult = await db.collection("compras").insertOne({
    sucursal_codigo,
    proveedor_codigo,
    proveedor_nombre,
    fecha: new Date(),
    total,
    items_count: items.length,
    usuario: session.user,
  })

  for (const item of items) {
    await db.collection("detalle_compras").insertOne({
      compra_id: compraResult.insertedId,
      producto_codigo: item.codigo,
      producto_nombre: item.nombre,
      cantidad: item.cantidad,
      precio_unitario: item.precio_compra,
      subtotal: item.precio_compra * item.cantidad,
    })

    await db.collection("productos").updateOne(
      { codigo: item.codigo },
      { $inc: { [`stock_por_sucursal.${sucursal_codigo}`]: item.cantidad } }
    )

    await db.collection("movimientos_inventario").insertOne({
      producto_codigo: item.codigo,
      producto_nombre: item.nombre,
      sucursal_codigo,
      tipo: "ENTRADA",
      motivo: "COMPRA",
      cantidad: item.cantidad,
      fecha: new Date(),
      referencia_id: compraResult.insertedId,
      usuario: session.user,
    })
  }

  return jsonResponse({ success: true, compra_id: String(compraResult.insertedId) })
})
