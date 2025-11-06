"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BrandSelector } from "@/components/brand-selector"
import { Plus, Calendar as CalendarIcon, Zap, TrendingUp } from "lucide-react"
import { getBrands } from "@/lib/actions/brands"
import { getContentItemsByStatus } from "@/lib/actions/content"
import { Badge } from "@/components/ui/badge"

export default function Dashboard() {
  const [brands, setBrands] = useState<any[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState<string>("")
  const [contentByStatus, setContentByStatus] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)

  const loadBrands = useCallback(async () => {
    const result = await getBrands()
    if (result.success) {
      setBrands(result.brands)
      setSelectedBrandId((current) => current || ((result.brands as any)[0]?.id ?? ""))
    }
    setLoading(false)
  }, [])

  const loadContentForBrand = useCallback(async (brandId: string) => {
    const result = await getContentItemsByStatus(brandId)
    if (result.success) {
      setContentByStatus(result.byStatus)
    }
  }, [])

  useEffect(() => {
    loadBrands()
  }, [loadBrands])

  useEffect(() => {
    if (selectedBrandId) {
      loadContentForBrand(selectedBrandId)
    }
  }, [selectedBrandId, loadContentForBrand])

  useEffect(() => {
    if (!selectedBrandId) return

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ brandId?: string }>).detail
      if (!detail?.brandId || detail.brandId === selectedBrandId) {
        loadContentForBrand(selectedBrandId)
      }
    }

    window.addEventListener("content-items-updated", handler)
    return () => window.removeEventListener("content-items-updated", handler)
  }, [selectedBrandId, loadContentForBrand])

  const selectedBrand = brands.find((b) => b.id === selectedBrandId)

  const statuses = [
    { key: "idea", label: "Ideas", icon: "💡" },
    { key: "prompted", label: "Prompted", icon: "✍️" },
    { key: "generated", label: "Generated", icon: "🎬" },
    { key: "enhanced", label: "Enhanced", icon: "✨" },
    { key: "qc", label: "QC", icon: "✅" },
    { key: "scheduled", label: "Scheduled", icon: "📅" },
    { key: "published", label: "Published", icon: "🚀" },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/60">Loading...</p>
      </div>
    )
  }

  if (brands.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="glass text-center py-16 max-w-2xl">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-primary/20 p-6">
              <TrendingUp className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Storyboard</h2>
              <p className="text-white/60 mb-6">
                Create your first brand to start managing content across platforms
              </p>
              <Link href="/brands/new">
                <Button size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Create First Brand
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const totalItems = Object.values(contentByStatus).flat().length

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-white/60">Overview of your content pipeline</p>
            </div>
            <div className="flex items-center gap-4">
              <BrandSelector
                brands={brands}
                selectedBrandId={selectedBrandId}
                onBrandChange={setSelectedBrandId}
              />
              <Link href="/calendar">
                <Button variant="secondary">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
              </Link>
              <Link href="/bulk">
                <Button>
                  <Zap className="h-4 w-4 mr-2" />
                  Bulk Generate
                </Button>
              </Link>
            </div>
          </div>

          {/* Brand Info */}
          {selectedBrand && (
            <Card className="glass">
              <CardHeader>
                <CardTitle>{selectedBrand.name}</CardTitle>
                <CardDescription>{selectedBrand.mission}</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardDescription>Total Items</CardDescription>
              <CardTitle className="text-3xl">{totalItems}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardDescription>In Progress</CardDescription>
              <CardTitle className="text-3xl">
                {(contentByStatus.prompted?.length || 0) +
                  (contentByStatus.generated?.length || 0) +
                  (contentByStatus.enhanced?.length || 0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardDescription>Scheduled</CardDescription>
              <CardTitle className="text-3xl">
                {contentByStatus.scheduled?.length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardDescription>Published</CardDescription>
              <CardTitle className="text-3xl text-green-400">
                {contentByStatus.published?.length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Status Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {statuses.map((status) => (
            <Card key={status.key} className="glass">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">
                    {status.icon} {status.label}
                  </CardTitle>
                  <Badge variant="secondary" className="glass">
                    {contentByStatus[status.key]?.length || 0}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contentByStatus[status.key]?.slice(0, 3).map((item: any) => (
                    <Link key={item.id} href={`/content/${item.id}`}>
                      <div className="glass p-3 rounded-lg cursor-pointer hover:bg-white/10 smooth">
                        <div className="text-xs text-white/60 mb-1">
                          {new Date(item.date_target).toLocaleDateString()}
                        </div>
                        <div className="text-sm capitalize">{item.platform}</div>
                      </div>
                    </Link>
                  ))}
                  {(contentByStatus[status.key]?.length || 0) === 0 && (
                    <p className="text-xs text-white/40 text-center py-4">No items</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
