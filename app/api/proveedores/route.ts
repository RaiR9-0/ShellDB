import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getUserDb } from "@/lib/mongodb"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const db = await getUserDb(session.userDbName)
  const proveedores = await db
    .collection("proveedores")
    .find({ activo: true })
    .toArray()

  return NextResponse.json(
    proveedores.map((p) => ({
      _id: String(p._id),
      codigo: p.codigo,
      nombre: p.nombre,
      contacto: p.contacto,
      telefono: p.telefono,
      email: p.email,
    }))
  )
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const body = await request.json()
  const db = await getUserDb(session.userDbName)

  await db.collection("proveedores").insertOne({
    codigo: body.codigo,
    nombre: body.nombre,
    contacto: body.contacto || "",
    telefono: body.telefono || "",
    email: body.email || "",
    activo: true,
  })

  return NextResponse.json({ success: true })
}
