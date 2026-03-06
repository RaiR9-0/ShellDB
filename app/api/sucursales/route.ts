import { withAuth, jsonResponse, successResponse, getList, insertDoc } from "@/lib/api-helpers"

export const GET = withAuth(async ({ db }) => {
  const sucursales = await getList(db, "sucursales", {
    filter: { activa: true },
    transform: (s) => ({
      _id: String(s._id),
      codigo: s.codigo,
      nombre: s.nombre,
      direccion: s.direccion,
      telefono: s.telefono,
    }),
  })
  return jsonResponse(sucursales)
})

export const POST = withAuth(async ({ db }, request) => {
  const body = await request.json()
  await insertDoc(db, "sucursales", {
    codigo: body.codigo,
    nombre: body.nombre,
    direccion: body.direccion || "",
    telefono: body.telefono || "",
    activa: true,
  })
  return successResponse()
})
