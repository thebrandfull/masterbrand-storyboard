"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Calendar as CalendarIcon,
  TrendingUp,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
} from "lucide-react"
import { getBrands } from "@/lib/actions/brands"
import { getContentItemsByStatus } from "@/lib/actions/content"
import { useBrandSelection } from "@/hooks/use-brand-selection"
import { LuminousPanel } from "@/components/ui/luminous-panel"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const FOCUS_DURATION = 25 * 60 // 25 minutes
const STATUS_PRIORITY = [
  { key: "generated", label: "Generated", icon: "🎬" },
  { key: "enhanced", label: "Enhanced", icon: "✨" },
  { key: "qc", label: "QC", icon: "✅" },
  { key: "prompted", label: "Prompted", icon: "✍️" },
  { key: "idea", label: "Idea", icon: "💡" },
  { key: "scheduled", label: "Scheduled", icon: "📅" },
] as const

export default function Dashboard() {
  const [brands, setBrands] = useState<any[]>([])
  const [contentByStatus, setContentByStatus] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const { selectedBrandId, setSelectedBrandId } = useBrandSelection()
  const [timerMinutes, setTimerMinutes] = useState(25)
  const [focusSeconds, setFocusSeconds] = useState(FOCUS_DURATION)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [sessionStartAt, setSessionStartAt] = useState<string | null>(null)
  const [sessionMinutes, setSessionMinutes] = useState(25)
  const [durationInputValue, setDurationInputValue] = useState("25")
  const [isLoggingSession, setIsLoggingSession] = useState(false)

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

  useEffect(() => {
    if (!isTimerRunning) return
    const interval = window.setInterval(() => {
      setFocusSeconds((prev) => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(interval)
  }, [isTimerRunning])

  useEffect(() => {
    if (focusSeconds === 0) {
      setIsTimerRunning(false)
    }
  }, [focusSeconds])

  const selectedBrand = brands.find((b) => b.id === selectedBrandId)
  const minutes = Math.floor(focusSeconds / 60)
  const seconds = focusSeconds % 60
  const criticalItem = useMemo(() => {
    for (const status of STATUS_PRIORITY) {
      const items = contentByStatus[status.key]
      if (Array.isArray(items) && items.length > 0) {
        const sorted = [...items].sort(
          (a, b) => new Date(a.date_target).getTime() - new Date(b.date_target).getTime()
        )
        const next = sorted[0]
        return {
          ...next,
          status,
        }
      }
    }
    return null
  }, [contentByStatus])

  const logFocusSession = useCallback(async () => {
    if (!sessionStartAt || !selectedBrandId || sessionMinutes <= 0) {
      setSessionStartAt(null)
      setFocusSeconds(timerMinutes * 60)
      return
    }

    setIsLoggingSession(true)
    try {
      await fetch("/api/focus-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: selectedBrandId,
          durationMinutes: sessionMinutes,
          startedAt: sessionStartAt,
          endedAt: new Date().toISOString(),
        }),
      })
    } catch (error) {
      console.error("Failed to log focus session", error)
    } finally {
      setIsLoggingSession(false)
      setSessionStartAt(null)
      setFocusSeconds(timerMinutes * 60)
    }
  }, [selectedBrandId, sessionMinutes, sessionStartAt, timerMinutes])

  useEffect(() => {
    if (focusSeconds === 0 && sessionStartAt && !isLoggingSession) {
      logFocusSession()
    }
  }, [focusSeconds, sessionStartAt, isLoggingSession, logFocusSession])

  const toggleTimer = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false)
      return
    }

    if (!sessionStartAt) {
      setSessionStartAt(new Date().toISOString())
      setSessionMinutes(Math.max(1, Math.round(focusSeconds / 60)))
    }

    if (focusSeconds === 0) {
      setFocusSeconds(timerMinutes * 60)
      setSessionMinutes(timerMinutes)
    }

    setIsTimerRunning(true)
  }

  const resetTimer = () => {
    setIsTimerRunning(false)
    setFocusSeconds(timerMinutes * 60)
    setSessionStartAt(null)
  }

  const handleDurationInput = (value: string) => {
    if (value === "") {
      setDurationInputValue("")
      return
    }
    const next = Number(value)
    if (Number.isNaN(next) || next <= 0) {
      return
    }
    const clamped = Math.min(next, 240)
    setDurationInputValue(String(clamped))
    setTimerMinutes(clamped)
    if (!isTimerRunning) {
      setFocusSeconds(clamped * 60)
    }
  }


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
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
            <Link href="/calendar">
              <Button variant="secondary" className="bg-transparent text-[color:var(--text)] hover:bg-white/10">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Calendar
              </Button>
            </Link>
          </div>
        </div>
        {selectedBrand && (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="glass flex min-h-[150px] flex-wrap items-center gap-4 px-4 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--muted)]">Focus timer</p>
                <p className="text-3xl font-semibold tracking-wide text-[color:var(--text)]">
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </p>
              </div>
              <p className="flex-1 min-w-[180px] text-xs text-[color:var(--muted)]">
                {isTimerRunning ? "Lock in and protect your sprint." : "Set a duration and press start to enter flow."}
              </p>
              <div className="flex items-center gap-2">
                <label className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--muted)]">Minutes</label>
                <Input
                  type="number"
                  min={5}
                  max={240}
                  value={durationInputValue}
                  onChange={(event) => handleDurationInput(event.target.value)}
                  disabled={isTimerRunning}
                  className="h-9 w-16 border-white/10 bg-transparent text-center text-sm text-[color:var(--text)]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/10 text-[color:var(--text)] hover:bg-white/20"
                  onClick={toggleTimer}
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="mr-2 h-3.5 w-3.5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-3.5 w-3.5" />
                      Start
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[color:var(--muted)] hover:text-[color:var(--text)]"
                  onClick={resetTimer}
                >
                  <RotateCcw className="mr-2 h-3.5 w-3.5" />
                  Reset
                </Button>
              </div>
            </div>
            <div className="glass flex min-h-[150px] flex-col justify-between px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--muted)]">Most critical</p>
                  <p className="text-xl font-semibold text-[color:var(--text)]">Pending task</p>
                </div>
                <AlertTriangle className="h-6 w-6 text-[color:var(--accent)]" />
              </div>
              {criticalItem ? (
                <>
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--text)]">
                      {criticalItem.status.icon} {criticalItem.status.label}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      Due {new Date(criticalItem.date_target).toLocaleDateString()} ·{" "}
                      <span className="capitalize">{criticalItem.platform}</span>
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
                    <span>{selectedBrand.name}</span>
                    <Link
                      href={`/content/${criticalItem.id}`}
                      className="text-[color:var(--accent)] hover:underline"
                    >
                      Open task
                    </Link>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-center text-sm text-[color:var(--muted)]">
                  <p>All clear for now.</p>
                  <p className="text-xs">No pending tasks in priority stages.</p>
                </div>
              )}
            </div>
          </div>
        )}


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

    </div>
  )
}
