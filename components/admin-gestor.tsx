"use client"

import { useEffect, useMemo, useState } from "react"
import { feature } from "topojson-client"
import { Trash2, Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CATEGORIAS,
  DEPARTAMENTOS,
  capitalizar,
  getCategoria,
  normalizarRegion,
  type CategoriaId,
  type Incidente,
} from "@/lib/incidentes"
import { crearIncidente, eliminarIncidente, uploadFlyerAction, actualizarIncidente } from "@/app/actions"

interface AdminGestorProps {
  open: boolean
  onClose: () => void
  incidentes: Incidente[]
  onChanged: () => void
}

const FLYERS_SUGERIDOS = ["/flyers/fake-news-1.png", "/flyers/bloqueo-1.png", "/flyers/manifestacion-1.png"]

export function AdminGestor({ open, onClose, incidentes, onChanged }: AdminGestorProps) {
  const [region, setRegion] = useState<string>("")
  const [categoria, setCategoria] = useState<CategoriaId>("manifestaciones")
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [flyerUrl, setFlyerUrl] = useState<string>("")
  const [flyerFile, setFlyerFile] = useState<File | null>(null)
  const [fecha, setFecha] = useState<string>(new Date().toISOString().slice(0, 10))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  function resetForm() {
    setRegion("")
    setCategoria("manifestaciones")
    setTitulo("")
    setDescripcion("")
    setFlyerUrl("")
    setFlyerFile(null)
    setFecha(new Date().toISOString().slice(0, 10))
    setEditingId(null)
    setError(null)
  }

  function onEdit(inc: Incidente) {
    setRegion(normalizarRegion(inc.region))
    setCategoria(inc.categoria)
    setTitulo(inc.titulo)
    setDescripcion(inc.descripcion || "")
    setFlyerUrl(inc.flyer_url || "")
    setFlyerFile(null)
    setFecha(inc.fecha)
    setEditingId(inc.id)
    setError(null)
  }


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!region) return setError("Selecciona un departamento")
    if (!titulo.trim()) return setError("Escribe un titulo")
    setGuardando(true)
    try {
      let finalFlyerUrl = flyerUrl || null
      if (flyerFile) {
        const formData = new FormData()
        formData.append("flyer", flyerFile)
        finalFlyerUrl = await uploadFlyerAction(formData)
      }
      const payload = {
        region,
        ciudad: null,
        categoria,
        titulo,
        descripcion,
        flyer_url: finalFlyerUrl,
        fecha,
      }

      if (editingId) {
        await actualizarIncidente(editingId, payload)
      } else {
        await crearIncidente(payload)
      }

      resetForm()
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar")
    } finally {
      setGuardando(false)
    }
  }

  async function onEliminar(id: string) {
    await eliminarIncidente(id)
    onChanged()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] gap-0 overflow-y-auto p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>Gestor de informacion</DialogTitle>
          <DialogDescription>Registra y administra los reportes que alimentan el mapa.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 px-6 py-5 md:grid-cols-2">
          {/* Formulario */}
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-foreground">
              {editingId ? "Editando reporte" : "Nuevo reporte"}
            </h3>

            <div className="flex flex-col gap-1.5">
              <Label>Departamento</Label>
              <Select
                value={region}
                onValueChange={(v) => {
                  setRegion(v)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un departamento" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTAMENTOS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {capitalizar(d)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            <div className="flex flex-col gap-1.5">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaId)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="titulo">Titulo</Label>
              <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Resumen del hecho" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="descripcion">Descripcion</Label>
              <Textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalle del reporte"
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Flyer (imagen opcional)</Label>
              {(flyerUrl || flyerFile) ? (
                <div className="relative w-max mt-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={flyerFile ? URL.createObjectURL(flyerFile) : flyerUrl}
                    alt="Preview flyer"
                    className="h-32 w-auto rounded-md object-cover border border-border shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFlyerUrl("")
                      setFlyerFile(null)
                    }}
                    title="Quitar imagen"
                    className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm transition-transform hover:scale-110"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setFlyerFile(file)
                    else setFlyerFile(null)
                  }}
                />
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button type="submit" disabled={guardando} className="flex-1">
                {guardando ? "Guardando..." : editingId ? "Actualizar reporte" : "Registrar reporte"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm} disabled={guardando}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>

          {/* Listado */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">
              Reportes registrados <span className="text-muted-foreground">({incidentes.length})</span>
            </h3>
            <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
              {incidentes.map((inc) => {
                const cat = getCategoria(inc.categoria)
                return (
                  <div
                    key={inc.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-border bg-card p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          aria-hidden="true"
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="truncate text-sm font-medium text-foreground">{inc.titulo}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {capitalizar(inc.region)}
                        {inc.ciudad ? ` · ${capitalizar(inc.ciudad)}` : ""} · {inc.fecha}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onEdit(inc)}
                        aria-label={`Editar ${inc.titulo}`}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEliminar(inc.id)}
                        aria-label={`Eliminar ${inc.titulo}`}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
              {incidentes.length === 0 && (
                <p className="text-sm text-muted-foreground">Aun no hay reportes.</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
