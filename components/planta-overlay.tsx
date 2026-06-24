"use client"

import { useState, useEffect } from "react"
import { Rnd } from "react-rnd"
import { type Planta, type NuevaPlanta } from "@/lib/db"
import { Trash2, GripHorizontal } from "lucide-react"

interface PlantaOverlayProps {
  planta: Planta
  onUpdate: (id: string, data: Partial<NuevaPlanta>) => void
  onDelete: (id: string) => void
  scale?: number
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

export function PlantaOverlay({ planta, onUpdate, onDelete, scale = 1 }: PlantaOverlayProps) {
  const [localData, setLocalData] = useState<Planta>(planta)
  const [isDirty, setIsDirty] = useState(false)

  const handleDragStop = (e: any, d: any) => {
    const newX = Math.round(d.x)
    const newY = Math.round(d.y)
    if (newX === localData.pos_x && newY === localData.pos_y) return
    const newData = { ...localData, pos_x: newX, pos_y: newY }
    setLocalData(newData)
    onUpdate(planta.id, { pos_x: newX, pos_y: newY })
  }

  const handleResizeStop = (e: any, direction: any, ref: any, delta: any, position: any) => {
    const newWidth = Math.round(parseInt(ref.style.width, 10))
    const newHeight = Math.round(parseInt(ref.style.height, 10))
    const newX = Math.round(position.x)
    const newY = Math.round(position.y)
    
    const newData = {
      ...localData,
      width: newWidth,
      height: newHeight,
      pos_x: newX,
      pos_y: newY,
    }
    setLocalData(newData)
    onUpdate(planta.id, {
      width: newWidth,
      height: newHeight,
      pos_x: newX,
      pos_y: newY,
    })
  }

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
    <Rnd
      size={{ width: localData.width, height: localData.height }}
      position={{ x: localData.pos_x, y: localData.pos_y }}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      onMouseDown={(e: any) => e.stopPropagation()}
      onTouchStart={(e: any) => e.stopPropagation()}
      onPointerDown={(e: any) => e.stopPropagation()}
      bounds="parent"
      minWidth={120}
      minHeight={80}
      scale={scale}
      dragHandleClassName="drag-handle"
      resizeHandleStyles={{
        bottomRight: { width: 30, height: 30, right: -15, bottom: -15 },
        bottomLeft: { width: 30, height: 30, left: -15, bottom: -15 },
        topRight: { width: 30, height: 30, right: -15, top: -15 },
        topLeft: { width: 30, height: 30, left: -15, top: -15 },
      }}
      className={`absolute z-50 flex flex-col overflow-hidden rounded-md shadow-lg transition-colors duration-200 bg-white text-black select-text ${
        isDirty ? "ring-2 ring-red-500" : "ring-1 ring-black/10"
      }`}
    >
      {/* Header / Drag Handle */}
      <div 
        className="flex items-center justify-between px-2 py-1"
        style={{ backgroundColor: localData.color, color: textColor }}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
          <div className="drag-handle cursor-move opacity-60 hover:opacity-100 p-0.5 rounded hover:bg-black/10 transition-colors shrink-0" title="Arrastrar">
            <GripHorizontal className="size-3 md:size-4" />
          </div>
          <input
            type="color"
            value={localData.color}
            onChange={(e) => handleChange("color", e.target.value)}
            onBlur={handleBlur}
            className="h-5 w-5 md:h-6 md:w-6 cursor-pointer rounded border-0 p-0 bg-transparent shrink-0"
            title="Cambiar color del encabezado"
          />
          <input
            type="text"
            value={localData.titulo}
            onChange={(e) => handleChange("titulo", e.target.value)}
            onBlur={handleBlur}
            placeholder="Título..."
            className="w-full min-w-0 bg-transparent text-xs md:text-sm font-bold placeholder:text-current/50 focus:outline-none"
            style={{ color: textColor }}
          />
        </div>
        <button
          onClick={() => onDelete(planta.id)}
          className="rounded p-1 opacity-50 hover:bg-black/10 hover:opacity-100 ml-1 shrink-0 text-current"
          title="Eliminar elemento"
        >
          <Trash2 className="size-3 md:size-4" />
        </button>
      </div>

      {/* Body */}
      <textarea
        value={localData.contenido}
        onChange={(e) => handleChange("contenido", e.target.value)}
        onBlur={handleBlur}
        placeholder="Descripción..."
        className="flex-1 w-full resize-none bg-transparent p-1.5 md:p-2 text-xs md:text-sm focus:outline-none text-black placeholder:text-gray-400 leading-snug"
      />
    </Rnd>
  )
}
