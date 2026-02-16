import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getUserDb } from "@/lib/mongodb"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const db = await getUserDb(session.userDbName)
  const sucursales = await db.collection("sucursales").find({ activa: true }).toArray()

  return NextResponse.json(
    sucursales.map((s) => ({
      _id: String(s._id),
      codigo: s.codigo,
      nombre: s.nombre,
      direccion: s.direccion,
      telefono: s.telefono,
    }))
  )
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const body = await request.json()
  const db = await getUserDb(session.userDbName)

  await db.collection("sucursales").insertOne({
    codigo: body.codigo,
    nombre: body.nombre,
    direccion: body.direccion || "",
    telefono: body.telefono || "",
    activa: true,
  })

  return NextResponse.json({ success: true })
}
