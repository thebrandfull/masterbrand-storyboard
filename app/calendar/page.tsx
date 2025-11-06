"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BrandSelector } from "@/components/brand-selector"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { getBrands } from "@/lib/actions/brands"
import { createContentItem, getContentItemsByBrand } from "@/lib/actions/content"
import { Badge } from "@/components/ui/badge"
import { getStatusColor } from "@/lib/utils"
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/60">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Content Calendar</h1>
            <p className="text-white/60">Plan and visualize your content schedule</p>
          </div>
          <div className="flex items-center gap-4">
            <BrandSelector
              brands={brands}
              selectedBrandId={selectedBrandId}
              onBrandChange={setSelectedBrandId}
            />
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{format(currentDate, "MMMM yyyy")}</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleToday} className="glass">
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {monthlyStats.map((stat) => (
            <Card
              key={stat.value}
              className={`glass p-4 cursor-pointer ${stat.active ? "ring-1 ring-primary" : ""}`}
              onClick={() => toggleStatus(stat.value)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/50">{stat.label}</p>
                  <p className="text-2xl font-semibold">{stat.count}</p>
                </div>
                <Badge className={getStatusColor(stat.value)}>{stat.active ? "On" : "Off"}</Badge>
              </div>
            </Card>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="glass rounded-lg p-6">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-4 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-white/60">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-4">
            {allDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="h-32" />
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
        </div>
      </div>
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
          className={`glass p-3 h-32 cursor-pointer hover:bg-white/10 smooth overflow-hidden ${
            isToday ? "ring-2 ring-primary" : ""
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <span className={`text-sm font-semibold ${isSameMonth(day, currentDate) ? "" : "text-white/30"}`}>
              {format(day, "d")}
            </span>
            {items.length > 0 && (
              <Badge variant="secondary" className="text-xs h-5 px-1.5">
                {items.length}
              </Badge>
            )}
          </div>
          <div className="space-y-1">
            {items.slice(0, 2).map((item) => (
              <div key={item.id} className={`text-xs px-2 py-1 rounded truncate ${getStatusColor(item.status)}`}>
                {item.platform}
              </div>
            ))}
            {items.length > 2 && <div className="text-xs text-white/40 pl-2">+{items.length - 2} more</div>}
          </div>
        </Card>
      </DialogTrigger>
      <DialogContent className="glass">
        <DialogHeader>
          <DialogTitle>{format(day, "MMMM d, yyyy")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-sm text-white/60 text-center py-8">No content scheduled for this day</p>
          ) : (
            items.map((item) => (
              <Link key={item.id} href={`/content/${item.id}`}>
                <Card className="glass p-4 cursor-pointer hover:bg-white/10 smooth">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold capitalize">{item.platform}</div>
                      <div className="text-xs text-white/60">ID: {item.id.slice(0, 8)}</div>
                    </div>
                    <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
        <div className="border-t border-white/10 pt-4 mt-4 space-y-3">
          <p className="text-sm font-semibold text-white/80">Quick create</p>
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="glass">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent className="glass">
                {platformOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCreate} disabled={creating || !brandId}>
              {creating ? <LoaderIcon /> : <Plus className="h-4 w-4 mr-2" />}
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
