import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getUserDb } from "@/lib/mongodb"
import type { Db } from "mongodb"

// ============================================
// TIPOS
// ============================================
export interface AuthContext {
  session: { user: string; userDbName: string }
  db: Db
}

type HandlerWithAuth = (
  ctx: AuthContext,
  request: Request
) => Promise<NextResponse>

type HandlerWithAuthAndParams<T> = (
  ctx: AuthContext,
  request: Request,
  params: T
) => Promise<NextResponse>

// ============================================
// RESPUESTAS ESTANDARIZADAS
// ============================================
export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function successResponse() {
  return NextResponse.json({ success: true })
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "No autenticado" }, { status: 401 })
}

// ============================================
// WRAPPER DE AUTENTICACION
// ============================================

/**
 * Wrapper que verifica autenticacion y obtiene la base de datos del usuario
 * Elimina la duplicacion del patron: getSession -> check -> getUserDb
 */
export function withAuth(handler: HandlerWithAuth) {
  return async (request: Request): Promise<NextResponse> => {
    const session = await getSession()
    if (!session) return unauthorizedResponse()

    const db = await getUserDb(session.userDbName)
    return handler({ session, db }, request)
  }
}

/**
 * Wrapper para rutas con parametros dinamicos (ej: [codigo], [id])
 */
export function withAuthParams<T>(handler: HandlerWithAuthAndParams<T>) {
  return async (
    request: Request,
    { params }: { params: Promise<T> }
  ): Promise<NextResponse> => {
    const session = await getSession()
    if (!session) return unauthorizedResponse()

    const db = await getUserDb(session.userDbName)
    const resolvedParams = await params
    return handler({ session, db }, request, resolvedParams)
  }
}

// ============================================
// HELPERS CRUD GENERICOS
// ============================================

interface GetListOptions {
  filter?: Record<string, unknown>
  sort?: Record<string, 1 | -1>
  transform?: (doc: Record<string, unknown>) => Record<string, unknown>
}

/**
 * Obtiene lista de documentos de una coleccion
 */
export async function getList(
  db: Db,
  collection: string,
  options: GetListOptions = {}
) {
  const { filter = { activo: true }, sort, transform } = options
  
  let cursor = db.collection(collection).find(filter)
  if (sort) cursor = cursor.sort(sort)
  
  const docs = await cursor.toArray()
  
  if (transform) {
    return docs.map(transform)
  }
  
  return docs.map((doc) => ({
    ...doc,
    _id: String(doc._id),
  }))
}

/**
 * Obtiene un documento por campo
 */
export async function getByField(
  db: Db,
  collection: string,
  field: string,
  value: string
) {
  return db.collection(collection).findOne({ [field]: value })
}

/**
 * Inserta un documento
 */
export async function insertDoc(
  db: Db,
  collection: string,
  data: Record<string, unknown>
) {
  return db.collection(collection).insertOne(data)
}

/**
 * Actualiza un documento por campo
 */
export async function updateByField(
  db: Db,
  collection: string,
  field: string,
  value: string,
  update: Record<string, unknown>
) {
  return db.collection(collection).updateOne(
    { [field]: value },
    { $set: update }
  )
}

/**
 * Soft delete - marca como inactivo
 */
export async function softDelete(
  db: Db,
  collection: string,
  field: string,
  value: string
) {
  return db.collection(collection).updateOne(
    { [field]: value },
    { $set: { activo: false } }
  )
}

// ============================================
// HELPER PARA MAPEAR CODIGOS A NOMBRES
// ============================================
export async function buildCodeMap(
  db: Db,
  collection: string,
  codeField = "codigo",
  nameField = "nombre"
): Promise<Record<string, string>> {
  const docs = await db.collection(collection).find({}).toArray()
  const map: Record<string, string> = {}
  for (const doc of docs) {
    map[doc[codeField] as string] = doc[nameField] as string
  }
  return map
}
