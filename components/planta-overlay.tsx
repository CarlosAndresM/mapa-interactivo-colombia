"use client"

import { useState } from "react"
import { type Planta, type NuevaPlanta } from "@/lib/db"
import { Trash2 } from "lucide-react"

interface PlantaOverlayProps {
  planta: Planta
  onUpdate: (id: string, data: Partial<NuevaPlanta>) => void
  onDelete: (id: string) => void
}

// Función auxiliar para saber si el texto debe ser blanco o negro según el fondo
function getContrastYIQ(hexcolor: string) {
  hexcolor = hexcolor.replace("#", "")
  if (hexcolor.length === 3) {
    hexcolor = hexcolor.split("").map((h) => h + h).join("")
  }
  const r = parseInt(hexcolor.substring(0, 2), 16)
  const g = parseInt(hexcolor.substring(2, 4), 16)
  const b = parseInt(hexcolor.substring(4, 6), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? "black" : "white"
}

export function PlantaOverlay({ planta, onUpdate, onDelete }: PlantaOverlayProps) {
  const [localData, setLocalData] = useState<Planta>(planta)
  const [isDirty, setIsDirty] = useState(false)

  const handleChange = (field: keyof Planta, value: string) => {
    setLocalData((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handleBlur = () => {
    if (isDirty) {
      onUpdate(planta.id, {
        titulo: localData.titulo,
        contenido: localData.contenido,
        color: localData.color,
      })
      setIsDirty(false)
    }
  }

  const textColor = getContrastYIQ(localData.color)

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-md shadow-sm transition-colors duration-200 bg-card text-card-foreground border ${
        isDirty ? "border-red-500 ring-1 ring-red-500" : "border-border"
      } h-48`}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{ backgroundColor: localData.color, color: textColor }}
      >
        <div className="flex items-center gap-2 flex-1 overflow-hidden">
          <input
            type="color"
            value={localData.color}
            onChange={(e) => handleChange("color", e.target.value)}
            onBlur={handleBlur}
            className="h-6 w-6 cursor-pointer rounded border-0 p-0 bg-transparent shrink-0"
            title="Cambiar color del encabezado"
          />
          <input
            type="text"
            value={localData.titulo}
            onChange={(e) => handleChange("titulo", e.target.value)}
            onBlur={handleBlur}
            placeholder="Título de la nota..."
            className="w-full min-w-0 bg-transparent text-sm font-bold placeholder:text-current/50 focus:outline-none"
            style={{ color: textColor }}
          />
        </div>
        <button
          onClick={() => onDelete(planta.id)}
          className="rounded p-1.5 opacity-70 hover:bg-black/20 hover:opacity-100 ml-1 shrink-0 transition-all text-current"
          title="Eliminar nota"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {/* Body */}
      <textarea
        value={localData.contenido}
        onChange={(e) => handleChange("contenido", e.target.value)}
        onBlur={handleBlur}
        placeholder="Escribe el contenido de la nota aquí..."
        className="flex-1 w-full resize-none bg-transparent p-3 text-sm focus:outline-none placeholder:text-muted-foreground leading-relaxed"
      />
    </div>
  )
}
