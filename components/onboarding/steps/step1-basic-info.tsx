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
import { Input } from "@/components/ui/input"

interface StepProps {
  form: UseFormReturn<BrandFormData>
  suggestions?: BrandSuggestions | null
}

export function Step1BasicInfo({ form }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Basic Information</h3>
        <p className="text-white/60">Let's start with the fundamentals of your brand</p>
      </div>

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Brand Name *</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., Thebrandfull, Morosay, Noor"
                className="glass"
                {...field}
              />
            </FormControl>
            <FormDescription>
              The official name of your brand
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="primaryColor"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Primary Brand Color</FormLabel>
            <FormControl>
              <div className="flex gap-3 items-center">
                <Input
                  type="color"
                  className="w-20 h-12 cursor-pointer"
                  {...field}
                />
                <Input
                  placeholder="#3B82F6"
                  className="glass flex-1"
                  {...field}
                />
              </div>
            </FormControl>
            <FormDescription>
              Your brand's primary color (used for accents in the UI)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="glass rounded-lg p-4 border border-white/10">
        <p className="text-sm text-white/60">
          <strong className="text-white">Tip:</strong> Choose a memorable name and color.
          You'll be able to add a logo later in settings.
        </p>
      </div>
    </div>
  )
}
