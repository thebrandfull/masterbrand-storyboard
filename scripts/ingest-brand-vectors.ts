#!/usr/bin/env ts-node
import { createClient } from "@supabase/supabase-js"
import type { Database } from "../types/database"
import { ingestBrandProfile } from "../lib/brand-brain-ingest"

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
    process.exit(1)
  }

  const supabase = createClient<Database>(supabaseUrl, serviceKey)

  const { data: brands, error } = await supabase.from("brands").select("*, topics(*)")
  if (error) {
    console.error("Failed to load brands", error.message)
    process.exit(1)
  }

  for (const brand of brands || []) {
    const brandRecord = brand as Database["public"]["Tables"]["brands"]["Row"]
    const topics = ((brand as unknown as { topics?: Database["public"]["Tables"]["topics"]["Row"][] }).topics) || []
    await ingestBrandProfile(brandRecord, topics)
    console.log(`Vectorized ${brandRecord.name} (${topics.length} topics)`)
  }

  console.log("Brand vectors ingested")
}

main()
