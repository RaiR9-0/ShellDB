import bcrypt from "bcryptjs"
import { withAuth, jsonResponse, errorResponse } from "@/lib/api-helpers"

export const GET = withAuth(async ({ db }, request) => {
  const { searchParams } = new URL(request.url)
  const sucursal = searchParams.get("sucursal") || "SUC001"

  const ventas = await db
    .collection("ventas")
    .find({ sucursal_codigo: sucursal })
    .sort({ fecha: -1 })
    .toArray()

  return jsonResponse(
    ventas.map((v) => ({
      _id: String(v._id),
      fecha: v.fecha,
      total: v.total,
      items_count: v.items_count,
      sucursal_codigo: v.sucursal_codigo,
      empleado_nombre: v.empleado_nombre || null,
      empleado_codigo: v.empleado_codigo || null,
    }))
  )
})

export const POST = withAuth(async ({ session, db }, request) => {
  const { sucursal_codigo, items, empleado_codigo, empleado_clave } = await request.json()

  if (!items || items.length === 0) {
    return errorResponse("No hay items en la venta")
  }

  // Validar empleado
  if (!empleado_codigo || !empleado_clave) {
    return errorResponse("Se requiere codigo y clave de empleado para procesar la venta")
  }

  const empleado = await db.collection("empleados").findOne({
    codigo: empleado_codigo,
    activo: true,
  })

  if (!empleado) {
    return errorResponse("Empleado no encontrado o inactivo", 401)
  }

  if (!empleado.clave) {
    return errorResponse("Este empleado no tiene clave asignada. Contacte al administrador.")
  }

  const claveValida = await bcrypt.compare(empleado_clave, empleado.clave as string)
  if (!claveValida) {
    return errorResponse("Clave de empleado incorrecta", 401)
  }

  // Validar stock
  for (const item of items) {
    const prod = await db.collection("productos").findOne({ codigo: item.codigo })
    if (!prod) {
      return errorResponse(`Producto ${item.codigo} no encontrado`)
    }
    const stock = (prod.stock_por_sucursal as Record<string, number>)?.[sucursal_codigo] ?? 0
    if (stock < item.cantidad) {
      return errorResponse(`Stock insuficiente para ${prod.nombre}. Disponible: ${stock}, Solicitado: ${item.cantidad}`)
    }
  }

  const total = items.reduce(
    (sum: number, it: { precio_venta: number; cantidad: number }) =>
      sum + it.precio_venta * it.cantidad,
    0
  )

  // Crear venta
  const ventaResult = await db.collection("ventas").insertOne({
    sucursal_codigo,
    fecha: new Date(),
    total,
    items_count: items.length,
    usuario: session.user,
    empleado_codigo: empleado.codigo,
    empleado_nombre: empleado.nombre,
  })

  // Crear detalles y actualizar stock
  for (const item of items) {
    await db.collection("detalle_ventas").insertOne({
      venta_id: ventaResult.insertedId,
      producto_codigo: item.codigo,
      producto_nombre: item.nombre,
      cantidad: item.cantidad,
      precio_unitario: item.precio_venta,
      subtotal: item.precio_venta * item.cantidad,
    })

    await db.collection("productos").updateOne(
      { codigo: item.codigo },
      { $inc: { [`stock_por_sucursal.${sucursal_codigo}`]: -item.cantidad } }
    )

    await db.collection("movimientos_inventario").insertOne({
      producto_codigo: item.codigo,
      producto_nombre: item.nombre,
      sucursal_codigo,
      tipo: "SALIDA",
      motivo: "VENTA",
      cantidad: item.cantidad,
      fecha: new Date(),
      referencia_id: ventaResult.insertedId,
      usuario: session.user,
      empleado_codigo: empleado.codigo,
      empleado_nombre: empleado.nombre,
    })
  }

  return jsonResponse({ success: true, venta_id: String(ventaResult.insertedId) })
})
