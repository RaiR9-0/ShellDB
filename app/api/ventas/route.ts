import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getUserDb } from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const sucursal = searchParams.get("sucursal") || "SUC001"

  const db = await getUserDb(session.userDbName)
  const ventas = await db
    .collection("ventas")
    .find({ sucursal_codigo: sucursal })
    .sort({ fecha: -1 })
    .toArray()

  return NextResponse.json(
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
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { sucursal_codigo, items, empleado_codigo, empleado_clave } = await request.json()

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "No hay items en la venta" }, { status: 400 })
  }

  // --- Validar empleado ---
  if (!empleado_codigo || !empleado_clave) {
    return NextResponse.json(
      { error: "Se requiere codigo y clave de empleado para procesar la venta" },
      { status: 400 }
    )
  }

  const db = await getUserDb(session.userDbName)

  const empleado = await db.collection("empleados").findOne({
    codigo: empleado_codigo,
    activo: true,
  })

  if (!empleado) {
    return NextResponse.json(
      { error: "Empleado no encontrado o inactivo" },
      { status: 401 }
    )
  }

  if (!empleado.clave) {
    return NextResponse.json(
      { error: "Este empleado no tiene clave asignada. Contacte al administrador." },
      { status: 400 }
    )
  }

  const claveValida = await bcrypt.compare(empleado_clave, empleado.clave as string)
  if (!claveValida) {
    return NextResponse.json(
      { error: "Clave de empleado incorrecta" },
      { status: 401 }
    )
  }

  // --- Validar stock ---
  for (const item of items) {
    const prod = await db.collection("productos").findOne({ codigo: item.codigo })
    if (!prod) {
      return NextResponse.json(
        { error: `Producto ${item.codigo} no encontrado` },
        { status: 400 }
      )
    }
    const stock =
      (prod.stock_por_sucursal as Record<string, number>)?.[sucursal_codigo] ?? 0
    if (stock < item.cantidad) {
      return NextResponse.json(
        {
          error: `Stock insuficiente para ${prod.nombre}. Disponible: ${stock}, Solicitado: ${item.cantidad}`,
        },
        { status: 400 }
      )
    }
  }

  const total = items.reduce(
    (sum: number, it: { precio_venta: number; cantidad: number }) =>
      sum + it.precio_venta * it.cantidad,
    0
  )

  // --- Crear venta con datos de empleado ---
  const ventaResult = await db.collection("ventas").insertOne({
    sucursal_codigo,
    fecha: new Date(),
    total,
    items_count: items.length,
    usuario: session.username,
    empleado_codigo: empleado.codigo,
    empleado_nombre: empleado.nombre,
  })

  // Create details and update stock
  for (const item of items) {
    await db.collection("detalle_ventas").insertOne({
      venta_id: ventaResult.insertedId,
      producto_codigo: item.codigo,
      producto_nombre: item.nombre,
      cantidad: item.cantidad,
      precio_unitario: item.precio_venta,
      subtotal: item.precio_venta * item.cantidad,
    })

    // DECREASE stock
    await db.collection("productos").updateOne(
      { codigo: item.codigo },
      { $inc: { [`stock_por_sucursal.${sucursal_codigo}`]: -item.cantidad } }
    )

    // Record inventory movement
    await db.collection("movimientos_inventario").insertOne({
      producto_codigo: item.codigo,
      producto_nombre: item.nombre,
      sucursal_codigo,
      tipo: "SALIDA",
      motivo: "VENTA",
      cantidad: item.cantidad,
      fecha: new Date(),
      referencia_id: ventaResult.insertedId,
      usuario: session.username,
      empleado_codigo: empleado.codigo,
      empleado_nombre: empleado.nombre,
    })
  }

  return NextResponse.json({ success: true, venta_id: String(ventaResult.insertedId) })
}
