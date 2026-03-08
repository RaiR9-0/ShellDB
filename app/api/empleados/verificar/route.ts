import bcrypt from "bcryptjs"
import { withAuth, jsonResponse, errorResponse } from "@/lib/api-helpers"

// POST /api/empleados/verificar
// Valida codigo + clave de empleado y devuelve su nombre.
// Usado por la pantalla de Nueva Venta para identificar al empleado
// antes de que empiece a capturar productos, sin procesar la venta aun.
export const POST = withAuth(async ({ db }, request) => {
  const { codigo, clave } = await request.json()

  if (!codigo || !clave) {
    return errorResponse("Se requiere codigo y clave")
  }

  const empleado = await db.collection("empleados").findOne({ codigo, activo: true })

  if (!empleado) {
    return errorResponse("Empleado no encontrado o inactivo", 401)
  }

  if (!empleado.clave) {
    return errorResponse("Este empleado no tiene clave asignada. Contacte al administrador.", 403)
  }

  const claveValida = await bcrypt.compare(clave as string, empleado.clave as string)
  if (!claveValida) {
    return errorResponse("Clave incorrecta", 401)
  }

  return jsonResponse({ success: true, nombre: empleado.nombre, codigo: empleado.codigo })
})
