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
import { Textarea } from "@/components/ui/textarea"
import { MultiInput } from "../multi-input"
import { SuggestionChips } from "@/components/onboarding/suggestion-chips"

interface StepProps {
  form: UseFormReturn<BrandFormData>
  suggestions?: BrandSuggestions | null
}

export function Step2MissionValues({ form, suggestions }: StepProps) {
  const addCoreValue = (value: string) => {
    const current = form.getValues("coreValues") || []
    if (!current.includes(value)) {
      form.setValue("coreValues", [...current, value], { shouldDirty: true })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Mission & Core Values</h3>
        <p className="text-white/60">Define what your brand stands for</p>
      </div>

      <FormField
        control={form.control}
        name="mission"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mission Statement *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="What is your brand's purpose? What problem do you solve?"
                className="glass min-h-[120px]"
                {...field}
              />
            </FormControl>
            <FormDescription>
              A clear statement of your brand's purpose and goals
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="coreValues"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Core Values *</FormLabel>
            <FormControl>
              <MultiInput
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Add a core value (e.g., Innovation, Quality, Trust)"
              />
            </FormControl>
            <FormDescription>
              3-5 core values that guide your brand decisions
            </FormDescription>
            <FormMessage />
            <SuggestionChips
              items={suggestions?.coreValues}
              onSelect={addCoreValue}
            />
          </FormItem>
        )}
      />

      <div className="glass rounded-lg p-4 border border-white/10">
        <p className="text-sm text-white/60">
          <strong className="text-white">Examples:</strong> "Empowering creators to build
          authentic brands" or "Making premium design accessible to everyone"
        </p>
      </div>
    </div>
  )
}
