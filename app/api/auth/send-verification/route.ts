import { NextResponse } from "next/server"
import { getProjectDb } from "@/lib/mongodb"
import { sendVerificationEmail } from "@/lib/resend"

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000)) // 6 dígitos
}

// Solo permite correos @gmail.com, @hotmail.com, @outlook.com, @yahoo.com etc
// pero bloquea dominios falsos o temporales
function isValidEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
  if (!re.test(email)) return false
  // Bloquear dominios temporales comunes
  const blocked = ["tempmail", "mailinator", "guerrillamail", "trashmail", "10minutemail", "yopmail"]
  const domain = email.split("@")[1]?.toLowerCase() || ""
  return !blocked.some(b => domain.includes(b))
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Correo inválido. Usa un correo real (ej: ejemplo@gmail.com)" },
        { status: 400 }
      )
    }

    const emailLower = email.trim().toLowerCase()
    const db = await getProjectDb()

    // Verificar si el email ya está registrado
    const existing = await db.collection("users").findOne({ email: { $regex: `^${emailLower}$`, $options: "i" } })
    if (existing) {
      return NextResponse.json(
        { error: "Este correo ya está registrado en el sistema" },
        { status: 409 }
      )
    }

    const code    = generateCode()
    const expira  = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos

    // Guardar código (upsert por email)
    await db.collection("email_verifications").replaceOne(
      { email: emailLower },
      {
        email:      emailLower,
        code,
        expira_en:  expira,
        verificado: false,
        intentos:   0,
        creado_en:  new Date(),
      },
      { upsert: true }
    )

    // Enviar correo
    await sendVerificationEmail(emailLower, emailLower.split("@")[0], code)

    return NextResponse.json({ success: true, message: "Código enviado a tu correo" })
  } catch (e) {
    console.error("[send-verification]", e)
    return NextResponse.json({ error: "Error al enviar el correo. Verifica tu email e intenta de nuevo." }, { status: 500 })
  }
}
