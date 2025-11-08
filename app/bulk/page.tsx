"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BrandSelector } from "@/components/brand-selector"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Zap, Calendar, Loader2 } from "lucide-react"
import { getBrands } from "@/lib/actions/brands"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

type GenerationSummary = {
  requested: number
  successes: number
  failures: number
}

type GeneratedItem = {
  date: string
  topic: string
  platform: string
  status: "success" | "failed"
  error?: string
}

export default function BulkGeneratePage() {
  const [brands, setBrands] = useState<any[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState<string>("")
  const [topics, setTopics] = useState<any[]>([])
  const [dateRange, setDateRange] = useState(7)
  const [platform, setPlatform] = useState("tiktok")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedItems, setGeneratedItems] = useState<GeneratedItem[]>([])
  const [summary, setSummary] = useState<GenerationSummary | null>(null)
  const { toast } = useToast()
  const notifyContentUpdate = useCallback((brandId: string) => {
    if (typeof window === "undefined" || !brandId) return
    window.dispatchEvent(
      new CustomEvent("content-items-updated", {
        detail: { brandId },
      })
    )
  }, [])

  const loadBrands = useCallback(async () => {
    const result = await getBrands()
    if (result.success) {
      setBrands(result.brands)
      setSelectedBrandId((current) => current || ((result.brands as any)[0]?.id ?? ""))
    }
  }, [])

  const loadTopicsForBrand = useCallback(async (brandId: string) => {
    try {
      const response = await fetch(`/api/topics/${brandId}`)
      const data = await response.json()
      if (data.success) {
        setTopics(data.topics)
      }
    } catch (error) {
      console.error("Error loading topics:", error)
    }
  }, [])

  useEffect(() => {
    loadBrands()
  }, [loadBrands])

  useEffect(() => {
    if (selectedBrandId) {
      loadTopicsForBrand(selectedBrandId)
    }
  }, [selectedBrandId, loadTopicsForBrand])

  const handleBulkGenerate = async () => {
    if (!selectedBrandId || topics.length === 0) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a brand with topics configured",
      })
      return
    }

    setIsGenerating(true)
    setGeneratedItems([])
    setSummary(null)

    try {
      const response = await fetch("/api/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: selectedBrandId,
          days: dateRange,
          platform,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Bulk generation failed")
      }

      const normalizedItems: GeneratedItem[] = (data.results || []).map((item: GeneratedItem) => ({
        ...item,
        date: new Date(item.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
      }))

      setGeneratedItems(normalizedItems)
      setSummary(data.summary || null)
      const successes = data.summary?.successes ?? 0

      if (successes > 0) {
        notifyContentUpdate(selectedBrandId)
        toast({
          title: "Bulk generation complete!",
          description: `Generated ${successes} out of ${data.summary?.requested ?? dateRange} items`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "No content generated",
          description: "Every attempt failed. Check your API keys and brand configuration.",
        })
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error.message || "An error occurred during bulk generation",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const selectedBrand = brands.find((b) => b.id === selectedBrandId)

  return (
    <div className="space-y-8">
      <section className="glass p-6 sm:p-8">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[color:var(--muted)]">Bulk studio</p>
          <h1 className="text-3xl font-semibold text-[color:var(--text)]">Generate days of content in one pass</h1>
          <p className="text-sm text-[color:var(--muted)]">Stack prompts, vary topics, and auto-schedule across platforms.</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Settings Panel */}
        <div className="space-y-6">
          <Card>
              <CardHeader>
                <CardTitle>Generation Settings</CardTitle>
                <CardDescription>Configure bulk generation parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <BrandSelector
                    brands={brands}
                    selectedBrandId={selectedBrandId}
                    onBrandChange={setSelectedBrandId}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Number of Days</Label>
                  <Select value={dateRange.toString()} onValueChange={(v) => setDateRange(Number(v))}>
                    <SelectTrigger className="mt-1 glass border border-white/10 bg-transparent text-[color:var(--text)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass border border-white/10 bg-[var(--surface)] text-[color:var(--text)]">
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="21">21 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger className="mt-1 glass border border-white/10 bg-transparent text-[color:var(--text)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass border border-white/10 bg-[var(--surface)] text-[color:var(--text)]">
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {topics.length > 0 && (
                  <div>
                    <Label>Topics ({topics.length})</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {topics.map((topic) => (
                        <Badge
                          key={topic.id}
                          variant="secondary"
                          className="rounded-lg border border-white/10 bg-white/5 text-[color:var(--text)]/80"
                        >
                          {topic.label} (w: {topic.weight})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleBulkGenerate}
                  disabled={isGenerating || !selectedBrandId || topics.length === 0}
                  className="w-full rounded-lg bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent)]/90"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Generate {dateRange} Days
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

          {selectedBrand && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Brand Info</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-1 text-sm font-semibold text-[color:var(--text)]">{selectedBrand.name}</p>
                <p className="text-xs text-[color:var(--muted)]">{selectedBrand.mission}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Generation Progress</CardTitle>
              <CardDescription>
                {isGenerating
                  ? `Processing ${dateRange} days`
                  : generatedItems.length > 0
                  ? `${generatedItems.length} items processed`
                  : "Ready to generate"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedItems.length === 0 && !isGenerating ? (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-white/10">
                    <Calendar className="h-7 w-7 text-[color:var(--accent)]" />
                  </div>
                  <p className="text-sm text-[color:var(--muted)]">
                    Click “Generate” to start creating content for the next {dateRange} days
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {summary && (
                    <div className="glass border border-white/10 bg-transparent p-4 text-sm text-[color:var(--muted)]">
                      <div className="font-semibold text-[color:var(--text)]">Summary</div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                          <p className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--muted)]/80">Requested</p>
                          <p className="mt-2 text-lg font-semibold text-[color:var(--text)]">{summary.requested}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                          <p className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--muted)]/80">Success</p>
                          <p className="mt-2 text-lg font-semibold text-emerald-300">{summary.successes}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                          <p className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--muted)]/80">Failed</p>
                          <p className="mt-2 text-lg font-semibold text-rose-300">{summary.failures}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {generatedItems.map((item, index) => (
                    <Card key={index} className="glass border border-white/10 bg-transparent p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[color:var(--text)]">{item.date}</div>
                          <div className="text-sm text-[color:var(--muted)]">
                            {item.topic} • {item.platform}
                          </div>
                          {item.error && <div className="mt-1 text-xs text-destructive">{item.error}</div>}
                        </div>
                        <Badge
                          className={cn(
                            "rounded-lg px-3 py-1 text-xs",
                            item.status === "success"
                              ? "bg-emerald-500/10 text-emerald-300"
                              : item.status === "failed"
                              ? "bg-rose-500/10 text-rose-300"
                              : "bg-amber-500/10 text-amber-300"
                          )}
                        >
                          {item.status}
                        </Badge>
                      </div>
                    </Card>
                  ))}

                  {isGenerating && (
                    <Card className="border border-dashed border-white/20 bg-transparent p-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-[color:var(--accent)]" />
                        <span className="text-sm text-[color:var(--muted)]">Generating next item...</span>
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
