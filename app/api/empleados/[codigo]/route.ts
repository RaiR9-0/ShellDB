import bcrypt from "bcryptjs"
import { withAuthParams, successResponse, updateByField, softDelete } from "@/lib/api-helpers"

export const PUT = withAuthParams<{ codigo: string }>(async ({ db }, request, { codigo }) => {
  const body = await request.json()

  const updateFields: Record<string, unknown> = {
    nombre: body.nombre,
    puesto: body.puesto,
    sucursal_codigo: body.sucursal_codigo,
    telefono: body.telefono,
    salario: Number(body.salario),
  }

  // Solo actualizar clave si se envio una nueva
  if (body.clave && body.clave.length >= 4) {
    updateFields.clave = await bcrypt.hash(body.clave, 10)
  }

  await updateByField(db, "empleados", "codigo", codigo, updateFields)
  return successResponse()
})

export const DELETE = withAuthParams<{ codigo: string }>(async ({ db }, _request, { codigo }) => {
  await softDelete(db, "empleados", "codigo", codigo)
  return successResponse()
})
