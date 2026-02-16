import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getUserDb } from "@/lib/mongodb"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const sucursal = searchParams.get("sucursal") || "SUC001"

  const db = await getUserDb(session.userDbName)

  const totalProductos = await db.collection("productos").countDocuments({})
  const totalEmpleados = await db.collection("empleados").countDocuments({ activo: true })

  // Stock calculations
  let stockTotal = 0
  const bajoStock: Array<{
    codigo: string
    nombre: string
    stock: number
    minimo: number
  }> = []

  const productos = await db.collection("productos").find({ activo: true }).toArray()
  for (const p of productos) {
    const stock = (p.stock_por_sucursal as Record<string, number>)?.[sucursal] ?? 0
    stockTotal += stock
    if (stock <= (p.stock_minimo ?? 10)) {
      bajoStock.push({
        codigo: p.codigo as string,
        nombre: p.nombre as string,
        stock,
        minimo: (p.stock_minimo as number) ?? 10,
      })
    }
  }

  // Today's sales
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const ventasHoy = await db
    .collection("ventas")
    .countDocuments({ sucursal_codigo: sucursal, fecha: { $gte: hoy } })

  const pipeline = [
    { $match: { sucursal_codigo: sucursal, fecha: { $gte: hoy } } },
    { $group: { _id: null, total: { $sum: "$total" } } },
  ]
  const agg = await db.collection("ventas").aggregate(pipeline).toArray()
  const totalVendidoHoy = agg[0]?.total ?? 0

  // Last 5 sales
  const ultimasVentas = await db
    .collection("ventas")
    .find({ sucursal_codigo: sucursal })
    .sort({ fecha: -1 })
    .limit(5)
    .toArray()

  return NextResponse.json({
    totalProductos,
    totalEmpleados,
    stockTotal,
    bajoStock,
    ventasHoy,
    totalVendidoHoy,
    ultimasVentas: ultimasVentas.map((v) => ({
      _id: String(v._id),
      fecha: v.fecha,
      items_count: v.items_count,
      total: v.total,
    })),
  })
}
