import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getUserDb } from "@/lib/mongodb"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const sucursal = searchParams.get("sucursal") || "SUC001"

  const db = await getUserDb(session.userDbName)
  const productos = await db.collection("productos").find({ activo: true }).toArray()
  const categorias = await db.collection("categorias").find({}).toArray()

  const catMap: Record<string, string> = {}
  for (const c of categorias) catMap[c.codigo as string] = c.nombre as string

  return NextResponse.json(
    productos.map((p) => ({
      _id: String(p._id),
      codigo: p.codigo,
      nombre: p.nombre,
      categoria: catMap[p.categoria_codigo as string] || p.categoria_codigo,
      categoria_codigo: p.categoria_codigo,
      precio_compra: p.precio_compra,
      precio_venta: p.precio_venta,
      stock: (p.stock_por_sucursal as Record<string, number>)?.[sucursal] ?? 0,
      stock_minimo: p.stock_minimo,
    }))
  )
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const body = await request.json()
  const db = await getUserDb(session.userDbName)

  // Get all sucursales for initial stock
  const sucursales = await db.collection("sucursales").find({ activa: true }).toArray()
  const stockPorSucursal: Record<string, number> = {}
  for (const s of sucursales) {
    stockPorSucursal[s.codigo as string] = body.stock_inicial ?? 0
  }

  await db.collection("productos").insertOne({
    codigo: body.codigo,
    nombre: body.nombre,
    categoria_codigo: body.categoria_codigo,
    precio_compra: Number(body.precio_compra),
    precio_venta: Number(body.precio_venta),
    stock_por_sucursal: stockPorSucursal,
    stock_minimo: Number(body.stock_minimo) || 10,
    activo: true,
  })

  return NextResponse.json({ success: true })
}
