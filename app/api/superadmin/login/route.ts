import { NextResponse } from "next/server"
import { SignJWT } from "jose"
import { cookies, headers } from "next/headers"
import { getProjectDb } from "@/lib/mongodb"

const SA_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "tienda-shellx-secret-key-2024"
)
const SA_COOKIE = "shelldb_sa_session"

function getClientIp(req: Request): string {
  const h = req.headers
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    "desconocida"
  )
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const db = await getProjectDb()

  try {
    const { username, password } = await request.json()

    const SA_USER = process.env.SUPERADMIN_USER || ""
    const SA_PASS = process.env.SUPERADMIN_PASS || ""

    if (!SA_USER || !SA_PASS) {
      return NextResponse.json(
        { error: "Superadmin no configurado en variables de entorno" },
        { status: 503 }
      )
    }

    const ahora = new Date()

    if (username !== SA_USER || password !== SA_PASS) {
      // Registrar intento fallido
      await db.collection("sa_login_attempts").insertOne({
        tipo: "fallido",
        username_ingresado: username,
        ip,
        user_agent: request.headers.get("user-agent") || "desconocido",
        fecha: ahora,
        motivo: username !== SA_USER ? "usuario_incorrecto" : "password_incorrecto",
      })
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 })
    }

    // Login exitoso - registrar
    await db.collection("sa_login_attempts").insertOne({
      tipo: "exitoso",
      username_ingresado: username,
      ip,
      user_agent: request.headers.get("user-agent") || "desconocido",
      fecha: ahora,
      motivo: "autenticacion_correcta",
    })

    const token = await new SignJWT({ role: "superadmin", user: SA_USER })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("4h")
      .setIssuedAt()
      .sign(SA_SECRET)

    const cookieStore = await cookies()
    cookieStore.set(SA_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 4,
      path: "/",
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[SA Login]", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
