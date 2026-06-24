"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { ColombiaMap } from "./colombia-map"
import { MetricsPanel } from "./metrics-panel"
import { RegionModal } from "./region-modal"
import { AdminGestor } from "./admin-gestor"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CATEGORIAS,
  getCategoria,
  normalizarRegion,
  capitalizar,
  type CategoriaId,
  type Incidente,
  type GrupoRegional
} from "@/lib/incidentes"
import { getIncidentes, getGruposRegionales, getPlantas, crearPlanta, actualizarPlanta, eliminarPlanta } from "@/app/actions"
import { type Planta, type NuevaPlanta } from "@/lib/db"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

const COLOR_TOTAL = "#334155" // slate, para la vista "todas"

export function Dashboard() {
  const { data: incidentes = [], isLoading, mutate: mutateIncidentes } = useSWR<Incidente[]>("incidentes", getIncidentes)
  const { data: grupos = [], mutate: mutateGrupos } = useSWR<GrupoRegional[]>("grupos", getGruposRegionales)
  
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaId | "todas">("todas")
  const [grupoActivoId, setGrupoActivoId] = useState<string | "todos">("todos")
  const [regionSeleccionada, setRegionSeleccionada] = useState<string | null>(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [modoPlantas, setModoPlantas] = useState(false)

  const { data: plantas = [], mutate: mutatePlantas } = useSWR<Planta[]>("plantas", getPlantas)

  const handleAgregarPlanta = async () => {
    try {
      await crearPlanta({ titulo: "Nueva Nota", color: "#4ade80", pos_x: 50, pos_y: 50 })
      mutatePlantas()
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdatePlanta = async (id: string, data: Partial<NuevaPlanta>) => {
    try {
      await actualizarPlanta(id, data)
      mutatePlantas()
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeletePlanta = async (id: string) => {
    try {
      await eliminarPlanta(id)
      mutatePlantas()
    } catch (e) {
      console.error(e)
    }
  }

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

  // 1. Filtrar por Grupo Regional
  const incidentesGrupo = useMemo(() => {
    if (grupoActivoId === "todos") return incidentesNorm
    const grupo = grupos.find(g => g.id === grupoActivoId)
    if (!grupo) return incidentesNorm
    return incidentesNorm.filter(i => grupo.departamentos.includes(i.region))
  }, [incidentesNorm, grupoActivoId, grupos])

  // 2. Calcular metricas para el panel basado en incidentesGrupo
  const conteoPorCategoria = useMemo(() => {
    const base: Record<CategoriaId, number> = { fake_news: 0, bloqueo_vias: 0, manifestaciones: 0 }
    for (const inc of incidentesGrupo) base[inc.categoria] = (base[inc.categoria] ?? 0) + 1
    return base
  }, [incidentesGrupo])

  const total = incidentesGrupo.length

  // 3. Conteo por region (para el mapa) segun la categoria activa y el grupo activo
  const { conteoPorRegion, maxConteoRegion } = useMemo(() => {
    const filtrados =
      categoriaActiva === "todas" ? incidentesGrupo : incidentesGrupo.filter((i) => i.categoria === categoriaActiva)
    const cRegion: Record<string, number> = {}
    
    for (const inc of filtrados) {
      cRegion[inc.region] = (cRegion[inc.region] ?? 0) + 1
    }
    
    const mRegion = Object.values(cRegion).reduce((m, v) => Math.max(m, v), 0)
    
    return { conteoPorRegion: cRegion, maxConteoRegion: mRegion }
  }, [incidentesGrupo, categoriaActiva])

  const colorActivo = categoriaActiva === "todas" ? COLOR_TOTAL : getCategoria(categoriaActiva).color

  const incidentesFiltradosModal = useMemo(() => {
    if (!regionSeleccionada) return []
    return incidentesGrupo.filter(
      (i) =>
        i.region === regionSeleccionada &&
        (categoriaActiva === "todas" || i.categoria === categoriaActiva),
    )
  }, [incidentesGrupo, regionSeleccionada, categoriaActiva])

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
        <aside className="shrink-0 border-b border-border bg-background p-4 lg:w-[320px] lg:border-b-0 lg:border-r overflow-y-auto max-h-[45vh] lg:max-h-none flex flex-col gap-6">
          
          {/* Filtro de Grupos Regionales */}
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Filtro Regional</h2>
            <Select value={grupoActivoId} onValueChange={setGrupoActivoId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Toda Colombia</SelectItem>
                {grupos.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pb-8">
            <h2 className="mb-3 hidden text-sm font-medium uppercase tracking-wide text-muted-foreground lg:block">Categorias</h2>
            <MetricsPanel
              conteoPorCategoria={conteoPorCategoria}
              total={total}
              categoriaActiva={categoriaActiva}
              onSelectCategoria={setCategoriaActiva}
            />
          </div>

          {/* MODO PLANTAS */}
          <div className="flex flex-col gap-4 border-t border-border pt-4 mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch 
                  id="modo-plantas" 
                  checked={modoPlantas} 
                  onCheckedChange={setModoPlantas} 
                />
                <Label htmlFor="modo-plantas" className="font-medium uppercase tracking-wide">
                  Notas
                </Label>
              </div>
            </div>
            
            {modoPlantas && (
              <Button onClick={handleAgregarPlanta} className="w-full gap-2 bg-[#4ade80] hover:bg-[#22c55e] text-black">
                <Plus className="size-4" /> Agregar Nota
              </Button>
            )}
          </div>
        </aside>

        <section id="map-section" className="relative flex flex-1 flex-col overflow-hidden bg-card">
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
                plantas={plantas}
                modoPlantas={modoPlantas}
                onUpdatePlanta={handleUpdatePlanta}
                onDeletePlanta={handleDeletePlanta}
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
        onChanged={() => {
          mutateIncidentes()
          mutateGrupos()
        }}
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
