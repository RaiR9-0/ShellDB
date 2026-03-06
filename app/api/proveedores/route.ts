import { withAuth, jsonResponse, successResponse, getList, insertDoc } from "@/lib/api-helpers"

export const GET = withAuth(async ({ db }) => {
  const proveedores = await getList(db, "proveedores", {
    transform: (p) => ({
      _id: String(p._id),
      codigo: p.codigo,
      nombre: p.nombre,
      contacto: p.contacto,
      telefono: p.telefono,
      email: p.email,
    }),
  })
  return jsonResponse(proveedores)
})

export const POST = withAuth(async ({ db }, request) => {
  const body = await request.json()
  await insertDoc(db, "proveedores", {
    codigo: body.codigo,
    nombre: body.nombre,
    contacto: body.contacto || "",
    telefono: body.telefono || "",
    email: body.email || "",
    activo: true,
  })
  return successResponse()
})
