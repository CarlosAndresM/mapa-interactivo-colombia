"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { ColombiaMap } from "./colombia-map"
import { MetricsPanel } from "./metrics-panel"
import { RegionModal } from "./region-modal"
import { AdminGestor } from "./admin-gestor"
import {
  CATEGORIAS,
  getCategoria,
  normalizarRegion,
  capitalizar,
  type CategoriaId,
  type Incidente,
} from "@/lib/incidentes"
import { getIncidentes } from "@/app/actions"

const COLOR_TOTAL = "#334155" // slate, para la vista "todas"

export function Dashboard() {
  const { data: incidentes = [], isLoading, mutate } = useSWR<Incidente[]>("incidentes", getIncidentes)
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaId | "todas">("todas")
  const [regionSeleccionada, setRegionSeleccionada] = useState<string | null>(null)
  const [showAdmin, setShowAdmin] = useState(false)

  useEffect(() => {
    let ctrlCount = 0
    let lastCtrlTime = 0

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Control") {
        const now = Date.now()
        // If pressed within 500ms of the last one, increment counter
        if (now - lastCtrlTime < 500) {
          ctrlCount++
        } else {
          // Otherwise, start over
          ctrlCount = 1
        }
        lastCtrlTime = now

        if (ctrlCount === 3) {
          setShowAdmin(true)
          ctrlCount = 0 // Reset after opening
        }
      } else {
        // Reset if another key is pressed
        ctrlCount = 0
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Normaliza la region de cada incidente una sola vez.
  const incidentesNorm = useMemo(
    () => incidentes.map((i) => ({ ...i, region: normalizarRegion(i.region) })),
    [incidentes],
  )

  const conteoPorCategoria = useMemo(() => {
    const base: Record<CategoriaId, number> = { fake_news: 0, bloqueo_vias: 0, manifestaciones: 0 }
    for (const inc of incidentesNorm) base[inc.categoria] = (base[inc.categoria] ?? 0) + 1
    return base
  }, [incidentesNorm])

  const total = incidentesNorm.length

  // Conteo por region segun la categoria activa.
  const { conteoPorRegion, maxConteoRegion } = useMemo(() => {
    const filtrados =
      categoriaActiva === "todas" ? incidentesNorm : incidentesNorm.filter((i) => i.categoria === categoriaActiva)
    const cRegion: Record<string, number> = {}
    
    for (const inc of filtrados) {
      cRegion[inc.region] = (cRegion[inc.region] ?? 0) + 1
    }
    
    const mRegion = Object.values(cRegion).reduce((m, v) => Math.max(m, v), 0)
    
    return { conteoPorRegion: cRegion, maxConteoRegion: mRegion }
  }, [incidentesNorm, categoriaActiva])

  const colorActivo = categoriaActiva === "todas" ? COLOR_TOTAL : getCategoria(categoriaActiva).color

  const incidentesFiltradosModal = useMemo(() => {
    if (!regionSeleccionada) return []
    return incidentesNorm.filter(
      (i) =>
        i.region === regionSeleccionada &&
        (categoriaActiva === "todas" || i.categoria === categoriaActiva),
    )
  }, [incidentesNorm, regionSeleccionada, categoriaActiva])

  const modalTitulo = useMemo(() => {
    if (!regionSeleccionada) return null
    return capitalizar(regionSeleccionada)
  }, [regionSeleccionada])

  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      <header className="shrink-0 bg-[#0A1B3F] shadow-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-0.5 px-4 py-4 sm:px-6">
          <h1 className="text-balance text-xl font-bold uppercase text-white sm:text-2xl md:text-3xl leading-tight">
            Informe manifestaciones, concentraciones y bloqueo de vias
          </h1>
          <p className="text-sm md:text-base font-bold text-[#C4E510] uppercase tracking-wide">
            Seguimiento post electoral
          </p>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Panel de Metricas: horizontal (scroll) en móvil, vertical (sidebar) en PC */}
        <aside className="shrink-0 border-b border-border bg-background p-4 lg:w-[320px] lg:border-b-0 lg:border-r lg:overflow-y-auto">
          <h2 className="mb-3 hidden text-sm font-medium uppercase tracking-wide text-muted-foreground lg:block">Categorias</h2>
          <MetricsPanel
            conteoPorCategoria={conteoPorCategoria}
            total={total}
            categoriaActiva={categoriaActiva}
            onSelectCategoria={setCategoriaActiva}
          />
        </aside>

        <section className="relative flex flex-1 flex-col overflow-hidden bg-card">
          {/* Título de la categoría y leyenda superpuestos en el mapa */}
          <div className="absolute left-4 top-4 z-10 hidden flex-wrap items-center gap-3 rounded-lg border border-border bg-background/80 px-4 py-2 shadow-sm backdrop-blur-md md:flex">
            <h2 className="font-medium text-foreground">
              {categoriaActiva === "todas" ? "Todas las categorias" : getCategoria(categoriaActiva).nombre}
            </h2>
            <Leyenda />
          </div>
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Cargando mapa...
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              <ColombiaMap
                conteoRegion={conteoPorRegion}
                maxRegion={maxConteoRegion}
                colorActivo={colorActivo}
                onVerDepartamento={(r) => {
                  setRegionSeleccionada(r)
                }}
              />
            </div>
          )}
        </section>
      </div>

      <RegionModal
        titulo={modalTitulo}
        incidentes={incidentesFiltradosModal}
        onClose={() => {
          setRegionSeleccionada(null)
        }}
      />

      <AdminGestor
        open={showAdmin}
        onClose={() => setShowAdmin(false)}
        incidentes={incidentesNorm}
        onChanged={() => mutate()}
      />
    </main>
  )
}

function Leyenda() {
  return (
    <div className="flex flex-wrap items-center gap-3 border-l border-border pl-3">
      {CATEGORIAS.map((c) => (
        <div key={c.id} className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: c.color }} />
          <span className="text-xs text-muted-foreground">{c.nombre}</span>
        </div>
      ))}
    </div>
  )
}
