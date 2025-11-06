"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"

interface MultiInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiInput({ value, onChange, placeholder, className }: MultiInputProps) {
  const [inputValue, setInputValue] = useState("")
  const items = useMemo(() => (Array.isArray(value) ? value : []), [value])

  const handleAdd = () => {
    const trimmed = inputValue.trim()
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed])
      setInputValue("")
    }
  }

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className={className}>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="glass"
        />
        <Button
          type="button"
          onClick={handleAdd}
          size="icon"
          variant="secondary"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {items.map((item, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="glass px-3 py-1 text-sm"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="ml-2 hover:text-destructive smooth"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
