import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getUserDb } from "@/lib/mongodb"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const db = await getUserDb(session.userDbName)

  // Fetch all data for Spark-style processing
  const [ventas, sucursales, productos, detalleVentas] = await Promise.all([
    db.collection("ventas").find({}).sort({ fecha: -1 }).toArray(),
    db.collection("sucursales").find({ activa: true }).toArray(),
    db.collection("productos").find({ activo: true }).toArray(),
    db.collection("detalle_ventas").find({}).toArray(),
  ])

  // === SPARK-STYLE PROCESSING ===

  // 1. Ventas por sucursal (GroupBy + Agg)
  const ventasPorSucursal = sucursales.map((s) => {
    const ventasSuc = ventas.filter((v) => v.sucursal_codigo === s.codigo)
    const totalMonto = ventasSuc.reduce((sum, v) => sum + (v.total ?? 0), 0)
    const totalTransacciones = ventasSuc.length
    const promedio = totalTransacciones > 0 ? totalMonto / totalTransacciones : 0
    return {
      sucursal: s.nombre,
      codigo: s.codigo,
      totalMonto: Math.round(totalMonto * 100) / 100,
      totalTransacciones,
      promedio: Math.round(promedio * 100) / 100,
    }
  }).sort((a, b) => b.totalMonto - a.totalMonto)

  // 2. Ventas por mes (Window function style)
  const ventasPorMes: Record<string, Record<string, number>> = {}
  ventas.forEach((v) => {
    const fecha = new Date(v.fecha)
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`
    const suc = v.sucursal_codigo as string
    if (!ventasPorMes[mes]) ventasPorMes[mes] = {}
    ventasPorMes[mes][suc] = (ventasPorMes[mes][suc] ?? 0) + (v.total ?? 0)
  })

  const meses = Object.keys(ventasPorMes).sort()
  const sucursalesCodigos = sucursales.map((s) => s.codigo as string)
  const seriesMensuales = meses.slice(-12).map((mes) => {
    const entry: Record<string, string | number> = { mes }
    sucursalesCodigos.forEach((cod) => {
      const suc = sucursales.find((s) => s.codigo === cod)
      entry[suc?.nombre ?? cod] = Math.round((ventasPorMes[mes]?.[cod] ?? 0) * 100) / 100
    })
    return entry
  })

  // 3. Top productos por ventas (JOIN detalle_ventas + productos)
  const productoVentas: Record<string, { nombre: string; cantidad: number; monto: number; sucursales: Set<string> }> = {}
  detalleVentas.forEach((d) => {
    const cod = d.producto_codigo as string
    const ventaRef = ventas.find((v) => String(v._id) === String(d.venta_id))
    if (!productoVentas[cod]) {
      productoVentas[cod] = { nombre: d.producto_nombre as string, cantidad: 0, monto: 0, sucursales: new Set() }
    }
    productoVentas[cod].cantidad += d.cantidad as number
    productoVentas[cod].monto += d.subtotal as number
    if (ventaRef?.sucursal_codigo) productoVentas[cod].sucursales.add(ventaRef.sucursal_codigo as string)
  })

  const topProductos = Object.entries(productoVentas)
    .map(([codigo, data]) => ({
      codigo,
      nombre: data.nombre,
      cantidadVendida: data.cantidad,
      montoTotal: Math.round(data.monto * 100) / 100,
      sucursalesCount: data.sucursales.size,
    }))
    .sort((a, b) => b.montoTotal - a.montoTotal)
    .slice(0, 10)

  // 4. Análisis temporal - ventas por hora del día
  const ventasPorHora: Record<number, number> = {}
  for (let h = 0; h < 24; h++) ventasPorHora[h] = 0
  ventas.forEach((v) => {
    const hora = new Date(v.fecha).getHours()
    ventasPorHora[hora] += v.total ?? 0
  })
  const seriesHora = Object.entries(ventasPorHora).map(([hora, total]) => ({
    hora: `${hora.padStart ? String(hora).padStart(2, "0") : hora}:00`,
    total: Math.round((total as number) * 100) / 100,
    transacciones: ventas.filter((v) => new Date(v.fecha).getHours() === Number(hora)).length,
  }))

  // 5. Stock análisis por sucursal
  const stockPorSucursal = sucursales.map((s) => {
    let stockTotal = 0
    let bajoStock = 0
    let sinStock = 0
    productos.forEach((p) => {
      const stock = (p.stock_por_sucursal as Record<string, number>)?.[s.codigo as string] ?? 0
      stockTotal += stock
      if (stock === 0) sinStock++
      else if (stock <= (p.stock_minimo ?? 10)) bajoStock++
    })
    return {
      sucursal: s.nombre,
      stockTotal,
      bajoStock,
      sinStock,
      normal: productos.length - bajoStock - sinStock,
    }
  })

  // 6. KPIs generales (Spark SQL style aggregations)
  const totalIngresos = ventas.reduce((sum, v) => sum + (v.total ?? 0), 0)
  const promedioVenta = ventas.length > 0 ? totalIngresos / ventas.length : 0
  const maxVenta = ventas.reduce((max, v) => Math.max(max, v.total ?? 0), 0)
  const totalItems = detalleVentas.reduce((sum, d) => sum + (d.cantidad as number), 0)

  // 7. Empleados top vendedores
  const empleadoVentas: Record<string, { nombre: string; ventas: number; monto: number }> = {}
  ventas.forEach((v) => {
    if (!v.empleado_codigo) return
    const cod = v.empleado_codigo as string
    if (!empleadoVentas[cod]) empleadoVentas[cod] = { nombre: v.empleado_nombre as string ?? cod, ventas: 0, monto: 0 }
    empleadoVentas[cod].ventas++
    empleadoVentas[cod].monto += v.total ?? 0
  })
  const topEmpleados = Object.entries(empleadoVentas)
    .map(([codigo, d]) => ({ codigo, ...d, monto: Math.round(d.monto * 100) / 100 }))
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 8)

  return NextResponse.json({
    kpis: {
      totalIngresos: Math.round(totalIngresos * 100) / 100,
      totalTransacciones: ventas.length,
      promedioVenta: Math.round(promedioVenta * 100) / 100,
      maxVenta: Math.round(maxVenta * 100) / 100,
      totalItems,
      totalProductos: productos.length,
      totalSucursales: sucursales.length,
    },
    ventasPorSucursal,
    seriesMensuales,
    topProductos,
    seriesHora,
    stockPorSucursal,
    topEmpleados,
    sucursalesNombres: sucursales.map((s) => s.nombre as string),
    procesadoEn: new Date().toISOString(),
    registrosProcesados: ventas.length + detalleVentas.length + productos.length,
  })
}
