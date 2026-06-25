"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { capitalizar, getCategoria, type Incidente } from "@/lib/incidentes"
import { X } from "lucide-react"

interface RegionModalProps {
  titulo: string | null
  incidentes: Incidente[]
  onClose: () => void
}

export function RegionModal({ titulo, incidentes, onClose }: RegionModalProps) {
  const [imagenAmpliaba, setImagenAmpliaba] = useState<string | null>(null)
  const abierto = titulo !== null

  // Cerrar la imagen si cerramos el modal
  const handleClose = () => {
    setImagenAmpliaba(null)
    onClose()
  }

  return (
    <>
      <Dialog open={abierto} onOpenChange={(o) => !o && handleClose()}>
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
                    <div 
                      className="relative h-40 w-full shrink-0 overflow-hidden rounded-md border border-border bg-muted/50 sm:h-32 sm:w-32 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setImagenAmpliaba(inc.flyer_url)}
                    >
                      <Image
                        src={inc.flyer_url || "/placeholder.svg"}
                        alt={`Flyer: ${inc.titulo}`}
                        fill
                        className="object-contain"
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

      {/* Visor de imagen en pantalla completa */}
      {imagenAmpliaba && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <button
            onClick={() => setImagenAmpliaba(null)}
            className="absolute right-4 top-4 z-[110] rounded-full bg-white/10 p-2 text-white hover:bg-white/25 transition-colors"
            aria-label="Cerrar imagen"
          >
            <X className="size-6" />
          </button>
          <div className="relative h-full w-full max-w-5xl" onClick={() => setImagenAmpliaba(null)}>
            <Image
              src={imagenAmpliaba}
              alt="Imagen en tamaño completo"
              fill
              className="object-contain"
              sizes="100vw"
              crossOrigin="anonymous"
            />
          </div>
        </div>
      )}
    </>
  )
}
