"use client"

import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { capitalizar, getCategoria, type Incidente } from "@/lib/incidentes"

interface RegionModalProps {
  titulo: string | null
  incidentes: Incidente[]
  onClose: () => void
}

export function RegionModal({ titulo, incidentes, onClose }: RegionModalProps) {
  const abierto = titulo !== null

  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-balance">{titulo ?? ""}</DialogTitle>
          <DialogDescription>
            {incidentes.length === 0
              ? "No hay reportes registrados en esta region."
              : `${incidentes.length} ${incidentes.length === 1 ? "reporte registrado" : "reportes registrados"}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {incidentes.map((inc) => {
            const cat = getCategoria(inc.categoria)
            return (
              <article key={inc.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row">
                {inc.flyer_url && (
                  <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-md border border-border sm:h-32 sm:w-32">
                    <Image
                      src={inc.flyer_url || "/placeholder.svg"}
                      alt={`Flyer: ${inc.titulo}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 128px"
                      crossOrigin="anonymous"
                    />
                  </div>
                )}
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-background"
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.nombre}
                    </span>
                    {inc.ciudad && (
                      <span className="text-xs font-medium text-foreground">{capitalizar(inc.ciudad)}</span>
                    )}
                    <time className="text-xs text-muted-foreground">{inc.fecha}</time>
                  </div>
                  <h3 className="text-pretty font-medium text-foreground">{inc.titulo}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{inc.descripcion}</p>
                </div>
              </article>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
