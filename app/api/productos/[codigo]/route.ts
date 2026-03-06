import { withAuthParams, successResponse, updateByField, softDelete } from "@/lib/api-helpers"

export const PUT = withAuthParams<{ codigo: string }>(async ({ db }, request, { codigo }) => {
  const body = await request.json()
  await updateByField(db, "productos", "codigo", codigo, {
    nombre: body.nombre,
    categoria_codigo: body.categoria_codigo,
    precio_compra: Number(body.precio_compra),
    precio_venta: Number(body.precio_venta),
    stock_minimo: Number(body.stock_minimo) || 10,
  })
  return successResponse()
})

export const DELETE = withAuthParams<{ codigo: string }>(async ({ db }, _request, { codigo }) => {
  await softDelete(db, "productos", "codigo", codigo)
  return successResponse()
})
