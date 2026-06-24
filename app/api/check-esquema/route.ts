import { NextResponse } from "next/server"
import { forceInitSchema } from "@/lib/db"

export async function GET() {
  try {
    await forceInitSchema()
    return NextResponse.json({ message: "Esquema creado o validado correctamente." })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error al forzar el esquema" }, { status: 500 })
  }
}
