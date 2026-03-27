import { NextResponse } from "next/server"
import { getProjectDb } from "@/lib/mongodb"
import { verifyPassword, createSession } from "@/lib/auth"
import { setupActivationCodes } from "@/lib/db-setup"
import { sendLoginFailAlert } from "@/lib/resend"

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "desconocida"
  )
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    if (!username || !password) {
      return NextResponse.json({ error: "Campos requeridos" }, { status: 400 })
    }

    const db = await getProjectDb()
    await setupActivationCodes()

    const safeUser = escapeRegex(username.trim())
    const user = await db.collection("users").findOne({
      username: { $regex: `^${safeUser}$`, $options: "i" },
    })

    const ip = getClientIp(request)
    const ua = request.headers.get("user-agent") || "desconocido"

    if (!user) {
      await db.collection("login_attempts").insertOne({
        tipo: "fallido", username_ingresado: username,
        ip, user_agent: ua, fecha: new Date(), motivo: "usuario_no_encontrado",
      })
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 })
    }

    // ─── BLOQUEO DE TIENDA por superadmin ─────────────────────────────────────
    if (user.tienda_bloqueada === true) {
      // Registrar el intento de acceso forzado
      await db.collection("login_attempts").insertOne({
        tipo: "bloqueado",
        username_ingresado: username,
        ip,
        user_agent: ua,
        fecha: new Date(),
        motivo: "tienda_bloqueada_por_administrador",
        database_name: user.database_name,
      })
      console.warn(`[login] Intento de acceso a tienda bloqueada: ${username} desde IP ${ip}`)
      return NextResponse.json(
        { error: "El acceso a esta tienda ha sido desactivado temporalmente. Contacta al administrador del sistema." },
        { status: 403 }
      )
    }
    // ─────────────────────────────────────────────────────────────────────────

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      await db.collection("login_attempts").insertOne({
        tipo: "fallido", username_ingresado: username,
        ip, user_agent: ua, fecha: new Date(), motivo: "password_incorrecto",
      })
      if (user.email) {
        sendLoginFailAlert(user.email, username, ip, ua, "password_incorrecto").catch(() => {})
      }
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 })
    }

    // Login exitoso
    await db.collection("login_attempts").insertOne({
      tipo: "exitoso", username_ingresado: username,
      ip, user_agent: ua, fecha: new Date(),
      motivo: "autenticacion_correcta", database_name: user.database_name,
    })

    await createSession({
      username:    user.username,
      userDbName:  user.database_name,
      email:       user.email,
    })

    return NextResponse.json({
      success:       true,
      username:      user.username,
      database_name: user.database_name,
    })
  } catch (e: unknown) {
    console.error("[login error]", e)
    const msg = e instanceof Error ? e.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
