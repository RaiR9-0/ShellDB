import { NextResponse } from "next/server"
import { getProjectDb } from "@/lib/mongodb"
import { verifyPassword, createSession } from "@/lib/auth"
import { setupActivationCodes } from "@/lib/db-setup"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    if (!username || !password) {
      return NextResponse.json({ error: "Campos requeridos" }, { status: 400 })
    }

    const db = await getProjectDb()

    // Ensure activation codes exist
    await setupActivationCodes()

    const user = await db.collection("users").findOne({
      username: { $regex: `^${username}$`, $options: "i" },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: "Contrasena incorrecta" }, { status: 401 })
    }

    await createSession({
      username: user.username,
      userDbName: user.database_name,
      email: user.email,
    })

    return NextResponse.json({
      success: true,
      username: user.username,
      database_name: user.database_name,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
