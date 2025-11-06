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
import { Input } from "@/components/ui/input"
import { SuggestionChips } from "@/components/onboarding/suggestion-chips"

interface StepProps {
  form: UseFormReturn<BrandFormData>
  suggestions?: BrandSuggestions | null
}

export function Step3AudienceTone({ form, suggestions }: StepProps) {
  const applyTextSuggestion = (
    field: "targetAudience" | "voiceTone" | "languageStyle",
    value: string
  ) => {
    form.setValue(field, value, { shouldDirty: true })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Audience & Voice Tone</h3>
        <p className="text-white/60">Who are you speaking to and how?</p>
      </div>

      <FormField
        control={form.control}
        name="targetAudience"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Target Audience *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe your ideal audience: demographics, interests, pain points..."
                className="glass min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Who is your content for? Be specific.
            </FormDescription>
            <FormMessage />
            <SuggestionChips
              items={suggestions?.targetAudience}
              onSelect={(value) => applyTextSuggestion("targetAudience", value)}
            />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="voiceTone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Voice & Tone *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="e.g., Professional yet approachable, witty, educational, inspirational..."
                className="glass min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormDescription>
              How should your brand sound in content?
            </FormDescription>
            <FormMessage />
            <SuggestionChips
              items={suggestions?.voiceTone}
              onSelect={(value) => applyTextSuggestion("voiceTone", value)}
            />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="languageStyle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Language Style</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., Conversational, Technical, Storytelling-driven"
                className="glass"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Optional: Specific language patterns or stylistic choices
            </FormDescription>
            <FormMessage />
            <SuggestionChips
              items={suggestions?.languageStyle}
              onSelect={(value) => applyTextSuggestion("languageStyle", value)}
            />
          </FormItem>
        )}
      />

      <div className="glass rounded-lg p-4 border border-white/10">
        <p className="text-sm text-white/60">
          <strong className="text-white">Example:</strong> "25-40 year old entrepreneurs
          looking to scale their personal brand through authentic storytelling"
        </p>
      </div>
    </div>
  )
}
