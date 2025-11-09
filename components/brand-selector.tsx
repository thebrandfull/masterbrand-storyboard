"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Layers, Plus } from "lucide-react"

interface Brand {
  id: string
  name: string
}

interface BrandSelectorProps {
  brands: Brand[]
  selectedBrandId?: string
  onBrandChange: (brandId: string) => void
  triggerClassName?: string
  includeCreateOption?: boolean
  onCreateBrand?: () => void
}

export function BrandSelector({
  brands,
  selectedBrandId,
  onBrandChange,
  triggerClassName,
  includeCreateOption = false,
  onCreateBrand,
}: BrandSelectorProps) {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

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

  const handleChange = (value: string) => {
    if (value === "__create") {
      if (onCreateBrand) {
        onCreateBrand()
      } else {
        router.push("/brands/new")
      }
      return
    }
    onBrandChange(value)
  }

  return (
    <Select value={selectedBrandId} onValueChange={handleChange}>
      <SelectTrigger
        className={cn(
          "glass flex w-[260px] items-center gap-2 border border-white/10 bg-transparent text-[color:var(--text)]",
          triggerClassName
        )}
      >
        <Layers className="h-4 w-4 text-[color:var(--accent)]" />
        <SelectValue placeholder="Select a brand" />
      </SelectTrigger>
      <SelectContent className="glass border border-white/10 bg-[var(--surface)] text-[color:var(--text)]">
        {brands.map((brand) => (
          <SelectItem key={brand.id} value={brand.id}>
            {brand.name}
          </SelectItem>
        ))}
        {includeCreateOption && (
          <SelectItem value="__create" className="border-t border-white/5 pt-2 text-[color:var(--accent)]">
            <div className="flex items-center gap-2">
              <Plus className="h-3.5 w-3.5" />
              Add new brand
            </div>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}
