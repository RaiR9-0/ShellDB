import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getUserDb } from "@/lib/mongodb"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { codigo } = await params
  const body = await request.json()
  const db = await getUserDb(session.userDbName)

  await db.collection("empleados").updateOne(
    { codigo },
    {
      $set: {
        nombre: body.nombre,
        puesto: body.puesto,
        sucursal_codigo: body.sucursal_codigo,
        telefono: body.telefono,
        salario: Number(body.salario),
      },
    }
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
