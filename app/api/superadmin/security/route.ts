import { withSaAuth } from "@/lib/sa-auth"
import { NextResponse } from "next/server"

export const GET = withSaAuth(async ({ db }) => {
  // Leer resultados del pipeline Spark admin
  const sparkDocs = await db
    .collection("spark_results_admin")
    .find({})
    .toArray()

  if (!sparkDocs || sparkDocs.length === 0) {
    return NextResponse.json({ spark: false }, { status: 200 })
  }

  const byTipo: Record<string, unknown> = {}
  for (const doc of sparkDocs) {
    byTipo[doc.tipo as string] = doc.datos
  }

  const meta = sparkDocs.find((d) => d.tipo === "job_metadata_admin")

  return NextResponse.json({
    spark: true,
    login_usuarios:   byTipo["login_usuarios"]   ?? null,
    login_superadmin: byTipo["login_superadmin"] ?? null,
    tiendas_globales: byTipo["tiendas_globales"] ?? null,
    ranking_tiendas:  byTipo["ranking_tiendas"]  ?? null,
    usuarios_resumen: byTipo["usuarios_resumen"] ?? null,
    _meta: {
      procesadoEn:   meta?.datos?.procesadoEn ?? null,
      totalUsuarios: meta?.datos?.totalUsuarios ?? 0,
      totalTiendas:  meta?.datos?.totalTiendas ?? 0,
    },
  })
})
