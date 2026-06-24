"use server"

import { dbCrearIncidente, dbEliminarIncidente, dbGetIncidentes, dbActualizarIncidente, dbGetIncidenteById, type NuevoIncidente } from "@/lib/db"
import type { CategoriaId, Incidente } from "@/lib/incidentes"
import { uploadFlyerToS3, deleteFlyerFromS3 } from "@/lib/s3"

export async function getIncidentes(): Promise<Incidente[]> {
  return dbGetIncidentes()
}

export interface CrearIncidenteInput {
  region: string
  ciudad?: string | null
  categoria: CategoriaId
  titulo: string
  descripcion?: string
  flyer_url?: string | null
  fecha?: string
}

export async function crearIncidente(input: CrearIncidenteInput): Promise<Incidente> {
  if (!input.region?.trim()) throw new Error("La region es obligatoria")
  if (!input.titulo?.trim()) throw new Error("El titulo es obligatorio")

  const data: NuevoIncidente = {
    region: input.region.trim(),
    ciudad: input.ciudad?.trim() ? input.ciudad.trim() : null,
    categoria: input.categoria,
    titulo: input.titulo.trim(),
    descripcion: input.descripcion?.trim() ?? "",
    flyer_url: input.flyer_url?.trim() ? input.flyer_url.trim() : null,
    fecha: input.fecha?.trim() ? input.fecha.trim() : new Date().toISOString().slice(0, 10),
  }
  return dbCrearIncidente(data)
}

export async function eliminarIncidente(id: string): Promise<void> {
  const old = await dbGetIncidenteById(id)
  if (old?.flyer_url) {
    await deleteFlyerFromS3(old.flyer_url)
  }
  await dbEliminarIncidente(id)
}

export async function actualizarIncidente(id: string, input: CrearIncidenteInput): Promise<Incidente> {
  if (!input.region?.trim()) throw new Error("La region es obligatoria")
  if (!input.titulo?.trim()) throw new Error("El titulo es obligatorio")

  const old = await dbGetIncidenteById(id)
  
  const finalFlyerUrl = input.flyer_url?.trim() ? input.flyer_url.trim() : null
  
  // Si habia un flyer anterior y es diferente al nuevo (o el nuevo es null), lo borramos de S3.
  if (old?.flyer_url && old.flyer_url !== finalFlyerUrl) {
    await deleteFlyerFromS3(old.flyer_url)
  }

  const data: NuevoIncidente = {
    region: input.region.trim(),
    ciudad: input.ciudad?.trim() ? input.ciudad.trim() : null,
    categoria: input.categoria,
    titulo: input.titulo.trim(),
    descripcion: input.descripcion?.trim() ?? "",
    flyer_url: finalFlyerUrl,
    fecha: input.fecha?.trim() ? input.fecha.trim() : new Date().toISOString().slice(0, 10),
  }
  return dbActualizarIncidente(id, data)
}

export async function uploadFlyerAction(formData: FormData): Promise<string> {
  const file = formData.get("flyer") as File
  if (!file) throw new Error("No se envio ningun archivo")
  return uploadFlyerToS3(file)
}
