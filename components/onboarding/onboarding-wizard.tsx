"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { brandFormSchema, defaultBrandForm, type BrandFormData, type BrandSuggestions } from "@/types/brand"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

import { Step1BasicInfo } from "./steps/step1-basic-info"
import { Step2MissionValues } from "./steps/step2-mission-values"
import { Step3AudienceTone } from "./steps/step3-audience-tone"
import { Step4VisualLexicon } from "./steps/step4-visual-lexicon"
import { Step5ContentRules } from "./steps/step5-content-rules"
import { Step6ProofPointsCTAs } from "./steps/step6-proof-ctas"
import { Step7PlatformSetup } from "./steps/step7-platform-setup"
import { Step8TopicDeck } from "./steps/step8-topic-deck"

const steps = [
  { title: "Basic Info", component: Step1BasicInfo },
  { title: "Mission & Values", component: Step2MissionValues },
  { title: "Audience & Tone", component: Step3AudienceTone },
  { title: "Visual Lexicon", component: Step4VisualLexicon },
  { title: "Content Rules", component: Step5ContentRules },
  { title: "Proof & CTAs", component: Step6ProofPointsCTAs },
  { title: "Platforms", component: Step7PlatformSetup },
  { title: "Topic Deck", component: Step8TopicDeck },
]

interface OnboardingWizardProps {
  onComplete: (data: BrandFormData) => Promise<void>
  initialData?: Partial<BrandFormData>
}

export function OnboardingWizard({ onComplete, initialData }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suggestions, setSuggestions] = useState<BrandSuggestions | null>(null)
  const [suggestionsUpdatedAt, setSuggestionsUpdatedAt] = useState<Date | null>(null)
  const [isGeneratingSuggestions, startTransition] = useTransition()
  const { toast } = useToast()

  const form = useForm<BrandFormData>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: { ...defaultBrandForm, ...initialData },
    mode: "onChange",
  })

  const progress = ((currentStep + 1) / steps.length) * 100
  const CurrentStepComponent = steps[currentStep].component
  const isLastStep = currentStep === steps.length - 1

  const handleNext = async () => {
    // For now, allow progression without full validation
    // Individual fields have their own validation
    if (!isLastStep) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (data: BrandFormData) => {
    setIsSubmitting(true)
    try {
      await onComplete(data)
    } catch (error) {
      console.error("Failed to create brand:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const watchName = form.watch("name")?.trim()
  const watchMission = form.watch("mission")?.trim()
  const canGenerateSuggestions = Boolean(watchName && watchMission)

  const handleGenerateSuggestions = () => {
    if (!canGenerateSuggestions) {
      toast({
        variant: "destructive",
        title: "Need more info",
        description: "Enter brand name and mission first.",
      })
      return
    }

    startTransition(async () => {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)
        const response = await fetch("/api/brand-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: watchName, mission: watchMission }),
          signal: controller.signal,
        })
        clearTimeout(timeout)

        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to generate suggestions")
        }

        setSuggestions(result.suggestions)
        const timestamp = new Date()
        setSuggestionsUpdatedAt(timestamp)
        toast({
          title: result.fallback ? "Suggestions ready (instant mode)" : "Suggestions ready",
          description: result.fallback
            ? "DeepSeek is offline, showing curated quick picks instead."
            : "Quick picks unlocked for the upcoming steps.",
        })
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Generation failed",
          description: error?.message || "Unable to fetch suggestions",
        })
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-bold">Create Brand</h2>
          <span className="text-sm text-white/60">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Smart Suggestions */}
      <Card className="glass p-4 mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Smart Suggestions</h3>
            <p className="text-sm text-white/60">
              Generate AI-powered quick picks based on your brand name and mission.
            </p>
            {suggestionsUpdatedAt && (
              <p className="text-xs text-white/40">
                Last generated {suggestionsUpdatedAt.toLocaleTimeString()}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={handleGenerateSuggestions}
            disabled={isGeneratingSuggestions || !canGenerateSuggestions}
          >
            {isGeneratingSuggestions
              ? "Generating..."
              : suggestions
              ? "Refresh suggestions"
              : "Generate suggestions"}
          </Button>
        </div>
      </Card>

      {/* Step Indicators */}
      <div className="flex justify-between mb-8 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              "flex flex-col items-center gap-2 min-w-fit px-2",
              index <= currentStep ? "opacity-100" : "opacity-40"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center smooth",
                index < currentStep
                  ? "bg-primary text-primary-foreground"
                  : index === currentStep
                  ? "bg-primary/20 text-primary border-2 border-primary"
                  : "glass"
              )}
            >
              {index < currentStep ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}
            </div>
            <span className="text-xs text-center whitespace-nowrap">
              {step.title}
            </span>
          </div>
        ))}
      </div>

      {/* Form Content */}
      <Card className="glass p-8 mb-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <CurrentStepComponent form={form} suggestions={suggestions} />

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 0 || isSubmitting}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {isLastStep ? (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Brand"}
                  <Check className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="button" onClick={handleNext}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </Card>
    </div>
  )
}
