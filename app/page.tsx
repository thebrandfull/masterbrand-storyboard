"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/60">Loading...</p>
      </div>
    )
  }

  if (brands.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <Card className="w-full max-w-2xl text-center">
          <div className="flex flex-col items-center gap-5 py-16">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <TrendingUp className="h-12 w-12 text-[#ff2a2a]" />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">Getting started</p>
                <h2 className="mt-2 text-3xl font-semibold">Welcome to Storyboard</h2>
              </div>
              <p className="text-white/70">
                Create your first brand to bring in tone, topics, and constraints. The dashboard lights up the moment a
                brand exists.
              </p>
              <Link href="/brands/new">
                <Button size="lg" className="rounded-full bg-[#ff2a2a] text-white hover:bg-[#ff2a2a]/90">
                  <Plus className="mr-2 h-5 w-5" />
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
    <div className="space-y-10">
      <section className="hero-panel overflow-hidden p-6 sm:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Command center</p>
            <div>
              <h1 className="text-4xl font-semibold">Creator control room</h1>
              <p className="mt-2 text-white/70">Monitor every piece of content across your pipeline.</p>
            </div>
            {selectedBrand && (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.4em] text-white/40">Brand in focus</p>
                <p className="mt-2 text-2xl font-semibold">{selectedBrand.name}</p>
                <p className="text-sm text-white/65">{selectedBrand.mission}</p>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
            <BrandSelector
              brands={brands}
              selectedBrandId={selectedBrandId}
              onBrandChange={setSelectedBrandId}
            />
            <Link href="/calendar">
              <Button variant="secondary" className="rounded-full border border-white/10 bg-white/10 text-white hover:bg-white/20">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Calendar
              </Button>
            </Link>
            <Link href="/bulk">
              <Button className="rounded-full bg-[#ff2a2a] text-white hover:bg-[#ff2a2a]/90">
                <Zap className="mr-2 h-4 w-4" />
                Bulk Generate
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total items", value: totalItems },
            {
              label: "In progress",
              value:
                (contentByStatus.prompted?.length || 0) +
                (contentByStatus.generated?.length || 0) +
                (contentByStatus.enhanced?.length || 0),
            },
            { label: "Scheduled", value: contentByStatus.scheduled?.length || 0 },
            { label: "Published", value: contentByStatus.published?.length || 0 },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
            >
              <p className="text-xs uppercase tracking-[0.4em] text-white/40">{stat.label}</p>
              <p className="mt-2 text-4xl font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statuses.map((status) => (
          <div key={status.key} className="rounded-3xl border border-white/10 bg-[#111111]/60 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                {status.icon} {status.label}
              </p>
              <Badge className="border-0 bg-white/10 text-white/80">
                {contentByStatus[status.key]?.length || 0}
              </Badge>
            </div>
            <div className="mt-4 space-y-2">
              {contentByStatus[status.key]?.slice(0, 3).map((item: any) => (
                <Link key={item.id} href={`/content/${item.id}`}>
                  <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white/80 transition hover:-translate-y-0.5 hover:border-[#ff2a2a]/40">
                    <p className="text-xs text-white/50">
                      {new Date(item.date_target).toLocaleDateString()}
                    </p>
                    <p className="mt-1 font-medium capitalize">{item.platform}</p>
                  </div>
                </Link>
              ))}
              {(contentByStatus[status.key]?.length || 0) === 0 && (
                <p className="py-6 text-center text-xs text-white/40">No items</p>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
