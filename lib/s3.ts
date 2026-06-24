import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"

const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID
const region = process.env.NEXT_PUBLIC_SUPABASE_REGION || "us-west-2"

const s3Client = new S3Client({
  forcePathStyle: true,
  region,
  endpoint: `https://${projectId}.supabase.co/storage/v1/s3`,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
})

export async function uploadFlyerToS3(file: File): Promise<string> {
  const extension = file.name.split(".").pop() || "png"
  const fileName = `flyers/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`
  
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  const command = new PutObjectCommand({
    Bucket: "storage-temporal",
    Key: fileName,
    Body: buffer,
    ContentType: file.type,
  })
  
  await s3Client.send(command)
  
  return `https://${projectId}.supabase.co/storage/v1/object/public/storage-temporal/${fileName}`
}

export async function deleteFlyerFromS3(url: string): Promise<void> {
  try {
    console.log("[S3] Intentando borrar URL:", url)
    const parts = url.split("storage-temporal/")
    if (parts.length !== 2) {
      console.log("[S3] No es una URL de bucket valida o es un archivo local:", url)
      return
    }
    // Removemos cualquier parametro de busqueda (?t=...) y decodificamos por si tiene espacios
    const key = decodeURIComponent(parts[1].split("?")[0])
    console.log("[S3] Key extraida para borrar:", key)
    
    const command = new DeleteObjectCommand({
      Bucket: "storage-temporal",
      Key: key,
    })
    
    await s3Client.send(command)
    console.log(`[S3] Borrado exitoso en S3: ${key}`)
  } catch (error) {
    console.error("[S3] Error borrando archivo:", error)
  }
}
