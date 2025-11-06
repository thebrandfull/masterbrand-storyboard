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
      <SelectTrigger className="w-[280px] glass border-white/10">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <SelectValue placeholder="Select a brand" />
        </div>
      </SelectTrigger>
      <SelectContent className="glass border-white/10">
        {brands.map((brand) => (
          <SelectItem key={brand.id} value={brand.id}>
            {brand.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
