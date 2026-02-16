import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getUserDb } from "@/lib/mongodb"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const db = await getUserDb(session.userDbName)
  const empleados = await db.collection("empleados").find({ activo: true }).toArray()

  return NextResponse.json(
    empleados.map((e) => ({
      _id: String(e._id),
      codigo: e.codigo,
      nombre: e.nombre,
      puesto: e.puesto,
      sucursal_codigo: e.sucursal_codigo,
      telefono: e.telefono,
      salario: e.salario,
    }))
  )
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const body = await request.json()
  const db = await getUserDb(session.userDbName)

  await db.collection("empleados").insertOne({
    codigo: body.codigo,
    nombre: body.nombre,
    puesto: body.puesto,
    sucursal_codigo: body.sucursal_codigo,
    telefono: body.telefono || "",
    salario: Number(body.salario) || 0,
    activo: true,
  })

  return NextResponse.json({ success: true })
}
