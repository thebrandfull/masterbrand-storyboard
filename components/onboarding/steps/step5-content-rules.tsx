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

export function Step5ContentRules({ form, suggestions }: StepProps) {
  const addArrayValue = (field: "dos" | "donts" | "legalClaims", value: string) => {
    const current = form.getValues(field) || []
    if (!current.includes(value)) {
      form.setValue(field, [...current, value], { shouldDirty: true })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Content Rules & Guidelines</h3>
        <p className="text-white/60">Define what to do and what to avoid</p>
      </div>

      <FormField
        control={form.control}
        name="dos"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Content Do's *</FormLabel>
            <FormControl>
              <MultiInput
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Add a guideline (e.g., Always cite sources, Use inclusive language)"
              />
            </FormControl>
            <FormDescription>
              Best practices and guidelines to follow in all content
            </FormDescription>
            <FormMessage />
            <SuggestionChips
              items={suggestions?.dos}
              onSelect={(value) => addArrayValue("dos", value)}
            />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="donts"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Content Don'ts *</FormLabel>
            <FormControl>
              <MultiInput
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Add a restriction (e.g., No political content, Avoid industry jargon)"
              />
            </FormControl>
            <FormDescription>
              Things to avoid or restrictions on content
            </FormDescription>
            <FormMessage />
            <SuggestionChips
              items={suggestions?.donts}
              onSelect={(value) => addArrayValue("donts", value)}
            />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="legalClaims"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Legal Claims to Avoid</FormLabel>
            <FormControl>
              <MultiInput
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Add claim (e.g., Guaranteed results, Medical claims)"
              />
            </FormControl>
            <FormDescription>
              Optional: Legal restrictions or unverified claims to avoid
            </FormDescription>
            <FormMessage />
            <SuggestionChips
              title="Legal quick picks"
              items={suggestions?.legalClaims}
              onSelect={(value) => addArrayValue("legalClaims", value)}
            />
          </FormItem>
        )}
      />

      <div className="glass rounded-lg p-4 border border-white/10">
        <p className="text-sm text-white/60">
          <strong className="text-white">Example Do:</strong> "Always end with a clear call-to-action"<br />
          <strong className="text-white">Example Don't:</strong> "Never use competitor names directly"
        </p>
      </div>
    </div>
  )
}
