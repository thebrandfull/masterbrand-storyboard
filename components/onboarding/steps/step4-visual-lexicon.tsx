"use client"

import { UseFormReturn } from "react-hook-form"
import { BrandFormData, BrandSuggestions } from "@/types/brand"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { MultiInput } from "../multi-input"
import { SuggestionChips } from "@/components/onboarding/suggestion-chips"

interface StepProps {
  form: UseFormReturn<BrandFormData>
  suggestions?: BrandSuggestions | null
}

export function Step4VisualLexicon({ form, suggestions }: StepProps) {
  const addArrayValue = (
    field: "visualKeywords" | "aestheticReferences" | "negativePrompts",
    value: string
  ) => {
    const current = form.getValues(field) || []
    if (!current.includes(value)) {
      form.setValue(field, [...current, value], { shouldDirty: true })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Visual Lexicon</h3>
        <p className="text-white/60">Define the look and feel for video generation</p>
      </div>

      <FormField
        control={form.control}
        name="visualKeywords"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Visual Keywords *</FormLabel>
            <FormControl>
              <MultiInput
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Add visual keyword (e.g., minimalist, vibrant, cinematic)"
              />
            </FormControl>
            <FormDescription>
              Adjectives that describe your brand's visual aesthetic
            </FormDescription>
            <FormMessage />
            <SuggestionChips
              items={suggestions?.visualKeywords}
              onSelect={(value) => addArrayValue("visualKeywords", value)}
            />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="aestheticReferences"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Aesthetic References</FormLabel>
            <FormControl>
              <MultiInput
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Add reference (e.g., Wes Anderson films, Apple commercials)"
              />
            </FormControl>
            <FormDescription>
              Optional: Visual styles or references to emulate
            </FormDescription>
            <FormMessage />
            <SuggestionChips
              items={suggestions?.aestheticReferences}
              onSelect={(value) => addArrayValue("aestheticReferences", value)}
            />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="negativePrompts"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Negative Prompts</FormLabel>
            <FormControl>
              <MultiInput
                value={field.value || []}
                onChange={field.onChange}
                placeholder="What to avoid (e.g., cluttered, overly corporate, dark)"
              />
            </FormControl>
            <FormDescription>
              Visual elements to explicitly avoid in generations
            </FormDescription>
            <FormMessage />
            <SuggestionChips
              items={suggestions?.negativePrompts}
              onSelect={(value) => addArrayValue("negativePrompts", value)}
            />
          </FormItem>
        )}
      />

      <div className="glass rounded-lg p-4 border border-white/10">
        <p className="text-sm text-white/60">
          <strong className="text-white">Tip:</strong> These keywords will be injected into
          your video prompts to ensure visual consistency across all content.
        </p>
      </div>
    </div>
  )
}
