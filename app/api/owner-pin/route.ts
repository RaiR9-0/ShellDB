import bcrypt from "bcryptjs"
import { withAuth, jsonResponse, errorResponse } from "@/lib/api-helpers"

// GET — verificar si ya existe PIN configurado
export const GET = withAuth(async ({ db }) => {
  const config = await db.collection("owner_config").findOne({ tipo: "pin" })
  return jsonResponse({ configured: !!config?.pin_hash })
})

// POST — verificar PIN (devuelve token temporal)
export const POST = withAuth(async ({ db }, request) => {
  const { pin } = await request.json()
  if (!pin) return errorResponse("PIN requerido")

  const config = await db.collection("owner_config").findOne({ tipo: "pin" })
  if (!config?.pin_hash) return errorResponse("PIN de dueño no configurado. Configúralo en Ajustes.", 404)

  const valid = await bcrypt.compare(String(pin), config.pin_hash)
  if (!valid) {
    // Log failed owner PIN attempt
    await db.collection("intentos_fallidos_propietario").insertOne({
      tipo: "pin_incorrecto",
      fecha: new Date(),
      motivo: "PIN de propietario incorrecto",
    })
    return errorResponse("PIN incorrecto", 401)
  }

  return jsonResponse({ success: true })
})

// PUT — crear o actualizar PIN
export const PUT = withAuth(async ({ db }, request) => {
  const { pin, pinActual } = await request.json()

  if (!pin || String(pin).length < 4) return errorResponse("El PIN debe tener al menos 4 dígitos")
  if (!/^\d+$/.test(String(pin))) return errorResponse("El PIN solo puede contener números")

  // Si ya existe PIN, verificar el actual
  const config = await db.collection("owner_config").findOne({ tipo: "pin" })
  if (config?.pin_hash) {
    if (!pinActual) return errorResponse("Debes ingresar el PIN actual para cambiarlo")
    const valid = await bcrypt.compare(String(pinActual), config.pin_hash)
    if (!valid) return errorResponse("PIN actual incorrecto", 401)
  }

  const hash = await bcrypt.hash(String(pin), 10)
  await db.collection("owner_config").replaceOne(
    { tipo: "pin" },
    { tipo: "pin", pin_hash: hash, actualizado_en: new Date() },
    { upsert: true }
  )

  return jsonResponse({ success: true })
})
