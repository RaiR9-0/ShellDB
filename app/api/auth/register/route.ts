import { NextResponse } from "next/server"
import { getProjectDb } from "@/lib/mongodb"
import { hashPassword } from "@/lib/auth"
import { createUserDatabase, setupActivationCodes } from "@/lib/db-setup"

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password, passwordConfirm, email, phone, activationCode } = body

    console.log("[v0] Register attempt for:", username)

    if (!username || !password || !passwordConfirm || !email || !activationCode) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    if (password !== passwordConfirm) {
      return NextResponse.json({ error: "Las contrasenas no coinciden" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contrasena debe tener al menos 6 caracteres" },
        { status: 400 }
      )
    }

    console.log("[v0] Connecting to project DB...")
    const db = await getProjectDb()
    console.log("[v0] Connected. Setting up activation codes...")

    // Ensure activation codes exist
    await setupActivationCodes()
    console.log("[v0] Activation codes ready.")

    // Check if user already exists
    const safeUser = escapeRegex(username.trim())
    const existing = await db.collection("users").findOne({
      username: { $regex: `^${safeUser}$`, $options: "i" },
    })
    if (existing) {
      console.log("[v0] User already exists:", username)
      return NextResponse.json({ error: "El usuario ya existe" }, { status: 409 })
    }

    // Validate activation code
    const code = activationCode.trim().toUpperCase()
    const safeCode = escapeRegex(code)
    console.log("[v0] Validating activation code:", code)

    const codeDoc = await db.collection("activation_codes").findOne({
      code: { $regex: `^${safeCode}$`, $options: "i" },
      used: false,
    })

    if (!codeDoc) {
      // Debug: list all codes for troubleshooting
      const allCodes = await db.collection("activation_codes").find({}).toArray()
      console.log("[v0] All activation codes in DB:", JSON.stringify(allCodes.map(c => ({ code: c.code, used: c.used }))))
      return NextResponse.json(
        { error: "Codigo de activacion invalido o ya utilizado" },
        { status: 400 }
      )
    }

    console.log("[v0] Code valid. Creating user database...")

    // Create user database
    let userDbName: string
    try {
      userDbName = await createUserDatabase(username)
      console.log("[v0] User database created:", userDbName)
    } catch (dbErr) {
      console.error("[v0] Error creating user database:", dbErr)
      return NextResponse.json(
        { error: "Error creando la base de datos del usuario" },
        { status: 500 }
      )
    }

    // Hash password and save user
    const hashed = await hashPassword(password)
    await db.collection("users").insertOne({
      username: username.trim(),
      password: hashed,
      email: email.trim(),
      phone: phone?.trim() || "",
      database_name: userDbName,
      created_at: new Date(),
      active: true,
    })
    console.log("[v0] User inserted in DB")

    // Mark code as used
    await db.collection("activation_codes").updateOne(
      { _id: codeDoc._id },
      { $set: { used: true, used_by: username.trim(), used_at: new Date() } }
    )
    console.log("[v0] Code marked as used. Registration complete!")

    return NextResponse.json({ success: true, message: "Usuario registrado exitosamente" })
  } catch (e: unknown) {
    console.error("[v0] Register error:", e)
    const msg = e instanceof Error ? e.message : "Error interno del servidor"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
