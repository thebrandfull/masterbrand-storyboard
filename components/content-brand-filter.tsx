"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { BrandSelector } from "@/components/brand-selector"
import type { Database } from "@/types/database"

type Brand = Database["public"]["Tables"]["brands"]["Row"]

interface ContentBrandFilterProps {
  brands: Brand[]
  activeBrandId: string
}

export function ContentBrandFilter({ brands, activeBrandId }: ContentBrandFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleBrandChange = (nextBrandId: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "")
    if (nextBrandId) {
      params.set("brand", nextBrandId)
    } else {
      params.delete("brand")
    }
    const query = params.toString()
    router.replace(query ? `/content?${query}` : "/content")
  }

  return (
    <BrandSelector
      brands={brands}
      selectedBrandId={activeBrandId}
      onBrandChange={handleBrandChange}
    />
  )
}
