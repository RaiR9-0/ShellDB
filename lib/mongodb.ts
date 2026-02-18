import { MongoClient, type Db } from "mongodb"

const ATLAS_URI = process.env.MONGODB_URI || ""

if (!ATLAS_URI) {
  throw new Error(
    "La variable de entorno MONGODB_URI no esta definida. Agregala en Render > Environment."
  )
}

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

export async function getClient(): Promise<MongoClient> {
  if (client) return client
  if (!clientPromise) {
    clientPromise = MongoClient.connect(ATLAS_URI)
    client = await clientPromise
  } else {
    client = await clientPromise
  }
  return client
}

export async function getDatabase(dbName: string): Promise<Db> {
  const c = await getClient()
  return c.db(dbName)
}

/** The main 'proyecto' database that stores users and activation codes */
export async function getProjectDb(): Promise<Db> {
  return getDatabase("proyecto")
}

/** Gets the per-user store database */
export async function getUserDb(dbName: string): Promise<Db> {
  return getDatabase(dbName)
}