import { withAuth, jsonResponse, successResponse, errorResponse, getList } from "@/lib/api-helpers"
import { getProjectDb } from "@/lib/mongodb"

export const GET = withAuth(async ({ db }) => {
  const sucursales = await getList(db, "sucursales", {
    filter: { activa: true },
    transform: (s) => ({
      _id: String(s._id),
      codigo: s.codigo,
      nombre: s.nombre,
      direccion: s.direccion,
      telefono: s.telefono,
    }),
  })
  return jsonResponse(sucursales)
})

export const POST = withAuth(async ({ db, session }, request) => {
  const body = await request.json()

  // ─── Verificar límite de sucursales configurado por superadmin ──────────────
  const projectDb = await getProjectDb()
  const userConfig = await projectDb.collection("users").findOne({ database_name: session.userDbName })

  if (userConfig?.max_sucursales != null) {
    const limite = Number(userConfig.max_sucursales)
    const actuales = await db.collection("sucursales").countDocuments({ activa: true })
    if (actuales >= limite) {
      return errorResponse(
        `Límite de sucursales alcanzado. Tu plan permite máximo ${limite} sucursal${limite === 1 ? "" : "es"}.`,
        403
      )
    }
  }
  // ───────────────────────────────────────────────────────────────────────────

  await db.collection("sucursales").insertOne({
    codigo:    body.codigo,
    nombre:    body.nombre,
    direccion: body.direccion || "",
    telefono:  body.telefono  || "",
    activa:    true,
  })
  return successResponse()
})
