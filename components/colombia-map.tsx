"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps"
import { geoMercator, geoCentroid } from "d3-geo"
import { feature } from "topojson-client"
import { ArrowLeft, Building2 } from "lucide-react"
import { capitalizar, normalizarRegion } from "@/lib/incidentes"

const W = 800
const H = 760
const PAD = 24

async function loadGeo(): Promise<any> {
  return fetch("/geo/colombia.geo.json").then((r) => r.json())
}

interface ColombiaMapProps {
  conteoRegion: Record<string, number>
  maxRegion: number
  colorActivo: string
  onVerDepartamento: (region: string) => void
}

export function ColombiaMap({
  conteoRegion,
  maxRegion,
  colorActivo,
  onVerDepartamento,
}: ColombiaMapProps) {
  const { data: geo } = useSWR("geo", loadGeo, { revalidateOnFocus: false })
  const [hover, setHover] = useState<{ nombre: string; count: number } | null>(null)
  const [position, setPosition] = useState({ coordinates: [-74, 4.2] as [number, number], zoom: 1 })

  function estilo(count: number, max: number) {
    const tieneDatos = count > 0
    const intensidad = max > 0 ? count / max : 0
    return {
      fill: tieneDatos ? colorActivo : "var(--color-muted)",
      // Las regiones en cero quedan claramente visibles (gris medio), no casi transparentes.
      fillOpacity: tieneDatos ? 0.35 + 0.6 * intensidad : 0.9,
    }
  }

  if (!geo) {
    return (
      <div className="flex h-[460px] items-center justify-center text-sm text-muted-foreground">
        Cargando mapa...
      </div>
    )
  }

  return (
    <div className="relative flex h-full w-full flex-col select-none">

      <div className="flex-1 w-full overflow-x-auto overflow-y-hidden pb-4">
        <div className="h-full min-w-[600px] md:min-w-0">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ center: [-74, 4.2], scale: 2200 }}
            width={W}
            height={H}
            style={{ width: "100%", height: "100%" }}
          >
            <ZoomableGroup
              zoom={position.zoom}
              center={position.coordinates}
              onMoveEnd={(pos) => setPosition(pos)}
              translateExtent={[[0, 0], [W, H]]}
            >
          <Geographies geography={geo}>
            {({ geographies }) => (
              <>
                {geographies.map((g: any) => {
                  const nombre = normalizarRegion(String(g.properties.NOMBRE_DPT))
                  const count = conteoRegion[nombre] ?? 0
                  const s = estilo(count, maxRegion)
                  return (
                    <Geography
                      key={g.rsmKey}
                      geography={g}
                      onMouseEnter={() => setHover({ nombre, count })}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => onVerDepartamento(nombre)}
                      style={{
                        default: {
                          fill: s.fill,
                          fillOpacity: s.fillOpacity,
                          stroke: "#000",
                          strokeWidth: 0.75,
                          outline: "none",
                          transition: "fill-opacity 150ms, filter 150ms",
                        },
                        hover: {
                          fill: s.fill,
                          fillOpacity: Math.min(1, s.fillOpacity + 0.1),
                          stroke: "var(--color-foreground)",
                          strokeWidth: 1.25,
                          outline: "none",
                          cursor: "pointer",
                          filter: "brightness(1.05)",
                        },
                        pressed: { fill: s.fill, fillOpacity: 1, outline: "none" },
                      }}
                    />
                  )
                })}
                {geographies.map((g) => {
                  const nombre = normalizarRegion(String(g.properties.NOMBRE_DPT))
                  const count = conteoRegion[nombre] ?? 0
                  const centroid = geoCentroid(g)
                  const isHovered = hover?.nombre === nombre
                  return (
                    <Marker key={`label-${g.rsmKey}`} coordinates={centroid}>
                      <text
                        className="transition-opacity duration-200"
                        textAnchor="middle"
                        y={3}
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "11px",
                          fontWeight: 600,
                          fill: "#000",
                          pointerEvents: "none",
                          textShadow: "1px 1px 2px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.8)"
                        }}
                      >
                        <tspan className={isHovered ? "" : "max-md:inline md:hidden"}>
                          {nombre === "san andres providencia y santa catalina" ? "San Andrés" : capitalizar(nombre)} -{" "}
                        </tspan>
                        <tspan>{count}</tspan>
                      </text>
                    </Marker>
                  )
                })}
              </>
            )}
          </Geographies>
            </ZoomableGroup>
          </ComposableMap>
        </div>
      </div>

      {hover && (
        <div className="pointer-events-none absolute left-1/2 top-12 -translate-x-1/2 rounded-md border border-border bg-popover px-3 py-1.5 text-sm font-medium text-popover-foreground shadow-sm">
          {capitalizar(hover.nombre)}
          <span className="ml-2 text-muted-foreground">
            {hover.count} {hover.count === 1 ? "reporte" : "reportes"}
          </span>
        </div>
      )}
    </div>
  )
}
