"use client"

import { useRouter } from "next/navigation"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"
import { createBrand } from "@/lib/actions/brands"
import { BrandFormData } from "@/types/brand"
import { useToast } from "@/hooks/use-toast"

export default function NewBrandPage() {
  const router = useRouter()
  const { toast } = useToast()

  const handleComplete = async (data: BrandFormData) => {
    const result = await createBrand(data)

    if (result.success) {
      toast({
        title: "Brand created!",
        description: `${data.name} has been successfully created.`,
      })
      router.push("/brands")
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Failed to create brand",
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <OnboardingWizard onComplete={handleComplete} />
    </div>
  )
}
