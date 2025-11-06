"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { BrandSelector } from "@/components/brand-selector"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { Database } from "@/types/database"

type Brand = Database["public"]["Tables"]["brands"]["Row"]
type Topic = Database["public"]["Tables"]["topics"]["Row"]

const platformOptions = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
]

interface ContentGeneratorProps {
  brands: Brand[]
}

interface GenerationResult {
  id: string
  title: string
  description: string
  prompts: string[]
  tags: string[]
  thumbnailBrief: string
}

export default function ContentGenerator({ brands }: ContentGeneratorProps) {
  const [brandId, setBrandId] = useState(brands?.[0]?.id || "")
  const [platform, setPlatform] = useState(platformOptions[0].value)
  const [topic, setTopic] = useState("")
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [topicsLoading, setTopicsLoading] = useState(false)
  const [topicsError, setTopicsError] = useState<string | null>(null)

  const selectedBrand = useMemo(
    () => brands.find((brand) => brand.id === brandId) || null,
    [brandId, brands]
  )

  useEffect(() => {
    if (!brandId) {
      setTopics([])
      setTopicsError(null)
      return
    }

    let isCancelled = false
    setTopics([])
    setTopicsError(null)
    setTopicsLoading(true)

    fetch(`/api/topics/${brandId}`)
      .then(async (response) => {
        const data = await response.json()
        if (isCancelled) return
        if (!response.ok || !data.success) {
          throw new Error(data?.error || "Failed to load topics")
        }
        setTopics(data.topics || [])
      })
      .catch((err) => {
        if (!isCancelled) {
          const message = err instanceof Error ? err.message : "Unable to load topics for this brand"
          setTopicsError(message)
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setTopicsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [brandId])

  const handleGenerate = async () => {
    if (!brandId || !topic.trim()) {
      setError("Select a brand and describe the topic or hook.")
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          topic: topic.trim(),
          platform,
          dateTarget: date,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Generation failed")
      }

      setResult({
        id: data.contentItem.id,
        title: data.generated.title,
        description: data.generated.description,
        prompts: data.generated.prompts,
        tags: data.generated.tags,
        thumbnailBrief: data.generated.thumbnailBrief,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to generate content"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Brand</Label>
            <BrandSelector
              brands={brands}
              selectedBrandId={brandId}
              onBrandChange={(id) => {
                setBrandId(id)
                setResult(null)
              }}
            />
          </div>

          {selectedBrand && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-2">
              <p className="text-xs uppercase tracking-wide text-white/40">Brand snapshot</p>
              {selectedBrand.mission && (
                <p className="text-sm text-white/80 leading-snug">{selectedBrand.mission}</p>
              )}
              <div className="flex flex-wrap gap-2 text-xs text-white/60">
                {selectedBrand.voice_tone && <Badge variant="outline">Tone: {selectedBrand.voice_tone}</Badge>}
                {selectedBrand.target_audience && (
                  <Badge variant="outline">Audience: {selectedBrand.target_audience}</Badge>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="rounded-2xl border border-white/10 bg-[#0f0f0f] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-white/10 bg-[#111111] text-white">
                {platformOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-2xl border border-white/10 bg-[#0f0f0f] text-white"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Topic / hook / desired outcome</Label>
          <Textarea
            className="h-full rounded-2xl border border-white/10 bg-[#0f0f0f] text-white placeholder:text-white/50"
            placeholder="Example: 3 myths about scaling brand studios, ending with a CTA to book a workshop."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          {topicsLoading && <p className="text-xs text-white/50">Loading topic deck…</p>}
          {topicsError && <p className="text-xs text-destructive">{topicsError}</p>}
          {topics.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-white/60">Click a topic to autofill</Label>
              <div className="flex flex-wrap gap-2">
                {topics.map((topicOption) => (
                  <button
                    key={topicOption.id}
                    type="button"
                    onClick={() => setTopic(topicOption.label)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 hover:border-[#ff2a2a]/60"
                  >
                    {topicOption.label}
                    {typeof topicOption.weight === "number" && (
                      <span className="text-white/40 ml-2">w:{topicOption.weight}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button
          onClick={handleGenerate}
          disabled={loading || !brandId}
          className="rounded-full bg-[#ff2a2a] text-white hover:bg-[#ff2a2a]/90"
        >
          {loading ? "Generating..." : "Generate content"}
        </Button>
      </div>

      {result && (
        <Card className="space-y-4 border border-[#ff2a2a]/40 bg-[#0f0f0f]/80 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/40">Content item</p>
              <h2 className="text-xl font-semibold">{result.title}</h2>
            </div>
            <Link href={`/content/${result.id}`} className="text-primary text-sm underline">
              Open record ↗
            </Link>
          </div>

          <p className="text-sm text-white/70">{result.description}</p>

          <div>
            <p className="text-xs uppercase tracking-wide text-white/40 mb-2">Prompts</p>
            <div className="space-y-2">
              {result.prompts.map((prompt, index) => (
                <Card key={`${prompt}-${index}`} className="border-white/10 bg-[#0b0b0b]/80 p-3 text-sm">
                  <p className="font-medium">Variation {index + 1}</p>
                  <p className="text-white/70 whitespace-pre-wrap">{prompt}</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {result.tags.map((tag) => (
              <Badge key={tag} className="bg-white/10 text-xs">
                #{tag}
              </Badge>
            ))}
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-white/40 mb-1">Thumbnail brief</p>
            <p className="text-sm text-white/70">{result.thumbnailBrief}</p>
          </div>
        </Card>
      )}
    </Card>
  )
}
