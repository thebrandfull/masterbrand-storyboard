"use client"

import { Button } from "@/components/ui/button"

interface SuggestionChipsProps {
  title?: string
  items?: string[]
  onSelect: (value: string) => void
}

export function SuggestionChips({ title = "Quick picks", items, onSelect }: SuggestionChipsProps) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <div className="mt-3">
      <p className="text-xs uppercase tracking-wide text-white/40">{title}</p>
      <div className="flex flex-wrap gap-2 mt-2">
        {items.map((item) => (
          <Button
            key={item}
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onSelect(item)}
          >
            {item}
          </Button>
        ))}
      </div>
    </div>
  )
}
