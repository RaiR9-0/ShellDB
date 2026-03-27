import { getSaSession } from "@/lib/sa-auth"
import { NextResponse } from "next/server"
import { getProjectDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// PATCH /api/superadmin/users/[id]
// Permite al superadmin:
//   - Establecer límite de sucursales (max_sucursales: 1 | 2 | 3)
//   - Activar/desactivar bloqueo de acceso a la tienda (tienda_bloqueada: boolean)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSaSession()
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID de usuario inválido" }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo de petición inválido" }, { status: 400 })
  }

  const update: Record<string, unknown> = { updatedAt: new Date() }

  // ── Límite de sucursales ──────────────────────────────────────────────────
  if ("max_sucursales" in body) {
    const max = Number(body.max_sucursales)
    if (![1, 2, 3].includes(max)) {
      return NextResponse.json({ error: "max_sucursales debe ser 1, 2 o 3" }, { status: 400 })
    }
    update.max_sucursales = max
  }

  // ── Bloqueo de acceso a tienda ────────────────────────────────────────────
  if ("tienda_bloqueada" in body) {
    if (typeof body.tienda_bloqueada !== "boolean") {
      return NextResponse.json({ error: "tienda_bloqueada debe ser true o false" }, { status: 400 })
    }
    update.tienda_bloqueada = body.tienda_bloqueada
  }

  if (Object.keys(update).length === 1) {
    return NextResponse.json({ error: "No se proporcionaron campos válidos para actualizar" }, { status: 400 })
  }

  const db = await getProjectDb()

  // Registrar acción de bloqueo/desbloqueo en log
  if ("tienda_bloqueada" in body) {
    await db.collection("admin_actions").insertOne({
      tipo: body.tienda_bloqueada ? "tienda_bloqueada" : "tienda_desbloqueada",
      user_id: id,
      fecha: new Date(),
      superadmin: session.user,
      accion: body.tienda_bloqueada
        ? "Acceso a tienda bloqueado por superadmin"
        : "Acceso a tienda restaurado por superadmin",
    })
  }

  const result = await db.collection("users").updateOne(
    { _id: new ObjectId(id) },
    { $set: update }
  )

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  return NextResponse.json({ success: true, updated: update })
}
