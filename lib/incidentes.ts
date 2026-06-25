export type CategoriaId = "fake_news" | "bloqueo_vias" | "manifestaciones"

export interface Categoria {
  id: CategoriaId
  nombre: string
  descripcion: string
  color: string
}

export const CATEGORIAS: Categoria[] = [
  {
    id: "bloqueo_vias",
    nombre: "Estado de vias",
    descripcion: "Cierres y bloqueos en corredores viales",
    color: "#d97706", // ambar
  },
  {
    id: "manifestaciones",
    nombre: "Orden publico",
    descripcion: "Marchas, plantones y concentraciones",
    color: "#22c55e", // verde
  },
  {
    id: "fake_news",
    nombre: "Fake News",
    descripcion: "Desinformacion y noticias falsas en circulacion",
    color: "#2563eb", // azul
  },
]

export function getCategoria(id: CategoriaId): Categoria {
  return CATEGORIAS.find((c) => c.id === id) ?? CATEGORIAS[0]
}

// Departamentos de Colombia, normalizados para coincidir con el GeoJSON (NOMBRE_DPT).
export const DEPARTAMENTOS: string[] = [
  "AMAZONAS",
  "ANTIOQUIA",
  "ARAUCA",
  "ARCHIPIELAGO DE SAN ANDRES PROVIDENCIA Y SANTA CATALINA",
  "ATLANTICO",
  "BOLIVAR",
  "BOYACA",
  "CALDAS",
  "CAQUETA",
  "CASANARE",
  "CAUCA",
  "CESAR",
  "CHOCO",
  "CORDOBA",
  "CUNDINAMARCA",
  "GUAINIA",
  "GUAVIARE",
  "HUILA",
  "LA GUAJIRA",
  "MAGDALENA",
  "META",
  "NARINO",
  "NORTE DE SANTANDER",
  "PUTUMAYO",
  "QUINDIO",
  "RISARALDA",
  "SANTAFE DE BOGOTA D.C",
  "SANTANDER",
  "SUCRE",
  "TOLIMA",
  "VALLE DEL CAUCA",
  "VAUPES",
  "VICHADA",
]

export interface Incidente {
  id: string
  region: string // departamento, debe coincidir con NOMBRE_DPT del GeoJSON
  ciudad: string | null // municipio (opcional)
  categoria: CategoriaId
  titulo: string
  descripcion: string
  flyer_url: string | null
  fecha: string
}

export interface GrupoRegional {
  id: string
  nombre: string
  departamentos: string[]
}

// Normaliza nombres (departamentos y ciudades) para hacer match con el GeoJSON.
export function normalizarRegion(nombre: string): string {
  return nombre
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function capitalizar(texto: string): string {
  return texto
    .toLowerCase()
    .split(" ")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ")
}

// Datos semilla que el backend inserta automaticamente si la tabla esta vacia.
export const INCIDENTES_SEED: Omit<Incidente, "id">[] = [
  {
    region: "SANTAFE DE BOGOTA D.C",
    ciudad: "BOGOTA",
    categoria: "manifestaciones",
    titulo: "Gran marcha en el centro",
    descripcion:
      "Convocatoria a concentracion en la Plaza de Bolivar con movilizacion hacia el centro administrativo.",
    flyer_url: "/flyers/manifestacion-1.png",
    fecha: "2026-06-22",
  },
  {
    region: "SANTAFE DE BOGOTA D.C",
    ciudad: "BOGOTA",
    categoria: "fake_news",
    titulo: "Audio falso atribuido a autoridad local",
    descripcion: "Circula por WhatsApp un audio manipulado que anuncia un supuesto toque de queda no oficial.",
    flyer_url: "/flyers/fake-news-1.png",
    fecha: "2026-06-23",
  },
  {
    region: "VALLE DEL CAUCA",
    ciudad: "CALI",
    categoria: "bloqueo_vias",
    titulo: "Bloqueo en la via Cali - Jamundi",
    descripcion: "Manifestantes instalan barricadas que afectan el flujo vehicular en horas de la manana.",
    flyer_url: "/flyers/bloqueo-1.png",
    fecha: "2026-06-21",
  },
  {
    region: "VALLE DEL CAUCA",
    ciudad: "CALI",
    categoria: "manifestaciones",
    titulo: "Planton frente a la gobernacion",
    descripcion: "Concentracion pacifica convocada por colectivos ciudadanos.",
    flyer_url: "/flyers/manifestacion-1.png",
    fecha: "2026-06-20",
  },
  {
    region: "ANTIOQUIA",
    ciudad: "MEDELLIN",
    categoria: "fake_news",
    titulo: "Imagen editada de supuesto disturbio",
    descripcion: "Se viraliza una foto antigua presentada como un hecho reciente en Medellin.",
    flyer_url: "/flyers/fake-news-1.png",
    fecha: "2026-06-23",
  },
  {
    region: "ANTIOQUIA",
    ciudad: "BELLO",
    categoria: "bloqueo_vias",
    titulo: "Cierre parcial en la autopista norte",
    descripcion: "Reporte de bloqueo intermitente por parte de transportadores.",
    flyer_url: "/flyers/bloqueo-1.png",
    fecha: "2026-06-22",
  },
  {
    region: "ATLANTICO",
    ciudad: "BARRANQUILLA",
    categoria: "manifestaciones",
    titulo: "Movilizacion en Barranquilla",
    descripcion: "Marcha convocada por organizaciones sociales en la via 40.",
    flyer_url: "/flyers/manifestacion-1.png",
    fecha: "2026-06-19",
  },
  {
    region: "NORTE DE SANTANDER",
    ciudad: "CUCUTA",
    categoria: "bloqueo_vias",
    titulo: "Bloqueo en la frontera",
    descripcion: "Cierre del paso fronterizo afecta el comercio en Cucuta.",
    flyer_url: "/flyers/bloqueo-1.png",
    fecha: "2026-06-18",
  },
  {
    region: "NARIÑO",
    ciudad: "IPIALES",
    categoria: "bloqueo_vias",
    titulo: "Bloqueo en la via Panamericana",
    descripcion: "Comunidades instalan puntos de concentracion sobre la via principal.",
    flyer_url: "/flyers/bloqueo-1.png",
    fecha: "2026-06-21",
  },
  {
    region: "CAUCA",
    ciudad: "POPAYAN",
    categoria: "manifestaciones",
    titulo: "Concentracion en Popayan",
    descripcion: "Movilizacion de comunidades indigenas en el centro de la ciudad.",
    flyer_url: "/flyers/manifestacion-1.png",
    fecha: "2026-06-20",
  },
  {
    region: "CAUCA",
    ciudad: "POPAYAN",
    categoria: "fake_news",
    titulo: "Cadena falsa sobre desabastecimiento",
    descripcion: "Mensaje en redes alerta sobre un supuesto desabastecimiento de combustible sin fundamento.",
    flyer_url: "/flyers/fake-news-1.png",
    fecha: "2026-06-22",
  },
  {
    region: "SANTANDER",
    ciudad: "BUCARAMANGA",
    categoria: "fake_news",
    titulo: "Video sacado de contexto",
    descripcion: "Un video de otro pais se difunde como si ocurriera en Bucaramanga.",
    flyer_url: "/flyers/fake-news-1.png",
    fecha: "2026-06-23",
  },
  {
    region: "META",
    ciudad: "VILLAVICENCIO",
    categoria: "manifestaciones",
    titulo: "Marcha en Villavicencio",
    descripcion: "Convocatoria de gremios en el parque principal.",
    flyer_url: "/flyers/manifestacion-1.png",
    fecha: "2026-06-19",
  },
  {
    region: "BOLIVAR",
    ciudad: "CARTAGENA",
    categoria: "manifestaciones",
    titulo: "Plantones en Cartagena",
    descripcion: "Concentraciones en distintos puntos del centro historico.",
    flyer_url: "/flyers/manifestacion-1.png",
    fecha: "2026-06-18",
  },
  {
    region: "TOLIMA",
    ciudad: "IBAGUE",
    categoria: "bloqueo_vias",
    titulo: "Bloqueo en la via Ibague - Bogota",
    descripcion: "Cierre que genera largas filas de vehiculos de carga.",
    flyer_url: "/flyers/bloqueo-1.png",
    fecha: "2026-06-22",
  },
]
