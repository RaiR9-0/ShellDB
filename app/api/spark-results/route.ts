import { withAuth, jsonResponse, errorResponse } from "@/lib/api-helpers"

export const GET = withAuth(async ({ db, session }) => {
  // Leer resultados de Spark de la BD del usuario actual
  const resultados = await db
    .collection("spark_results")
    .find({})
    .toArray()

  if (!resultados || resultados.length === 0) {
    return errorResponse(
      `No hay resultados de Spark para la base de datos "${session.userDbName}". Ejecuta: python3 analisis_spark.py --db ${session.userDbName}`,
      404
    )
  }

  // Convertir array a objeto indexado por tipo
  const data: Record<string, unknown> = {}
  for (const r of resultados) {
    data[r.tipo as string] = r.datos
  }

  // Metadata del ultimo job
  const meta = resultados.find((r) => r.tipo === "job_metadata")

  return jsonResponse({
    ...data,
    _meta: {
      procesadoEn: meta?.procesado_en ?? null,
      totalRegistros: (data.kpis as Record<string, number>)?.totalRegistrosProcesados ?? 0,
      disponible: true,
      userDbName: session.userDbName,
    },
  })
})
