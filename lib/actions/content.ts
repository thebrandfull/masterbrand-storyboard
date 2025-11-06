"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import type { Database } from "@/types/database"

type ContentItem = Database["public"]["Tables"]["content_items"]["Row"]
type ContentItemInsert = Database["public"]["Tables"]["content_items"]["Insert"]
type ContentItemUpdate = Database["public"]["Tables"]["content_items"]["Update"]

export async function getContentItemsByBrand(brandId: string) {
  try {
    const { data, error } = await supabase
      .from("content_items")
      .select("*")
      .eq("brand_id", brandId)
      .order("date_target", { ascending: true })

    if (error) throw new Error(`Failed to fetch content items: ${error.message}`)
    return { success: true, items: data || [] }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch content items"
    console.error("[getContentItemsByBrand]", errorMessage)
    return { success: false, items: [], error: errorMessage }
  }
}

export async function getContentItemsByStatus(brandId: string) {
  try {
    const { data, error } = await supabase
      .from("content_items")
      .select("*")
      .eq("brand_id", brandId)
      .order("status")

    if (error) throw new Error(`Failed to fetch content by status: ${error.message}`)

    // Group by status
    const byStatus: Record<string, ContentItem[]> = {
      idea: [],
      prompted: [],
      generated: [],
      enhanced: [],
      qc: [],
      scheduled: [],
      published: [],
    }

    if (data) {
      (data as ContentItem[]).forEach((item) => {
        if (byStatus[item.status]) {
          byStatus[item.status].push(item)
        }
      })
    }

    return { success: true, byStatus }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch content by status"
    console.error("[getContentItemsByStatus]", errorMessage)
    return { success: false, byStatus: {}, error: errorMessage }
  }
}

export async function createContentItem(data: {
  brandId: string
  dateTarget: string
  platform: string
  status?: ContentItem['status']
}) {
  try {
    const insertData: ContentItemInsert = {
      brand_id: data.brandId,
      date_target: data.dateTarget,
      platform: data.platform,
      status: data.status || "idea",
    }

    // Type workaround for Supabase insert type inference issue
    const result = await (supabase.from("content_items") as any)
      .insert(insertData)
      .select()
      .single()

    if (result.error) throw new Error(`Failed to create content item: ${result.error.message}`)
    if (!result.data) throw new Error("Content item creation returned no data")

    const item = result.data as ContentItem

    revalidatePath("/")
    revalidatePath("/calendar")
    return { success: true, item }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create content item"
    console.error("[createContentItem]", errorMessage)
    return { success: false, error: errorMessage }
  }
}

export async function updateContentItemStatus(itemId: string, status: ContentItem['status']) {
  try {
    const updateData: ContentItemUpdate = { status }

    // Type workaround for Supabase update type inference issue
    const result = await (supabase.from("content_items") as any)
      .update(updateData)
      .eq("id", itemId)

    if (result.error) throw new Error(`Failed to update content status: ${result.error.message}`)

    revalidatePath("/")
    revalidatePath("/calendar")
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update content status"
    console.error("[updateContentItemStatus]", errorMessage)
    return { success: false, error: errorMessage }
  }
}

export async function updateContentItemDetails(
  itemId: string,
  details: { notes?: string | null; attachments?: Database["public"]["Tables"]["content_items"]["Row"]["attachments"] }
) {
  try {
    const updateData: ContentItemUpdate = {}

    if ("notes" in details) {
      updateData.notes = details.notes ?? null
    }
    if ("attachments" in details) {
      updateData.attachments = details.attachments ?? null
    }

    // Type workaround for Supabase update type inference issue
    const result = await (supabase.from("content_items") as any)
      .update(updateData)
      .eq("id", itemId)
      .select()
      .single()

    if (result.error) throw new Error(`Failed to update content details: ${result.error.message}`)
    if (!result.data) throw new Error("Content update returned no data")

    revalidatePath("/")
    revalidatePath("/calendar")
    return { success: true, item: result.data as ContentItem }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update content details"
    console.error("[updateContentItemDetails]", errorMessage)
    return { success: false, error: errorMessage }
  }
}
