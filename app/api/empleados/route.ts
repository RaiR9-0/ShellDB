import bcrypt from "bcryptjs"
import { withAuth, jsonResponse, successResponse, errorResponse, getList, insertDoc } from "@/lib/api-helpers"

export const GET = withAuth(async ({ db }) => {
  const empleados = await getList(db, "empleados", {
    transform: (e) => ({
      _id: String(e._id),
      codigo: e.codigo,
      nombre: e.nombre,
      puesto: e.puesto,
      sucursal_codigo: e.sucursal_codigo,
      telefono: e.telefono,
      salario: e.salario,
      tiene_clave: !!e.clave,
    }),
  })
  return jsonResponse(empleados)
})

export const POST = withAuth(async ({ db }, request) => {
  const body = await request.json()

  if (!body.clave || body.clave.length < 4) {
    return errorResponse("La clave debe tener al menos 4 caracteres")
  }

  const claveHash = await bcrypt.hash(body.clave, 10)

  await insertDoc(db, "empleados", {
    codigo: body.codigo,
    nombre: body.nombre,
    puesto: body.puesto,
    sucursal_codigo: body.sucursal_codigo,
    telefono: body.telefono || "",
    salario: Number(body.salario) || 0,
    clave: claveHash,
    activo: true,
  })

  return successResponse()
})
