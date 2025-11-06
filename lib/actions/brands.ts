"use server"

import { supabase } from "@/lib/supabase"
import { BrandFormData } from "@/types/brand"
import { revalidatePath } from "next/cache"
import { ingestBrandProfile } from "@/lib/brand-brain-ingest"
import type { IngestableBrand } from "@/lib/brand-brain-ingest"
import type { Database } from "@/types/database"

type BrandRow = Database["public"]["Tables"]["brands"]["Row"]
type BrandInsert = Database["public"]["Tables"]["brands"]["Insert"]
type TopicInsert = Database["public"]["Tables"]["topics"]["Insert"]

export async function createBrand(data: BrandFormData) {
  try {
    // Map form data to database schema
    const metadata = {
      languageStyle: data.languageStyle || "",
      coreValues: data.coreValues || [],
      aestheticReferences: data.aestheticReferences || [],
      legalClaims: data.legalClaims || [],
    }

    const brandInsert: BrandInsert = {
      name: data.name,
      mission: data.mission,
      voice_tone: data.voiceTone,
      target_audience: data.targetAudience,
      visual_lexicon: data.visualKeywords.join(", "),
      dos: data.dos,
      donts: data.donts,
      proof_points: data.proofPoints,
      cta_library: data.ctaLibrary,
      negative_prompts: data.negativePrompts || [],
      platform_constraints: {
        platforms: data.platforms,
        preferences: data.platformPreferences || {},
        metadata,
      },
    }

    // Type workaround for Supabase insert type inference issue
    const brandResult = await (supabase.from("brands") as any).insert(brandInsert).select().single()

    if (brandResult.error) throw new Error(`Failed to create brand: ${brandResult.error.message}`)
    if (!brandResult.data) throw new Error("Brand insert returned no data")

    const brand = brandResult.data as BrandRow

    // Create topics for the brand
    if (data.topics && data.topics.length > 0) {
      const topicsToInsert: TopicInsert[] = data.topics.map((topic) => ({
        brand_id: brand.id,
        label: topic.label,
        weight: topic.weight,
        min_frequency: topic.minFrequency,
        max_frequency: topic.maxFrequency,
        examples: topic.examples || [],
      }))

      // Type workaround for Supabase insert type inference issue
      const topicsResult = await (supabase.from("topics") as any).insert(topicsToInsert)

      if (topicsResult.error) {
        // Rollback: delete the brand if topics fail
        await supabase.from("brands").delete().eq("id", brand.id)
        throw new Error(`Failed to create topics: ${topicsResult.error.message}`)
      }
    }

    // Ingest brand profile for vector storage (best-effort, don't fail the whole operation)
    try {
      await ingestBrandProfile(brand, data.topics || [])
    } catch (ingestError) {
      console.warn("[Brand Creation] Vector ingestion failed:", ingestError)
    }

    revalidatePath("/brands")
    return { success: true, brandId: brand.id }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create brand"
    console.error("[createBrand]", errorMessage)
    return { success: false, error: errorMessage }
  }
}

export async function getBrands() {
  try {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw new Error(`Failed to fetch brands: ${error.message}`)
    return { success: true, brands: data || [] }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch brands"
    console.error("[getBrands]", errorMessage)
    return { success: false, brands: [], error: errorMessage }
  }
}

export async function getBrandById(id: string) {
  try {
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("*")
      .eq("id", id)
      .single()

    if (brandError) throw new Error(`Failed to fetch brand: ${brandError.message}`)
    if (!brand) throw new Error("Brand not found")

    const { data: topics, error: topicsError } = await supabase
      .from("topics")
      .select("*")
      .eq("brand_id", id)

    if (topicsError) throw new Error(`Failed to fetch topics: ${topicsError.message}`)

    return { success: true, brand, topics: topics || [] }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch brand"
    console.error("[getBrandById]", errorMessage)
    return { success: false, brand: null, topics: [], error: errorMessage }
  }
}

export async function updateBrand(id: string, data: BrandFormData) {
  try {
    // Update brand
    const metadata = {
      languageStyle: data.languageStyle || "",
      coreValues: data.coreValues || [],
      aestheticReferences: data.aestheticReferences || [],
      legalClaims: data.legalClaims || [],
    }

    const updateData = {
      name: data.name,
      mission: data.mission,
      voice_tone: data.voiceTone,
      target_audience: data.targetAudience,
      visual_lexicon: data.visualKeywords?.join(", "),
      dos: data.dos,
      donts: data.donts,
      proof_points: data.proofPoints,
      cta_library: data.ctaLibrary,
      negative_prompts: data.negativePrompts || [],
      platform_constraints: {
        platforms: data.platforms,
        preferences: data.platformPreferences || {},
        metadata,
      },
    }

    const brandUpdate: Database["public"]["Tables"]["brands"]["Update"] = updateData

    // Type workaround for Supabase update type inference issue
    const brandUpdateResult = await (supabase.from("brands") as any).update(brandUpdate).eq("id", id)

    if (brandUpdateResult.error) throw new Error(`Failed to update brand: ${brandUpdateResult.error.message}`)

    // Delete existing topics
    const { error: deleteError } = await supabase.from("topics").delete().eq("brand_id", id)
    if (deleteError) throw new Error(`Failed to delete old topics: ${deleteError.message}`)

    // Create new topics
    if (data.topics && data.topics.length > 0) {
      const topicsToInsert: TopicInsert[] = data.topics.map((topic) => ({
        brand_id: id,
        label: topic.label,
        weight: topic.weight,
        min_frequency: topic.minFrequency,
        max_frequency: topic.maxFrequency,
        examples: topic.examples || [],
      }))

      // Type workaround for Supabase insert type inference issue
      const topicsInsertResult = await (supabase.from("topics") as any).insert(topicsToInsert)

      if (topicsInsertResult.error) throw new Error(`Failed to insert new topics: ${topicsInsertResult.error.message}`)
    }

    // Update vector storage (best-effort, don't fail the whole operation)
    try {
      await ingestBrandProfile(buildIngestableBrand(id, data), data.topics || [])
    } catch (ingestError) {
      console.warn("[Brand Update] Vector ingestion failed:", ingestError)
    }

    revalidatePath("/brands")
    revalidatePath(`/brands/${id}`)
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update brand"
    console.error("[updateBrand]", errorMessage)
    return { success: false, error: errorMessage }
  }
}

export async function deleteBrand(id: string) {
  try {
    const { error } = await supabase.from("brands").delete().eq("id", id)

    if (error) throw new Error(`Failed to delete brand: ${error.message}`)

    revalidatePath("/brands")
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete brand"
    console.error("[deleteBrand]", errorMessage)
    return { success: false, error: errorMessage }
  }
}

function buildIngestableBrand(id: string, data: BrandFormData): IngestableBrand {
  return {
    id,
    name: data.name,
    mission: data.mission || null,
    voice_tone: data.voiceTone || null,
    target_audience: data.targetAudience || null,
    visual_lexicon: data.visualKeywords?.join(", ") || null,
    dos: data.dos,
    donts: data.donts,
    proof_points: data.proofPoints,
    cta_library: data.ctaLibrary,
    negative_prompts: data.negativePrompts || [],
  }
}
