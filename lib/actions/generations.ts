"use server"

import { supabase } from "@/lib/supabase"

export async function getGenerationsByContentItem(contentItemId: string) {
  try {
    const { data, error } = await supabase
      .from("generations")
      .select("*")
      .eq("content_item_id", contentItemId)
      .order("created_at", { ascending: true })

    if (error) throw error
    return { success: true, generations: data }
  } catch (error) {
    console.error("Error fetching generations:", error)
    return { success: false, generations: [] }
  }
}

export async function getContentItemById(id: string) {
  try {
    const { data, error } = await supabase
      .from("content_items")
      .select("*, brands(*)")
      .eq("id", id)
      .single()

    if (error) throw error
    return { success: true, item: data }
  } catch (error) {
    console.error("Error fetching content item:", error)
    return { success: false, item: null }
  }
}
