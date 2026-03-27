import { jwtVerify } from "jose"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getProjectDb } from "@/lib/mongodb"
import type { Db } from "mongodb"

const SA_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "tienda-shellx-secret-key-2024"
)
const SA_COOKIE = "shelldb_sa_session"

export async function getSaSession(): Promise<{ user: string; role: string } | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SA_COOKIE)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, SA_SECRET)
    if (payload.role !== "superadmin") return null
    return payload as { user: string; role: string }
  } catch {
    return null
  }
}

type SaHandler = (ctx: { db: Db; session: { user: string } }, req: Request) => Promise<NextResponse>

export function withSaAuth(handler: SaHandler) {
  return async (request: Request): Promise<NextResponse> => {
    const session = await getSaSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const db = await getProjectDb()
    return handler({ db, session }, request)
  }
}
