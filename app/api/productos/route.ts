import { withAuth, jsonResponse, successResponse, buildCodeMap, insertDoc } from "@/lib/api-helpers"

export const GET = withAuth(async ({ db }, request) => {
  const { searchParams } = new URL(request.url)
  const sucursal = searchParams.get("sucursal") || "SUC001"

  const [productos, catMap] = await Promise.all([
    db.collection("productos").find({ activo: true }).toArray(),
    buildCodeMap(db, "categorias"),
  ])

  return jsonResponse(
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
})

export const POST = withAuth(async ({ db }, request) => {
  const body = await request.json()

  // Get all sucursales for initial stock
  const sucursales = await db.collection("sucursales").find({ activa: true }).toArray()
  const stockPorSucursal: Record<string, number> = {}
  for (const s of sucursales) {
    stockPorSucursal[s.codigo as string] = body.stock_inicial ?? 0
  }

  await insertDoc(db, "productos", {
    codigo: body.codigo,
    nombre: body.nombre,
    categoria_codigo: body.categoria_codigo,
    precio_compra: Number(body.precio_compra),
    precio_venta: Number(body.precio_venta),
    stock_por_sucursal: stockPorSucursal,
    stock_minimo: Number(body.stock_minimo) || 10,
    activo: true,
  })

  return successResponse()
})
