"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
type Cameo = {
  id: string
  brand_id: string
  name: string
  description: string
  visual_description: string
  reference_images?: string[] | null
  usage_notes?: string | null
  created_at?: string
  updated_at?: string
}

type CameoInsert = Omit<Cameo, "id" | "created_at" | "updated_at">
type CameoUpdate = Partial<Cameo>

export async function getCameosByBrand(brandId: string) {
  try {
    const { data, error } = await supabase
      .from("cameos")
      .select("*")
      .eq("brand_id", brandId)
      .order("name", { ascending: true })

    if (error) throw new Error(`Failed to fetch cameos: ${error.message}`)
    return { success: true, cameos: data || [] }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch cameos"
    console.error("[getCameosByBrand]", errorMessage)
    return { success: false, cameos: [], error: errorMessage }
  }
}

export async function createCameo(data: {
  brandId: string
  name: string
  description: string
  visualDescription: string
  referenceImages?: string[]
  usageNotes?: string
}) {
  try {
    const insertData: CameoInsert = {
      brand_id: data.brandId,
      name: data.name,
      description: data.description,
      visual_description: data.visualDescription,
      reference_images: data.referenceImages || null,
      usage_notes: data.usageNotes || null,
    }

    const result = await (supabase.from("cameos") as any)
      .insert(insertData)
      .select()
      .single()

    if (result.error) throw new Error(`Failed to create cameo: ${result.error.message}`)
    if (!result.data) throw new Error("Cameo creation returned no data")

    const cameo = result.data as Cameo

    revalidatePath("/sora-generator")
    return { success: true, cameo }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create cameo"
    console.error("[createCameo]", errorMessage)
    return { success: false, error: errorMessage }
  }
}

export async function updateCameo(
  cameoId: string,
  data: {
    name?: string
    description?: string
    visualDescription?: string
    referenceImages?: string[]
    usageNotes?: string
  }
) {
  try {
    const updateData: CameoUpdate = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.visualDescription !== undefined) updateData.visual_description = data.visualDescription
    if (data.referenceImages !== undefined) updateData.reference_images = data.referenceImages
    if (data.usageNotes !== undefined) updateData.usage_notes = data.usageNotes

    updateData.updated_at = new Date().toISOString()

    const result = await (supabase.from("cameos") as any)
      .update(updateData)
      .eq("id", cameoId)
      .select()
      .single()

    if (result.error) throw new Error(`Failed to update cameo: ${result.error.message}`)
    if (!result.data) throw new Error("Cameo update returned no data")

    revalidatePath("/sora-generator")
    return { success: true, cameo: result.data as Cameo }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update cameo"
    console.error("[updateCameo]", errorMessage)
    return { success: false, error: errorMessage }
  }
}

export async function deleteCameo(cameoId: string) {
  try {
    const result = await supabase.from("cameos").delete().eq("id", cameoId)

    if (result.error) throw new Error(`Failed to delete cameo: ${result.error.message}`)

    revalidatePath("/sora-generator")
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete cameo"
    console.error("[deleteCameo]", errorMessage)
    return { success: false, error: errorMessage }
  }
}
