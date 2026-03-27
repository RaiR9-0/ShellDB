import { withSaAuth } from "@/lib/sa-auth"
import { NextResponse } from "next/server"
import { getClient } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export const GET = withSaAuth(async ({ db }) => {
  const users = await db.collection("users").find({}).sort({ createdAt: -1 }).toArray()
  const client = await getClient()

  const result = await Promise.all(
    users.map(async (u) => {
      const userDbName: string = u.database_name || ""
      let stats = {
        productos: 0, ventas: 0, compras: 0,
        empleados: 0, sucursales: 0,
        ultima_venta: null as Date | null,
      }

      if (userDbName) {
        try {
          const udb = client.db(userDbName)
          const [productos, ventas, compras, empleados, sucursales, ultimaVenta] = await Promise.all([
            udb.collection("productos").countDocuments(),
            udb.collection("ventas").countDocuments(),
            udb.collection("compras").countDocuments(),
            udb.collection("empleados").countDocuments({ activo: true }),
            udb.collection("sucursales").countDocuments({ activa: true }),
            udb.collection("ventas").findOne({}, { sort: { fecha: -1 } }),
          ])
          stats = { productos, ventas, compras, empleados, sucursales, ultima_venta: ultimaVenta?.fecha || null }
        } catch { /* BD vacía o sin acceso */ }
      }

      return {
        _id:              String(u._id),
        username:         u.username,
        email:            u.email || "",
        phone:            u.phone || "",
        database_name:    userDbName,
        createdAt:        u.createdAt || null,
        max_sucursales:   u.max_sucursales   ?? null,
        tienda_bloqueada: u.tienda_bloqueada ?? false,
        stats,
      }
    })
  )

  return NextResponse.json(result)
})

// ─── PATCH — actualizar controles de acceso de un usuario ────────────────────
export const PATCH = withSaAuth(async ({ db }, request) => {
  try {
    const body = await request.json()
    const { userId, max_sucursales, tienda_bloqueada } = body

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 })
    }

    const updateFields: Record<string, unknown> = {}

    if (max_sucursales !== undefined) {
      const val = max_sucursales === null ? null : Number(max_sucursales)
      if (val !== null && (isNaN(val) || val < 1 || val > 10)) {
        return NextResponse.json({ error: "max_sucursales debe ser null o entre 1 y 10" }, { status: 400 })
      }
      updateFields.max_sucursales = val
    }

    if (tienda_bloqueada !== undefined) {
      updateFields.tienda_bloqueada = Boolean(tienda_bloqueada)
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: "Sin campos para actualizar" }, { status: 400 })
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: { ...updateFields, updatedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true, updated: updateFields })
  } catch (e) {
    console.error("[superadmin/users PATCH]", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
})
