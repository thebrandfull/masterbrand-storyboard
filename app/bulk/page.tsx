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
import { format, addDays } from "date-fns"
import { Badge } from "@/components/ui/badge"

export default function BulkGeneratePage() {
  const [brands, setBrands] = useState<any[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState<string>("")
  const [topics, setTopics] = useState<any[]>([])
  const [dateRange, setDateRange] = useState(7)
  const [platform, setPlatform] = useState("tiktok")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedItems, setGeneratedItems] = useState<any[]>([])
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

    try {
      const startDate = new Date()
      const items = []

      for (let i = 0; i < dateRange; i++) {
        const targetDate = addDays(startDate, i)

        // Select a weighted random topic
        const topic = selectTopicByWeight(topics)

        // Call generation API
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brandId: selectedBrandId,
            topic: topic.label,
            platform,
            dateTarget: format(targetDate, "yyyy-MM-dd"),
          }),
        })

        const result = await response.json()

        if (result.success) {
          items.push({
            date: format(targetDate, "MMM d"),
            topic: topic.label,
            platform,
            status: "success",
          })
          notifyContentUpdate(selectedBrandId)
        } else {
          items.push({
            date: format(targetDate, "MMM d"),
            topic: topic.label,
            platform,
            status: "failed",
            error: result.error,
          })
        }

        setGeneratedItems([...items])

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      toast({
        title: "Bulk generation complete!",
        description: `Generated ${items.filter(i => i.status === "success").length} out of ${dateRange} items`,
      })
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

  const selectTopicByWeight = (topics: any[]) => {
    const totalWeight = topics.reduce((sum, t) => sum + t.weight, 0)
    let random = Math.random() * totalWeight

    for (const topic of topics) {
      random -= topic.weight
      if (random <= 0) {
        return topic
      }
    }

    return topics[0]
  }

  const selectedBrand = brands.find((b) => b.id === selectedBrandId)

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bulk Generate</h1>
          <p className="text-white/60">
            Generate multiple days of content at once with topic variety
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Generation Settings</CardTitle>
                <CardDescription>Configure bulk generation parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Brand</Label>
                  <BrandSelector
                    brands={brands}
                    selectedBrandId={selectedBrandId}
                    onBrandChange={setSelectedBrandId}
                  />
                </div>

                <div>
                  <Label>Number of Days</Label>
                  <Select value={dateRange.toString()} onValueChange={(v) => setDateRange(Number(v))}>
                    <SelectTrigger className="glass mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="21">21 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger className="glass mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {topics.length > 0 && (
                  <div>
                    <Label>Topics ({topics.length})</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {topics.map((topic) => (
                        <Badge key={topic.id} variant="secondary" className="glass">
                          {topic.label} (w: {topic.weight})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleBulkGenerate}
                  disabled={isGenerating || !selectedBrandId || topics.length === 0}
                  className="w-full"
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
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-sm">Brand Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-semibold mb-1">{selectedBrand.name}</p>
                  <p className="text-xs text-white/60">{selectedBrand.mission}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Generation Progress</CardTitle>
                <CardDescription>
                  {generatedItems.length > 0
                    ? `${generatedItems.length} / ${dateRange} items processed`
                    : "Ready to generate"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedItems.length === 0 && !isGenerating ? (
                  <div className="text-center py-16">
                    <div className="rounded-full bg-primary/20 p-6 w-fit mx-auto mb-4">
                      <Calendar className="h-12 w-12 text-primary" />
                    </div>
                    <p className="text-white/60">
                      Click "Generate" to start creating content for the next {dateRange} days
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {generatedItems.map((item, index) => (
                      <Card key={index} className="glass p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{item.date}</div>
                            <div className="text-sm text-white/60">
                              {item.topic} • {item.platform}
                            </div>
                            {item.error && (
                              <div className="text-xs text-destructive mt-1">{item.error}</div>
                            )}
                          </div>
                          <Badge
                            className={
                              item.status === "success"
                                ? "bg-green-500/20 text-green-300"
                                : item.status === "failed"
                                ? "bg-red-500/20 text-red-300"
                                : "bg-yellow-500/20 text-yellow-300"
                            }
                          >
                            {item.status}
                          </Badge>
                        </div>
                      </Card>
                    ))}

                    {isGenerating && (
                      <Card className="glass p-4 border-dashed border-2 border-primary/30">
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <span className="text-sm text-white/60">Generating next item...</span>
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
    </div>
  )
}
