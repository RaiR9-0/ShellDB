import bcrypt from "bcryptjs"
import { withAuth, jsonResponse, successResponse, errorResponse, getList, insertDoc } from "@/lib/api-helpers"

// Genera codigo de empleado con formato: PPP-AAMM-L#
// Ejemplos: VND-2503-A7  CAJ-2503-B2  ADM-2503-Z9
function generarCodigoEmpleado(puesto: string): string {
  const PREFIJOS: Record<string, string> = {
    vendedor: "VND",
    cajero: "CAJ",
    almacenista: "ALM",
    supervisor: "SUP",
    gerente: "GER",
    administrador: "ADM",
  }
  const puestoNorm = (puesto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
  const prefijo =
    PREFIJOS[puestoNorm] ??
    puestoNorm.substring(0, 3).toUpperCase().padEnd(3, "X")

  const now = new Date()
  const anio = String(now.getFullYear()).slice(2)
  const mes = String(now.getMonth() + 1).padStart(2, "0")
  const letra = String.fromCharCode(65 + Math.floor(Math.random() * 26))
  const digito = Math.floor(Math.random() * 10)

  return `${prefijo}-${anio}${mes}-${letra}${digito}`
}

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

  // Generar codigo unico — reintentar hasta 5 veces ante colision
  let codigo = generarCodigoEmpleado(body.puesto)
  for (let i = 0; i < 5; i++) {
    const existe = await db.collection("empleados").findOne({ codigo })
    if (!existe) break
    codigo = generarCodigoEmpleado(body.puesto)
  }

  const claveHash = await bcrypt.hash(body.clave, 10)

  await insertDoc(db, "empleados", {
    codigo,
    nombre: body.nombre,
    puesto: body.puesto,
    sucursal_codigo: body.sucursal_codigo,
    telefono: body.telefono || "",
    salario: Number(body.salario) || 0,
    clave: claveHash,
    activo: true,
  })

  // Devuelve el codigo generado para que el admin lo comparta con el empleado
  return jsonResponse({ success: true, codigo })
})
