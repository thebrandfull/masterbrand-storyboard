"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  Layers,
  Sparkles,
  PenSquare,
  Video,
  Plus,
} from "lucide-react"
import { BrandSelector } from "@/components/brand-selector"
import { useBrandSelection } from "@/hooks/use-brand-selection"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Content", href: "/content", icon: PenSquare },
  { name: "Brands", href: "/brands", icon: Layers },
  { name: "Brand Brain", href: "/brain", icon: Sparkles },
  { name: "Sora Generator", href: "/sora-generator", icon: Video },
]

type BrandSummary = {
  id: string
  name: string
}

export function Sidebar() {
  const pathname = usePathname()
  const [brandOptions, setBrandOptions] = useState<BrandSummary[]>([])
  const [brandsLoading, setBrandsLoading] = useState(true)
  const { selectedBrandId, setSelectedBrandId } = useBrandSelection()

  useEffect(() => {
    let cancelled = false

    const loadBrands = async () => {
      try {
        const response = await fetch("/api/brands", { cache: "no-store" })
        const data = await response.json()
        if (cancelled) return

        if (response.ok && data.success) {
          setBrandOptions(Array.isArray(data.brands) ? data.brands : [])
        } else {
          setBrandOptions([])
        }
      } catch (error) {
        console.error("Failed to load brands", error)
        if (!cancelled) {
          setBrandOptions([])
        }
      } finally {
        if (!cancelled) {
          setBrandsLoading(false)
        }
      }
    }

    loadBrands()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!brandOptions.length) return
    const exists = brandOptions.some((brand) => brand.id === selectedBrandId)
    if (!exists && brandOptions[0]?.id) {
      setSelectedBrandId(brandOptions[0].id)
    }
  }, [brandOptions, selectedBrandId, setSelectedBrandId])

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col gap-4 px-4 py-6 md:flex">
      <div className="glass flex items-center gap-3 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--accent)]/20 text-[color:var(--accent)]">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Studio</p>
          <p className="text-base font-semibold text-[color:var(--text)]">Storyboard</p>
        </div>
      </div>

      <div className="glass space-y-2 px-3 py-3">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Active brand</p>
        {brandsLoading ? (
          <p className="text-xs text-[color:var(--muted)]">Loading brands…</p>
        ) : brandOptions.length > 0 ? (
          <BrandSelector
            brands={brandOptions}
            selectedBrandId={selectedBrandId}
            onBrandChange={setSelectedBrandId}
            triggerClassName="w-full"
            includeCreateOption
          />
        ) : (
          <Link
            href="/brands/new"
            className="flex items-center gap-2 rounded-lg border border-dashed border-white/15 px-3 py-2 text-xs text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
          >
            <Plus className="h-3.5 w-3.5 text-[color:var(--accent)]" />
            Create a brand
          </Link>
        )}
      </div>

      <nav className="glass flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[color:var(--muted)] transition",
                isActive ? "bg-white/10 text-[color:var(--text)]" : "hover:bg-white/10 hover:text-[color:var(--text)]"
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 transition duration-200",
                  isActive
                    ? "text-[color:var(--accent)]"
                    : "text-[color:var(--muted)] group-hover:text-[color:var(--accent)]"
                )}
              />
              <span className="flex-1">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="glass px-3 py-3 text-xs text-[color:var(--muted)]">
        <p className="font-semibold text-[color:var(--text)]/90">Creator OS</p>
        <p>Designed for daily publishing rituals.</p>
      </div>
    </aside>
  )
}
