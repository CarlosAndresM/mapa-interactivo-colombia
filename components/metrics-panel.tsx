"use client"

import { CATEGORIAS, type CategoriaId } from "@/lib/incidentes"
import { cn } from "@/lib/utils"

interface MetricsPanelProps {
  conteoPorCategoria: Record<CategoriaId, number>
  total: number
  categoriaActiva: CategoriaId | "todas"
  onSelectCategoria: (id: CategoriaId | "todas") => void
}

export function MetricsPanel({ conteoPorCategoria, total, categoriaActiva, onSelectCategoria }: MetricsPanelProps) {
  return (
    <>
      {/* Vista movil: select nativo ultracompacto */}
      <div className="w-full lg:hidden">
        <select
          className="w-full rounded-md border border-border bg-card p-2 text-sm text-foreground focus:border-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground/50"
          value={categoriaActiva}
          onChange={(e) => onSelectCategoria(e.target.value as CategoriaId | "todas")}
        >
          <option value="todas">Todas las categorias ({total})</option>
          {CATEGORIAS.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre} ({conteoPorCategoria[cat.id] ?? 0})
            </option>
          ))}
        </select>
      </div>

      {/* Vista PC: tarjetas completas */}
      <div className="hidden flex-col gap-3 lg:flex">
        <button
          type="button"
          onClick={() => onSelectCategoria("todas")}
          className={cn(
            "rounded-lg border bg-card p-4 text-left transition-colors hover:border-foreground/30",
            categoriaActiva === "todas" ? "border-foreground/60 ring-1 ring-foreground/20" : "border-border",
          )}
        >
          <p className="text-sm text-muted-foreground">Total de reportes</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">{total}</p>
        </button>

        {CATEGORIAS.map((cat) => {
          const count = conteoPorCategoria[cat.id] ?? 0
          const activo = categoriaActiva === cat.id
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategoria(cat.id)}
              className={cn(
                "rounded-lg border bg-card p-4 text-left transition-colors hover:border-foreground/30",
                activo ? "border-foreground/60 ring-1 ring-foreground/20" : "border-border",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-medium text-foreground">{cat.nombre}</span>
                </div>
                <span className="text-2xl font-semibold tabular-nums text-foreground">{count}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{cat.descripcion}</p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: cat.color }}
                />
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}
