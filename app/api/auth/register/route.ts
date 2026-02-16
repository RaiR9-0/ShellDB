import { NextResponse } from "next/server"
import { getProjectDb } from "@/lib/mongodb"
import { hashPassword } from "@/lib/auth"
import { createUserDatabase, setupActivationCodes } from "@/lib/db-setup"

export async function POST(request: Request) {
  try {
    const { username, password, passwordConfirm, email, phone, activationCode } =
      await request.json()

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

    const db = await getProjectDb()

    // Ensure activation codes exist
    await setupActivationCodes()

    // Check if user already exists
    const existing = await db.collection("users").findOne({
      username: { $regex: `^${username}$`, $options: "i" },
    })
    if (existing) {
      return NextResponse.json({ error: "El usuario ya existe" }, { status: 409 })
    }

    // Validate activation code
    const code = activationCode.trim().toUpperCase()
    const codeDoc = await db.collection("activation_codes").findOne({
      code: { $regex: `^${code}$`, $options: "i" },
      used: false,
    })

    if (!codeDoc) {
      return NextResponse.json(
        { error: "Codigo de activacion invalido o ya utilizado" },
        { status: 400 }
      )
    }

    // Create user database
    const userDbName = await createUserDatabase(username)

    // Hash password and save user
    const hashed = await hashPassword(password)
    await db.collection("users").insertOne({
      username,
      password: hashed,
      email,
      phone: phone || "",
      database_name: userDbName,
      created_at: new Date(),
      active: true,
    })

    // Mark code as used
    await db.collection("activation_codes").updateOne(
      { _id: codeDoc._id },
      { $set: { used: true, used_by: username, used_at: new Date() } }
    )

    return NextResponse.json({ success: true, message: "Usuario registrado exitosamente" })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
