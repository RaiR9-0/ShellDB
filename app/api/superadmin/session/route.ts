import { getSaSession } from "@/lib/sa-auth"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await getSaSession()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  return NextResponse.json({ user: session.user, role: session.role })
}
