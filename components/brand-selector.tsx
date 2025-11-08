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
      <SelectTrigger className="glass flex w-[260px] items-center gap-2 border border-white/10 bg-transparent text-[color:var(--text)]">
        <Layers className="h-4 w-4 text-[color:var(--accent)]" />
        <SelectValue placeholder="Select a brand" />
      </SelectTrigger>
      <SelectContent className="glass border border-white/10 bg-[var(--surface)] text-[color:var(--text)]">
        {brands.map((brand) => (
          <SelectItem key={brand.id} value={brand.id}>
            {brand.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
