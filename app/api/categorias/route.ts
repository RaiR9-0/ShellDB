import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getUserDb } from "@/lib/mongodb"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const db = await getUserDb(session.userDbName)
  const categorias = await db.collection("categorias").find({}).toArray()

  return NextResponse.json(
    categorias.map((c) => ({
      _id: String(c._id),
      codigo: c.codigo,
      nombre: c.nombre,
      descripcion: c.descripcion,
    }))
  )
}
