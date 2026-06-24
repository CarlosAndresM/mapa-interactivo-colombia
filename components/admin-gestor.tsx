"use client"

import { useEffect, useState } from "react"
import { Trash2, Pencil, Check } from "lucide-react"
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
  type GrupoRegional
} from "@/lib/incidentes"
import { crearIncidente, eliminarIncidente, uploadFlyerAction, actualizarIncidente, getGruposRegionales, crearGrupoRegional, actualizarGrupoRegional, eliminarGrupoRegional } from "@/app/actions"

interface AdminGestorProps {
  open: boolean
  onClose: () => void
  incidentes: Incidente[]
  onChanged: () => void
}

export function AdminGestor({ open, onClose, incidentes, onChanged }: AdminGestorProps) {
  const [tab, setTab] = useState<"reportes" | "grupos">("reportes")
  const [error, setError] = useState<string | null>(null)

  // -- ESTADO: REPORTES --
  const [region, setRegion] = useState<string>("")
  const [categoria, setCategoria] = useState<CategoriaId>("manifestaciones")
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [flyerUrl, setFlyerUrl] = useState<string>("")
  const [flyerFile, setFlyerFile] = useState<File | null>(null)
  const [fecha, setFecha] = useState<string>(new Date().toISOString().slice(0, 10))
  const [guardando, setGuardando] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // -- ESTADO: GRUPOS --
  const [grupos, setGrupos] = useState<GrupoRegional[]>([])
  const [grupoNombre, setGrupoNombre] = useState("")
  const [grupoDepartamentos, setGrupoDepartamentos] = useState<string[]>([])
  const [editingGrupoId, setEditingGrupoId] = useState<string | null>(null)
  const [guardandoGrupo, setGuardandoGrupo] = useState(false)

  useEffect(() => {
    if (open) {
      loadGrupos()
    }
  }, [open])

  async function loadGrupos() {
    try {
      const data = await getGruposRegionales()
      setGrupos(data)
    } catch (err) {
      console.error(err)
    }
  }

  // --- HANDLERS: REPORTES ---
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

  // --- HANDLERS: GRUPOS ---
  function resetGrupoForm() {
    setGrupoNombre("")
    setGrupoDepartamentos([])
    setEditingGrupoId(null)
    setError(null)
  }

  function onEditGrupo(g: GrupoRegional) {
    setGrupoNombre(g.nombre)
    setGrupoDepartamentos(g.departamentos)
    setEditingGrupoId(g.id)
    setError(null)
  }

  async function onSubmitGrupo(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!grupoNombre.trim()) return setError("El nombre del grupo es obligatorio")
    if (grupoDepartamentos.length === 0) return setError("Selecciona al menos un departamento")
    
    setGuardandoGrupo(true)
    try {
      if (editingGrupoId) {
        await actualizarGrupoRegional(editingGrupoId, grupoNombre, grupoDepartamentos)
      } else {
        await crearGrupoRegional(grupoNombre, grupoDepartamentos)
      }
      resetGrupoForm()
      await loadGrupos()
      onChanged() // To trigger parent re-fetch si necesita reload de filtros
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el grupo")
    } finally {
      setGuardandoGrupo(false)
    }
  }

  async function onEliminarGrupo(id: string) {
    await eliminarGrupoRegional(id)
    await loadGrupos()
    onChanged()
  }

  function toggleDepartamento(d: string) {
    setGrupoDepartamentos((prev) => 
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] gap-0 overflow-y-auto p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>Gestor de informacion</DialogTitle>
          <DialogDescription>Administra los reportes y grupos regionales del mapa.</DialogDescription>
        </DialogHeader>

        {/* TABS HEADER */}
        <div className="flex border-b border-border px-6">
          <button 
            type="button"
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === "reportes" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            onClick={() => { setTab("reportes"); setError(null) }}
          >
            Reportes
          </button>
          <button 
            type="button"
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === "grupos" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            onClick={() => { setTab("grupos"); setError(null) }}
          >
            Grupos Regionales
          </button>
        </div>

        {tab === "reportes" && (
          <div className="grid grid-cols-1 gap-6 px-6 py-5 md:grid-cols-2">
            {/* Formulario Reportes */}
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground">
                {editingId ? "Editando reporte" : "Nuevo reporte"}
              </h3>

              <div className="flex flex-col gap-1.5">
                <Label>Departamento</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTAMENTOS.map((d) => (
                      <SelectItem key={d} value={d}>{capitalizar(d)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaId)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
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
                <Textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Detalle del reporte" rows={3} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Flyer (imagen opcional)</Label>
                {(flyerUrl || flyerFile) ? (
                  <div className="relative w-max mt-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={flyerFile ? URL.createObjectURL(flyerFile) : flyerUrl} alt="Preview" className="h-32 w-auto rounded-md object-cover border shadow-sm" />
                    <button type="button" onClick={() => { setFlyerUrl(""); setFlyerFile(null) }} className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm">×</button>
                  </div>
                ) : (
                  <Input type="file" accept="image/*" onChange={(e) => setFlyerFile(e.target.files?.[0] || null)} />
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
                {editingId && <Button type="button" variant="outline" onClick={resetForm} disabled={guardando}>Cancelar</Button>}
              </div>
            </form>

            {/* Listado Reportes */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-foreground">Reportes registrados <span className="text-muted-foreground">({incidentes.length})</span></h3>
              <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
                {incidentes.map((inc) => {
                  const cat = getCategoria(inc.categoria)
                  return (
                    <div key={inc.id} className="flex items-start justify-between gap-2 rounded-lg border border-border bg-card p-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ backgroundColor: cat.color }} /><span className="truncate text-sm font-medium">{inc.titulo}</span></div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{capitalizar(inc.region)} · {inc.fecha}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={() => onEdit(inc)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"><Pencil className="size-4" /></button>
                        <button type="button" onClick={() => onEliminar(inc.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-4" /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {tab === "grupos" && (
          <div className="grid grid-cols-1 gap-6 px-6 py-5 md:grid-cols-2">
            {/* Formulario Grupos */}
            <form onSubmit={onSubmitGrupo} className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground">
                {editingGrupoId ? "Editando grupo regional" : "Nuevo grupo regional"}
              </h3>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="grupoNombre">Nombre del grupo</Label>
                <Input id="grupoNombre" value={grupoNombre} onChange={(e) => setGrupoNombre(e.target.value)} placeholder="Ej. Region Caribe" />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Departamentos seleccionados ({grupoDepartamentos.length})</Label>
                <div className="grid grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto p-2 border rounded-md bg-muted/20">
                  {DEPARTAMENTOS.map(d => {
                    const isSelected = grupoDepartamentos.includes(d)
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDepartamento(d)}
                        className={`flex items-center justify-between text-left px-3 py-2 text-sm rounded-md transition-colors ${isSelected ? "bg-primary text-primary-foreground font-medium" : "bg-card text-foreground hover:bg-muted"}`}
                      >
                        <span className="truncate">{capitalizar(d)}</span>
                        {isSelected && <Check className="size-4 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-2 mt-2">
                <Button type="submit" disabled={guardandoGrupo} className="flex-1">
                  {guardandoGrupo ? "Guardando..." : editingGrupoId ? "Actualizar grupo" : "Crear grupo"}
                </Button>
                {editingGrupoId && <Button type="button" variant="outline" onClick={resetGrupoForm} disabled={guardandoGrupo}>Cancelar</Button>}
              </div>
            </form>

            {/* Listado Grupos */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-foreground">Grupos creados <span className="text-muted-foreground">({grupos.length})</span></h3>
              <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
                {grupos.map((g) => (
                  <div key={g.id} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-semibold text-foreground">{g.nombre}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={() => onEditGrupo(g)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"><Pencil className="size-4" /></button>
                        <button type="button" onClick={() => onEliminarGrupo(g.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-4" /></button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {g.departamentos.map(capitalizar).join(", ")}
                    </p>
                  </div>
                ))}
                {grupos.length === 0 && (
                  <p className="text-sm text-muted-foreground">No hay grupos creados. Agrupa departamentos para filtrar mas facil en el mapa.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
