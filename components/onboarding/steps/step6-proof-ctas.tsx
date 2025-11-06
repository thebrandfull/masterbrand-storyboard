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

export function Step6ProofPointsCTAs({ form, suggestions }: StepProps) {
  const addArrayValue = (field: "proofPoints" | "ctaLibrary", value: string) => {
    const current = form.getValues(field) || []
    if (!current.includes(value)) {
      form.setValue(field, [...current, value], { shouldDirty: true })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Proof Points & CTAs</h3>
        <p className="text-white/60">Build credibility and drive action</p>
      </div>

      <FormField
        control={form.control}
        name="proofPoints"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Key Proof Points *</FormLabel>
            <FormControl>
              <MultiInput
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Add proof point (e.g., 10,000+ customers, Featured in Forbes)"
              />
            </FormControl>
            <FormDescription>
              Credibility markers, stats, achievements, or social proof
            </FormDescription>
            <FormMessage />
            <SuggestionChips
              items={suggestions?.proofPoints}
              onSelect={(value) => addArrayValue("proofPoints", value)}
            />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="ctaLibrary"
        render={({ field }) => (
          <FormItem>
            <FormLabel>CTA Library *</FormLabel>
            <FormControl>
              <MultiInput
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Add CTA (e.g., Download our free guide, Book a demo)"
              />
            </FormControl>
            <FormDescription>
              Call-to-actions you want to rotate through in content
            </FormDescription>
            <FormMessage />
            <SuggestionChips
              items={suggestions?.ctaLibrary}
              onSelect={(value) => addArrayValue("ctaLibrary", value)}
            />
          </FormItem>
        )}
      />

      <div className="glass rounded-lg p-4 border border-white/10">
        <p className="text-sm text-white/60">
          <strong className="text-white">Proof Examples:</strong> "5-star rated on Trustpilot",
          "Used by Fortune 500 companies", "Award-winning customer service"<br />
          <strong className="text-white">CTA Examples:</strong> "Try it free for 30 days",
          "Join 50K+ subscribers", "Get instant access"
        </p>
      </div>
    </div>
  )
}
