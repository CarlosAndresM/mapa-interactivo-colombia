import "server-only"
import { Pool } from "pg"
import { INCIDENTES_SEED, normalizarRegion, type Incidente, type GrupoRegional } from "./incidentes"

// NOTA: credenciales embebidas a peticion explicita del usuario (proyecto temporal/abierto).
// La contraseña va con el caracter "&" codificado como %26 en la cadena de conexion.
const CONNECTION_STRING =
  "postgresql://postgres.mgdfcdpttibteqmywccm:he%26e3Bsi.Y_fYa9@aws-1-us-west-2.pooler.supabase.com:6543/postgres"

// Singleton del pool para sobrevivir al hot-reload en desarrollo.
const globalForPg = globalThis as unknown as {
  _pgPool?: Pool
  _schemaReady?: Promise<void>
}

function getPool(): Pool {
  if (!globalForPg._pgPool) {
    globalForPg._pgPool = new Pool({
      connectionString: CONNECTION_STRING,
      ssl: { rejectUnauthorized: false },
      max: 3,
    })
  }
  return globalForPg._pgPool
}

// Crea la tabla si no existe y la siembra con datos de ejemplo si esta vacia.
async function initSchema(): Promise<void> {
  const pool = getPool()

  await pool.query(`
    CREATE TABLE IF NOT EXISTS incidentes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      region text NOT NULL,
      ciudad text,
      categoria text NOT NULL CHECK (categoria IN ('fake_news','bloqueo_vias','manifestaciones')),
      titulo text NOT NULL,
      descripcion text,
      flyer_url text,
      fecha date NOT NULL DEFAULT CURRENT_DATE,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS grupos_regionales (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      nombre text NOT NULL UNIQUE,
      departamentos text[] NOT NULL DEFAULT '{}',
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS plantas (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      titulo text NOT NULL DEFAULT '',
      contenido text NOT NULL DEFAULT '',
      color text NOT NULL DEFAULT '#ffffff',
      pos_x integer NOT NULL DEFAULT 100,
      pos_y integer NOT NULL DEFAULT 100,
      width integer NOT NULL DEFAULT 300,
      height integer NOT NULL DEFAULT 200,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `)

  const { rows } = await pool.query<{ count: string }>("SELECT count(*)::int AS count FROM incidentes")
  if (Number(rows[0]?.count ?? 0) === 0) {
    console.log("[v0] Tabla incidentes vacia: sembrando datos de ejemplo")
    for (const s of INCIDENTES_SEED) {
      await pool.query(
        `INSERT INTO incidentes (region, ciudad, categoria, titulo, descripcion, flyer_url, fecha)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          normalizarRegion(s.region),
          s.ciudad ? normalizarRegion(s.ciudad) : null,
          s.categoria,
          s.titulo,
          s.descripcion,
          s.flyer_url,
          s.fecha,
        ],
      )
    }
  }
}

// Garantiza que el esquema este listo una sola vez por proceso.
export function ensureSchema(): Promise<void> {
  if (!globalForPg._schemaReady) {
    globalForPg._schemaReady = initSchema().catch((e) => {
      // Si falla, permite reintentar en la proxima llamada.
      globalForPg._schemaReady = undefined
      throw e
    })
  }
  return globalForPg._schemaReady
}

export async function forceInitSchema(): Promise<void> {
  globalForPg._schemaReady = undefined
  await ensureSchema()
}

export async function dbGetIncidentes(): Promise<Incidente[]> {
  await ensureSchema()
  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT id, region, ciudad, categoria, titulo, descripcion, flyer_url,
            to_char(fecha, 'YYYY-MM-DD') AS fecha
     FROM incidentes
     ORDER BY fecha DESC, created_at DESC`,
  )
  return rows.map((r) => ({
    id: String(r.id),
    region: normalizarRegion(String(r.region)),
    ciudad: r.ciudad ? normalizarRegion(String(r.ciudad)) : null,
    categoria: r.categoria,
    titulo: r.titulo,
    descripcion: r.descripcion ?? "",
    flyer_url: r.flyer_url ?? null,
    fecha: r.fecha,
  })) as Incidente[]
}

export async function dbGetIncidenteById(id: string): Promise<Incidente | null> {
  await ensureSchema()
  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT id, region, ciudad, categoria, titulo, descripcion, flyer_url,
            to_char(fecha, 'YYYY-MM-DD') AS fecha
     FROM incidentes
     WHERE id = $1`,
    [id]
  )
  if (rows.length === 0) return null
  const r = rows[0]
  return {
    id: String(r.id),
    region: normalizarRegion(String(r.region)),
    ciudad: r.ciudad ? normalizarRegion(String(r.ciudad)) : null,
    categoria: r.categoria,
    titulo: r.titulo,
    descripcion: r.descripcion ?? "",
    flyer_url: r.flyer_url ?? null,
    fecha: r.fecha,
  } as Incidente
}

export interface NuevoIncidente {
  region: string
  ciudad: string | null
  categoria: Incidente["categoria"]
  titulo: string
  descripcion: string
  flyer_url: string | null
  fecha: string
}

export async function dbCrearIncidente(data: NuevoIncidente): Promise<Incidente> {
  await ensureSchema()
  const pool = getPool()
  const { rows } = await pool.query(
    `INSERT INTO incidentes (region, ciudad, categoria, titulo, descripcion, flyer_url, fecha)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id, region, ciudad, categoria, titulo, descripcion, flyer_url,
               to_char(fecha, 'YYYY-MM-DD') AS fecha`,
    [
      normalizarRegion(data.region),
      data.ciudad ? normalizarRegion(data.ciudad) : null,
      data.categoria,
      data.titulo,
      data.descripcion,
      data.flyer_url,
      data.fecha,
    ],
  )
  const r = rows[0]
  return {
    id: String(r.id),
    region: normalizarRegion(String(r.region)),
    ciudad: r.ciudad ? normalizarRegion(String(r.ciudad)) : null,
    categoria: r.categoria,
    titulo: r.titulo,
    descripcion: r.descripcion ?? "",
    flyer_url: r.flyer_url ?? null,
    fecha: r.fecha,
  } as Incidente
}

export async function dbEliminarIncidente(id: string): Promise<void> {
  await ensureSchema()
  const pool = getPool()
  await pool.query("DELETE FROM incidentes WHERE id = $1", [id])
}

export async function dbActualizarIncidente(id: string, data: NuevoIncidente): Promise<Incidente> {
  await ensureSchema()
  const pool = getPool()
  const { rows } = await pool.query(
    `UPDATE incidentes 
     SET region = $1, ciudad = $2, categoria = $3, titulo = $4, descripcion = $5, flyer_url = $6, fecha = $7
     WHERE id = $8
     RETURNING id, region, ciudad, categoria, titulo, descripcion, flyer_url,
               to_char(fecha, 'YYYY-MM-DD') AS fecha`,
    [
      normalizarRegion(data.region),
      data.ciudad ? normalizarRegion(data.ciudad) : null,
      data.categoria,
      data.titulo,
      data.descripcion,
      data.flyer_url,
      data.fecha,
      id
    ]
  )
  if (rows.length === 0) throw new Error("Incidente no encontrado")
  const r = rows[0]
  return {
    id: String(r.id),
    region: normalizarRegion(String(r.region)),
    ciudad: r.ciudad ? normalizarRegion(String(r.ciudad)) : null,
    categoria: r.categoria,
    titulo: r.titulo,
    descripcion: r.descripcion ?? "",
    flyer_url: r.flyer_url ?? null,
    fecha: r.fecha,
  } as Incidente
}
export async function dbGetGruposRegionales(): Promise<GrupoRegional[]> {
  await ensureSchema()
  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT id, nombre, departamentos
     FROM grupos_regionales
     ORDER BY nombre ASC`,
  )
  return rows.map((r) => ({
    id: String(r.id),
    nombre: r.nombre,
    departamentos: r.departamentos,
  })) as GrupoRegional[]
}

export async function dbCrearGrupoRegional(nombre: string, departamentos: string[]): Promise<GrupoRegional> {
  await ensureSchema()
  const pool = getPool()
  const { rows } = await pool.query(
    `INSERT INTO grupos_regionales (nombre, departamentos)
     VALUES ($1,$2)
     RETURNING id, nombre, departamentos`,
    [nombre, departamentos]
  )
  const r = rows[0]
  return { id: String(r.id), nombre: r.nombre, departamentos: r.departamentos }
}

export async function dbEliminarGrupoRegional(id: string): Promise<void> {
  await ensureSchema()
  const pool = getPool()
  await pool.query("DELETE FROM grupos_regionales WHERE id = $1", [id])
}

export async function dbActualizarGrupoRegional(id: string, nombre: string, departamentos: string[]): Promise<GrupoRegional> {
  await ensureSchema()
  const pool = getPool()
  const { rows } = await pool.query(
    `UPDATE grupos_regionales 
     SET nombre = $1, departamentos = $2
     WHERE id = $3
     RETURNING id, nombre, departamentos`,
    [nombre, departamentos, id]
  )
  if (rows.length === 0) throw new Error("Grupo regional no encontrado")
  const r = rows[0]
  return { id: String(r.id), nombre: r.nombre, departamentos: r.departamentos }
}

// ==========================================
// PLANTAS (OVERLAYS)
// ==========================================

export interface Planta {
  id: string
  titulo: string
  contenido: string
  color: string
  pos_x: number
  pos_y: number
  width: number
  height: number
}

export type NuevaPlanta = Omit<Planta, "id">

export async function dbGetPlantas(): Promise<Planta[]> {
  await ensureSchema()
  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT id, titulo, contenido, color, pos_x, pos_y, width, height
     FROM plantas
     ORDER BY created_at ASC`,
  )
  return rows.map((r) => ({
    id: String(r.id),
    titulo: r.titulo,
    contenido: r.contenido,
    color: r.color,
    pos_x: Number(r.pos_x),
    pos_y: Number(r.pos_y),
    width: Number(r.width),
    height: Number(r.height),
  }))
}

export async function dbCrearPlanta(data: Partial<NuevaPlanta> = {}): Promise<Planta> {
  await ensureSchema()
  const pool = getPool()
  const { rows } = await pool.query(
    `INSERT INTO plantas (titulo, contenido, color, pos_x, pos_y, width, height)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, titulo, contenido, color, pos_x, pos_y, width, height`,
    [
      data.titulo ?? "Nueva Planta",
      data.contenido ?? "Descripción o contenido...",
      data.color ?? "#ffffff",
      data.pos_x ?? 100,
      data.pos_y ?? 100,
      data.width ?? 300,
      data.height ?? 200,
    ]
  )
  const r = rows[0]
  return {
    id: String(r.id),
    titulo: r.titulo,
    contenido: r.contenido,
    color: r.color,
    pos_x: Number(r.pos_x),
    pos_y: Number(r.pos_y),
    width: Number(r.width),
    height: Number(r.height),
  }
}

export async function dbActualizarPlanta(id: string, data: Partial<NuevaPlanta>): Promise<Planta> {
  await ensureSchema()
  const pool = getPool()
  
  // Dynamic update query builder since data is Partial
  const updates = []
  const values = [id]
  let idx = 2
  
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`${key} = $${idx}`)
      values.push(value as any)
      idx++
    }
  }

  if (updates.length === 0) {
    throw new Error("No fields to update")
  }

  const { rows } = await pool.query(
    `UPDATE plantas 
     SET ${updates.join(', ')}
     WHERE id = $1
     RETURNING id, titulo, contenido, color, pos_x, pos_y, width, height`,
    values
  )
  
  if (rows.length === 0) throw new Error("Planta no encontrada")
  const r = rows[0]
  return {
    id: String(r.id),
    titulo: r.titulo,
    contenido: r.contenido,
    color: r.color,
    pos_x: Number(r.pos_x),
    pos_y: Number(r.pos_y),
    width: Number(r.width),
    height: Number(r.height),
  }
}

export async function dbEliminarPlanta(id: string): Promise<void> {
  await ensureSchema()
  const pool = getPool()
  await pool.query("DELETE FROM plantas WHERE id = $1", [id])
}
