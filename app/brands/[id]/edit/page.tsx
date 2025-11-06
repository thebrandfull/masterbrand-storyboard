import { getBrandById } from "@/lib/actions/brands"
import { BrandSettingsForm } from "@/components/brand-settings-form"
import { notFound } from "next/navigation"
import { BrandFormData } from "@/types/brand"

export const dynamic = "force-dynamic"

function mapBrandToForm(brand: any, topics: any[]): Partial<BrandFormData> {
  const platformConstraints = brand.platform_constraints || {}
  const metadata = platformConstraints.metadata || {}
  return {
    name: brand.name || "",
    mission: brand.mission || "",
    voiceTone: brand.voice_tone || "",
    languageStyle: metadata.languageStyle || "",
    targetAudience: brand.target_audience || "",
    visualKeywords: brand.visual_lexicon
      ? brand.visual_lexicon.split(",").map((keyword: string) => keyword.trim()).filter(Boolean)
      : [],
    dos: brand.dos || [],
    donts: brand.donts || [],
    coreValues: metadata.coreValues || [],
    proofPoints: brand.proof_points || [],
    ctaLibrary: brand.cta_library || [],
    aestheticReferences: metadata.aestheticReferences || [],
    legalClaims: metadata.legalClaims || [],
    negativePrompts: brand.negative_prompts || [],
    platforms:
      platformConstraints.platforms ||
      {
        tiktok: false,
        instagram: false,
        youtube: false,
      },
    platformPreferences: platformConstraints.preferences || {},
    topics: topics.map((topic) => ({
      label: topic.label,
      weight: topic.weight,
      minFrequency: topic.min_frequency,
      maxFrequency: topic.max_frequency,
      examples: topic.examples || [],
    })),
  }
}

export default async function EditBrandPage({ params }: { params: { id: string } }) {
  const { brand, topics } = await getBrandById(params.id)

  if (!brand) {
    notFound()
  }

  const initialData = mapBrandToForm(brand, topics)

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <BrandSettingsForm brandId={params.id} initialData={initialData} />
      </div>
    </div>
  )
}
