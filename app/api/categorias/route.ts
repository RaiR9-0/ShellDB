import { withAuth, jsonResponse, getList } from "@/lib/api-helpers"

export const GET = withAuth(async ({ db }) => {
  const categorias = await getList(db, "categorias", {
    filter: {},
    transform: (c) => ({
      _id: String(c._id),
      codigo: c.codigo,
      nombre: c.nombre,
      descripcion: c.descripcion,
    }),
  })
  return jsonResponse(categorias)
})
