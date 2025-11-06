"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BrandSelector } from "@/components/brand-selector"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { getBrands } from "@/lib/actions/brands"
import { createContentItem, getContentItemsByBrand } from "@/lib/actions/content"
import { Badge } from "@/components/ui/badge"
import { cn, getStatusColor } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface BrandRecord {
  id: string
  name: string
}

interface CalendarContentItem {
  id: string
  date_target: string
  platform: string
  status: string
}

const statusOptions = [
  { value: "idea", label: "Idea" },
  { value: "prompted", label: "Prompted" },
  { value: "generated", label: "Generated" },
  { value: "enhanced", label: "Enhanced" },
  { value: "qc", label: "QC" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
]

const platformOptions = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
]

export default function CalendarPage() {
  const [brands, setBrands] = useState<BrandRecord[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState<string>("")
  const [contentItems, setContentItems] = useState<CalendarContentItem[]>([])
  const [activeStatuses, setActiveStatuses] = useState<string[]>(statusOptions.map((s) => s.value))
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)

  const loadBrands = useCallback(async () => {
    const result = await getBrands()
    if (result.success) {
      const brandList = (result.brands ?? []) as BrandRecord[]
      setBrands(brandList)
      setSelectedBrandId((current) => current || (brandList[0]?.id ?? ""))
    }
    setLoading(false)
  }, [])

  const loadContentForBrand = useCallback(async (brandId: string) => {
    const result = await getContentItemsByBrand(brandId)
    if (result.success) {
      setContentItems(result.items)
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

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Pad beginning of month with days from previous month
  const startDayOfWeek = monthStart.getDay()
  const previousMonthDays = Array(startDayOfWeek).fill(null)

  // Combine days for grid
  const allDays = [...previousMonthDays, ...daysInMonth]

  const filteredItems = useMemo(
    () => contentItems.filter((item) => activeStatuses.includes(item.status)),
    [contentItems, activeStatuses]
  )

  const contentByDate = useMemo(() => {
    return filteredItems.reduce<Record<string, CalendarContentItem[]>>((acc, item) => {
      const dateKey = format(new Date(item.date_target), "yyyy-MM-dd")
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(item)
      return acc
    }, {})
  }, [filteredItems])

  const monthlyStats = useMemo(() => {
    const counts: Record<string, number> = {}
    contentItems.forEach((item) => {
      counts[item.status] = (counts[item.status] || 0) + 1
    })
    return statusOptions.map((option) => ({
      ...option,
      count: counts[option.value] || 0,
      active: activeStatuses.includes(option.value),
    }))
  }, [contentItems, activeStatuses])

  const toggleStatus = (value: string) => {
    setActiveStatuses((prev) =>
      prev.includes(value) ? prev.filter((status) => status !== value) : [...prev, value]
    )
  }

  const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const handleToday = () => setCurrentDate(new Date())

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/60">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <section className="hero-panel p-6 sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Content calendar</p>
            <h1 className="text-4xl font-semibold">{format(currentDate, "MMMM yyyy")}</h1>
            <p className="mt-2 text-white/70">
              Plan and visualize your content schedule with live status filtering.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <BrandSelector
              brands={brands}
              selectedBrandId={selectedBrandId}
              onBrandChange={setSelectedBrandId}
            />
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-2">
              <Button variant="ghost" className="rounded-full text-white hover:bg-white/10" onClick={handleToday}>
                Today
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/10" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/10" onClick={handleNextMonth}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {monthlyStats.map((stat) => (
          <Card
            key={stat.value}
            className={cn(
              "cursor-pointer border-white/10 bg-[#111111]/70 p-4",
              stat.active ? "ring-1 ring-[#ff2a2a]" : ""
            )}
            onClick={() => toggleStatus(stat.value)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/40">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold">{stat.count}</p>
              </div>
              <Badge className={getStatusColor(stat.value)}>{stat.active ? "On" : "Off"}</Badge>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="mb-6 grid grid-cols-7 gap-4 text-center text-sm font-semibold text-white/60">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-4">
          {allDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="h-32 rounded-2xl border border-dashed border-white/5" />
            }

            const dateKey = format(day, "yyyy-MM-dd")
            const dayContent = contentByDate[dateKey] || []
            const isToday = isSameDay(day, new Date())

            return (
              <DayCard
                key={dateKey}
                day={day}
                currentDate={currentDate}
                items={dayContent}
                isToday={isToday}
                brandId={selectedBrandId}
              />
            )
          })}
        </div>
      </Card>
    </div>
  )
}

interface DayCardProps {
  day: Date
  currentDate: Date
  items: CalendarContentItem[]
  isToday: boolean
  brandId: string
}

function DayCard({ day, currentDate, items, isToday, brandId }: DayCardProps) {
  const [platform, setPlatform] = useState(platformOptions[0].value)
  const [creating, setCreating] = useState(false)
  const { toast } = useToast()

  const handleCreate = async () => {
    if (!brandId) return
    setCreating(true)
    const result = await createContentItem({
      brandId,
      dateTarget: format(day, "yyyy-MM-dd"),
      platform,
    })
    setCreating(false)

    if (result.success) {
      toast({
        title: "Content slot created",
        description: `${platform} scheduled for ${format(day, "PPP")}`,
      })
      window.dispatchEvent(new CustomEvent("content-items-updated", { detail: { brandId } }))
    } else {
      toast({
        variant: "destructive",
        title: "Failed to create slot",
        description: result.error || "Unknown error",
      })
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card
          className={cn(
            "h-32 cursor-pointer overflow-hidden border-white/10 bg-[#0b0b0b]/85 p-3 transition hover:-translate-y-0.5 hover:border-[#ff2a2a]/40",
            isToday ? "ring-2 ring-[#ff2a2a]" : ""
          )}
        >
          <div className="mb-2 flex items-start justify-between">
            <span className={cn("text-sm font-semibold", isSameMonth(day, currentDate) ? "" : "text-white/30")}>
              {format(day, "d")}
            </span>
            {items.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {items.length}
              </Badge>
            )}
          </div>
          <div className="space-y-1">
            {items.slice(0, 2).map((item) => (
              <div
                key={item.id}
                className={cn("truncate rounded-full px-3 py-1 text-xs font-medium", getStatusColor(item.status))}
              >
                {item.platform}
              </div>
            ))}
            {items.length > 2 && <div className="pl-2 text-xs text-white/40">+{items.length - 2} more</div>}
          </div>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-3xl border border-white/10 bg-[#111111]/90">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-white">{format(day, "MMMM d, yyyy")}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/60">No content scheduled for this day</p>
          ) : (
            items.map((item) => (
              <Link key={item.id} href={`/content/${item.id}`}>
                <Card className="cursor-pointer border-white/10 bg-[#0c0c0c]/80 p-4 transition hover:border-[#ff2a2a]/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold capitalize text-white">{item.platform}</div>
                      <div className="text-xs text-white/60">ID: {item.id.slice(0, 8)}</div>
                    </div>
                    <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-sm font-semibold text-white/80">Quick create</p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="rounded-2xl border border-white/10 bg-[#0f0f0f] text-white">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-white/10 bg-[#111111] text-white">
                {platformOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleCreate}
              disabled={creating || !brandId}
              className="rounded-full bg-[#ff2a2a] text-white hover:bg-[#ff2a2a]/90"
            >
              {creating ? <LoaderIcon /> : <Plus className="mr-2 h-4 w-4" />}
              {creating ? "Creating..." : "Create slot"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function LoaderIcon() {
  return <span className="relative flex h-4 w-4 items-center justify-center">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
  </span>
}
