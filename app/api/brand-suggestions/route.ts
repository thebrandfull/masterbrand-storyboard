import { NextRequest, NextResponse } from "next/server"
import { generateBrandSuggestions, DeepSeekError } from "@/lib/deepseek"
import type { BrandSuggestions } from "@/types/brand"

const DEEPSEEK_TIMEOUT_MS = 8000

function buildFallbackSuggestions(name: string, mission: string): BrandSuggestions {
  const brandName = name || "the brand"
  const missionFragment = mission || "delivering remarkable experiences"
  const missionFocus = missionFragment.length > 80 ? missionFragment.slice(0, 77) + "..." : missionFragment

  const targetAudience = [
    `${brandName} loyalists`,
    `People motivated by ${missionFocus.toLowerCase()}`,
    "Modern digital explorers",
  ]

  return {
    targetAudience,
    voiceTone: ["Warm expert", "Bold storyteller", "Precision-driven"],
    languageStyle: ["Conversational", "Solution-focused", "Narrative-first"],
    coreValues: ["Innovation", "Clarity", "Integrity", "Community"],
    visualKeywords: ["cinematic", "vibrant", "editorial", "future-forward"],
    aestheticReferences: ["Apple keynote", "Vogue editorial", "Documentary realism"],
    negativePrompts: ["overly corporate", "flat lighting", "generic stock visuals"],
    dos: ["Lead with outcomes", "Show behind-the-scenes moments", "Highlight community wins"],
    donts: ["Avoid jargon", "Skip fear-based hooks", "No unverified claims"],
    proofPoints: ["Featured in leading publications", "5k+ customers served", "Backed by industry experts"],
    ctaLibrary: ["Start your next chapter", "See how it works", "Claim your spot today"],
    legalClaims: ["Avoid guaranteed results", "Do not imply medical outcomes"],
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, mission } = await request.json()
    if (!name || !mission) {
      return NextResponse.json(
        { success: false, error: "Missing name or mission" },
        { status: 400 }
      )
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      const suggestions = buildFallbackSuggestions(name, mission)
      return NextResponse.json({ success: true, suggestions, fallback: true })
    }

    try {
      const suggestions = await Promise.race([
        generateBrandSuggestions({ name, mission }),
        new Promise<BrandSuggestions>((_, reject) =>
          setTimeout(
            () => reject(new DeepSeekError("Suggestion timeout", "network", 504)),
            DEEPSEEK_TIMEOUT_MS
          )
        ),
      ])
      return NextResponse.json({ success: true, suggestions })
    } catch (error) {
      if (error instanceof DeepSeekError && error.code === "invalid") {
        throw error
      }
      const suggestions = buildFallbackSuggestions(name, mission)
      return NextResponse.json({
        success: true,
        suggestions,
        fallback: true,
        error: error instanceof Error ? error.message : undefined,
      })
    }
  } catch (error) {
    const message =
      error instanceof DeepSeekError ? error.message : "Failed to generate suggestions"
    const status = error instanceof DeepSeekError ? error.status ?? 500 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
