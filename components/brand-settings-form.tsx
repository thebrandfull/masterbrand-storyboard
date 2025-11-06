"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { BrandFormData, brandFormSchema, defaultBrandForm } from "@/types/brand"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { updateBrand } from "@/lib/actions/brands"
import { Step1BasicInfo } from "@/components/onboarding/steps/step1-basic-info"
import { Step2MissionValues } from "@/components/onboarding/steps/step2-mission-values"
import { Step3AudienceTone } from "@/components/onboarding/steps/step3-audience-tone"
import { Step4VisualLexicon } from "@/components/onboarding/steps/step4-visual-lexicon"
import { Step5ContentRules } from "@/components/onboarding/steps/step5-content-rules"
import { Step6ProofPointsCTAs } from "@/components/onboarding/steps/step6-proof-ctas"
import { Step7PlatformSetup } from "@/components/onboarding/steps/step7-platform-setup"
import { Step8TopicDeck } from "@/components/onboarding/steps/step8-topic-deck"

const sections = [
  { title: "Basic Info", component: Step1BasicInfo },
  { title: "Mission & Values", component: Step2MissionValues },
  { title: "Audience & Tone", component: Step3AudienceTone },
  { title: "Visual Lexicon", component: Step4VisualLexicon },
  { title: "Content Rules", component: Step5ContentRules },
  { title: "Proof & CTAs", component: Step6ProofPointsCTAs },
  { title: "Platforms", component: Step7PlatformSetup },
  { title: "Topic Deck", component: Step8TopicDeck },
]

interface BrandSettingsFormProps {
  initialData?: Partial<BrandFormData>
  brandId: string
}

export function BrandSettingsForm({ initialData, brandId }: BrandSettingsFormProps) {
  const form = useForm<BrandFormData>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: { ...defaultBrandForm, ...initialData },
    mode: "onBlur",
  })
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (values: BrandFormData) => {
    setIsSaving(true)
    const result = await updateBrand(brandId, values)
    if (result.success) {
      toast({ title: "Brand updated", description: "Changes saved successfully." })
    } else {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: result.error || "Unable to save brand",
      })
    }
    setIsSaving(false)
  }

  return (
    <div className="space-y-6">
      <Card className="glass p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Brand Settings</h1>
          <p className="text-white/60">
            Update any part of this brand profile. Sections are grouped for quick access.
          </p>
        </div>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {sections.map((Section) => (
            <Card key={Section.title} className="glass p-6">
              <Section.component form={form} suggestions={null} />
            </Card>
          ))}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="submit" disabled={isSaving} className="min-w-[140px]">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
