"use client"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Layers } from "lucide-react"

interface Brand {
  id: string
  name: string
}

interface BrandSelectorProps {
  brands: Brand[]
  selectedBrandId?: string
  onBrandChange: (brandId: string) => void
}

export function BrandSelector({ brands, selectedBrandId, onBrandChange }: BrandSelectorProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Auto-select first brand if none selected
    if (!selectedBrandId && brands.length > 0) {
      onBrandChange(brands[0].id)
    }
  }, [brands, selectedBrandId, onBrandChange])

  if (!mounted) {
    return null
  }

  return (
    <Select value={selectedBrandId} onValueChange={onBrandChange}>
      <SelectTrigger className="flex w-[280px] items-center gap-2 rounded-2xl border border-white/10 bg-[#0f0f0f] text-white">
        <Layers className="h-4 w-4 text-[#ff2a2a]" />
        <SelectValue placeholder="Select a brand" />
      </SelectTrigger>
      <SelectContent className="rounded-2xl border border-white/10 bg-[#111111] text-white">
        {brands.map((brand) => (
          <SelectItem key={brand.id} value={brand.id}>
            {brand.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
