import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getUserDb } from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { codigo } = await params
  const body = await request.json()
  const db = await getUserDb(session.userDbName)

  const updateFields: Record<string, unknown> = {
    nombre: body.nombre,
    puesto: body.puesto,
    sucursal_codigo: body.sucursal_codigo,
    telefono: body.telefono,
    salario: Number(body.salario),
  }

  // Solo actualizar clave si se envio una nueva
  if (body.clave && body.clave.length >= 4) {
    updateFields.clave = await bcrypt.hash(body.clave, 10)
  }

  await db.collection("empleados").updateOne(
    { codigo },
    { $set: updateFields }
  )
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { codigo } = await params
  const db = await getUserDb(session.userDbName)

  await db.collection("empleados").updateOne({ codigo }, { $set: { activo: false } })
  return NextResponse.json({ success: true })
}
