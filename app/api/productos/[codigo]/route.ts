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

  await db.collection("productos").updateOne(
    { codigo },
    {
      $set: {
        nombre: body.nombre,
        categoria_codigo: body.categoria_codigo,
        precio_compra: Number(body.precio_compra),
        precio_venta: Number(body.precio_venta),
        stock_minimo: Number(body.stock_minimo) || 10,
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

  await db.collection("productos").updateOne({ codigo }, { $set: { activo: false } })

  return NextResponse.json({ success: true })
}
