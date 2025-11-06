import { z } from "zod"

export const brandFormSchema = z.object({
  // Step 1: Basic Info
  name: z.string().min(1, "Brand name is required"),
  logo: z.string().optional(),
  primaryColor: z.string().optional(),

  // Step 2: Mission & Values
  mission: z.string().optional(),
  coreValues: z.array(z.string()).default([]),

  // Step 3: Audience & Tone
  targetAudience: z.string().optional(),
  voiceTone: z.string().optional(),
  languageStyle: z.string().optional(),

  // Step 4: Visual Lexicon
  visualKeywords: z.array(z.string()).default([]),
  aestheticReferences: z.array(z.string()).optional(),
  negativePrompts: z.array(z.string()).optional(),

  // Step 5: Content Rules
  dos: z.array(z.string()).default([]),
  donts: z.array(z.string()).default([]),
  legalClaims: z.array(z.string()).optional(),

  // Step 6: Proof Points & CTAs
  proofPoints: z.array(z.string()).default([]),
  ctaLibrary: z.array(z.string()).default([]),

  // Step 7: Platform Setup
  platforms: z.object({
    tiktok: z.boolean(),
    instagram: z.boolean(),
    youtube: z.boolean(),
  }),
  platformPreferences: z.record(z.any()).optional(),

  // Step 8: Topic Deck
  topics: z.array(z.object({
    label: z.string(),
    weight: z.number().min(1).max(10),
    minFrequency: z.number().optional(),
    maxFrequency: z.number().optional(),
    examples: z.array(z.string()).optional(),
  })).default([]),
})

export type BrandFormData = z.infer<typeof brandFormSchema>

export interface BrandSuggestions {
  targetAudience?: string[]
  voiceTone?: string[]
  languageStyle?: string[]
  coreValues?: string[]
  visualKeywords?: string[]
  aestheticReferences?: string[]
  negativePrompts?: string[]
  dos?: string[]
  donts?: string[]
  proofPoints?: string[]
  ctaLibrary?: string[]
  legalClaims?: string[]
}

export const defaultBrandForm: Partial<BrandFormData> = {
  name: "",
  logo: "",
  primaryColor: "#3B82F6",
  mission: "",
  coreValues: [],
  targetAudience: "",
  voiceTone: "",
  languageStyle: "",
  visualKeywords: [],
  aestheticReferences: [],
  negativePrompts: [],
  dos: [],
  donts: [],
  legalClaims: [],
  proofPoints: [],
  ctaLibrary: [],
  platforms: {
    tiktok: false,
    instagram: false,
    youtube: false,
  },
  topics: [],
}
