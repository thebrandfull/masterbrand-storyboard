"use client"

import { UseFormReturn } from "react-hook-form"
import { BrandFormData, BrandSuggestions } from "@/types/brand"
import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface StepProps {
  form: UseFormReturn<BrandFormData>
  suggestions?: BrandSuggestions | null
}

const PLATFORM_OPTIONS = [
  {
    key: "tiktok",
    title: "TikTok",
    description: "Short-form vertical",
  },
  {
    key: "instagram",
    title: "Instagram",
    description: "Reels & Stories",
  },
  {
    key: "youtube",
    title: "YouTube",
    description: "Shorts & Long-form",
  },
] as const

function PlatformToggle({
  label,
  description,
  active,
  onToggle,
}: {
  label: string
  description: string
  active: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        "glass p-6 rounded-xl text-left smooth focus:outline-none focus:ring-2 focus:ring-primary relative",
        active && "ring-2 ring-primary"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-5 w-5 rounded-full border border-white/30 flex items-center justify-center",
            active ? "bg-primary/90 border-primary" : "bg-transparent"
          )}
        >
          {active && <Check className="h-3 w-3 text-primary-foreground" />}
        </div>
        <div>
          <div className="font-semibold">{label}</div>
          <div className="text-xs text-white/60">{description}</div>
        </div>
      </div>
    </button>
  )
}

export function Step7PlatformSetup({ form }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Platform Setup</h3>
        <p className="text-white/60">Select platforms and configure preferences</p>
      </div>

      <FormField
        control={form.control}
        name="platforms"
        render={() => (
          <FormItem>
            <FormLabel>Active Platforms *</FormLabel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              {PLATFORM_OPTIONS.map((platform) => (
                <FormField
                  key={platform.key}
                  control={form.control}
                  name={`platforms.${platform.key}` as const}
                  render={({ field }) => (
                    <Card className="glass p-0">
                      <PlatformToggle
                        label={platform.title}
                        description={platform.description}
                        active={field.value}
                        onToggle={() => field.onChange(!field.value)}
                      />
                    </Card>
                  )}
                />
              ))}
            </div>
            <FormDescription>
              Select which platforms you'll be creating content for
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="glass rounded-lg p-4 border border-white/10">
        <p className="text-sm text-white/60">
          <strong className="text-white">Note:</strong> Platform-specific constraints (character
          limits, hashtag rules, etc.) will be automatically applied during content generation.
        </p>
      </div>
    </div>
  )
}
