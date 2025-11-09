"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Calendar as CalendarIcon, Zap, TrendingUp } from "lucide-react"
import { getBrands } from "@/lib/actions/brands"
import { getContentItemsByStatus } from "@/lib/actions/content"
import { Badge } from "@/components/ui/badge"
import { useBrandSelection } from "@/hooks/use-brand-selection"
import { LuminousPanel } from "@/components/ui/luminous-panel"
import { Card } from "@/components/ui/card"

export default function Dashboard() {
  const [brands, setBrands] = useState<any[]>([])
  const [contentByStatus, setContentByStatus] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const { selectedBrandId, setSelectedBrandId } = useBrandSelection()

  const loadBrands = useCallback(async () => {
    const result = await getBrands()
    if (result.success) {
      setBrands(result.brands)
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
    if (!selectedBrandId && brands.length > 0) {
      setSelectedBrandId(brands[0].id)
    }
  }, [brands, selectedBrandId, setSelectedBrandId])

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
        <p className="text-[color:var(--muted)]">Loading...</p>
      </div>
    )
  }

  if (brands.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <Card className="w-full max-w-xl text-center">
          <div className="flex flex-col items-center gap-6 py-12">
            <div className="glass flex h-16 w-16 items-center justify-center">
              <TrendingUp className="h-9 w-9 text-[color:var(--accent)]" />
            </div>
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-[color:var(--muted)]">Getting started</p>
              <h2 className="text-2xl font-semibold text-[color:var(--text)]">Welcome to Storyboard</h2>
              <p className="text-sm text-[color:var(--muted)]">
                Create your first brand to unlock the dashboard and tailor tone, topics, and guardrails.
              </p>
            </div>
            <Link href="/brands/new">
              <Button size="lg" className="bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent)]/90">
                <Plus className="mr-2 h-4 w-4" />
                Create first brand
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const totalItems = Object.values(contentByStatus).flat().length

  return (
    <div className="space-y-8">
      <LuminousPanel className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.32em] text-[color:var(--muted)]">Command center</p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-[color:var(--text)]">Creator control room</h1>
              <p className="text-sm text-[color:var(--muted)]">Monitor every piece of content across your pipeline.</p>
            </div>
            {selectedBrand && (
              <div className="glass space-y-2 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--muted)]">Brand in focus</p>
                <p className="text-lg font-semibold text-[color:var(--text)]">{selectedBrand.name}</p>
                <p className="text-sm text-[color:var(--muted)]">{selectedBrand.mission}</p>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
            <Link href="/calendar">
              <Button variant="secondary" className="bg-transparent text-[color:var(--text)] hover:bg-white/10">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Calendar
              </Button>
            </Link>
            <Link href="/bulk">
              <Button className="bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent)]/90">
                <Zap className="mr-2 h-4 w-4" />
                Bulk generate
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <div key={stat.label} className="glass px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--muted)]">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold text-[color:var(--text)]">{stat.value}</p>
            </div>
          ))}
        </div>
      </LuminousPanel>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statuses.map((status) => (
          <div key={status.key} className="glass p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[color:var(--text)]">
                {status.icon} {status.label}
              </p>
              <Badge className="border-0 bg-white/10 text-[color:var(--text)]/80">
                {contentByStatus[status.key]?.length || 0}
              </Badge>
            </div>
            <div className="mt-3 space-y-2">
              {contentByStatus[status.key]?.slice(0, 3).map((item: any) => (
                <Link key={item.id} href={`/content/${item.id}`}>
                  <div className="glass cursor-pointer px-3 py-2 text-sm text-[color:var(--text)]/85 transition hover:bg-white/15">
                    <p className="text-xs text-[color:var(--muted)]">
                      {new Date(item.date_target).toLocaleDateString()}
                    </p>
                    <p className="mt-1 font-medium capitalize text-[color:var(--text)]">{item.platform}</p>
                  </div>
                </Link>
              ))}
              {(contentByStatus[status.key]?.length || 0) === 0 && (
                <p className="py-4 text-center text-xs text-[color:var(--muted)]">No items</p>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
