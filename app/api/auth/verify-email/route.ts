import { NextResponse } from "next/server"
import { getProjectDb } from "@/lib/mongodb"

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()
    if (!email || !code) return NextResponse.json({ error: "Faltan datos" }, { status: 400 })

    const db = await getProjectDb()
    const emailLower = email.trim().toLowerCase()

    const doc = await db.collection("email_verifications").findOne({ email: emailLower })

    if (!doc) {
      return NextResponse.json({ error: "Solicita primero el código de verificación" }, { status: 404 })
    }

    // Máximo 5 intentos
    if (doc.intentos >= 5) {
      return NextResponse.json({ error: "Demasiados intentos. Solicita un nuevo código." }, { status: 429 })
    }

    // Verificar expiración
    if (new Date() > new Date(doc.expira_en)) {
      return NextResponse.json({ error: "El código ha expirado. Solicita uno nuevo." }, { status: 410 })
    }

    // Incrementar intentos
    await db.collection("email_verifications").updateOne(
      { email: emailLower },
      { $inc: { intentos: 1 } }
    )

    if (String(doc.code) !== String(code).trim()) {
      return NextResponse.json({ error: "Código incorrecto" }, { status: 401 })
    }

    // Marcar como verificado
    await db.collection("email_verifications").updateOne(
      { email: emailLower },
      { $set: { verificado: true, verificado_en: new Date() } }
    )

    return NextResponse.json({ success: true, verified: true })
  } catch (e) {
    console.error("[verify-email]", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
