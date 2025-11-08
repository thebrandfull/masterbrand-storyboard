"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  Layers,
  Zap,
  Sparkles,
  PenSquare,
  Wand2,
  Captions,
  Clapperboard,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Content", href: "/content", icon: PenSquare },
  { name: "Brands", href: "/brands", icon: Layers },
  { name: "Brand Brain", href: "/brain", icon: Sparkles },
  { name: "Bulk Generate", href: "/bulk", icon: Zap },
  { name: "Watermark Remover", href: "/watermark", icon: Wand2 },
  { name: "Captioner", href: "/captioner", icon: Captions },
  { name: "YouTube Refiner", href: "/refiner", icon: Clapperboard },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col gap-6 px-4 py-8 md:flex">
      <div className="glass flex items-center gap-3 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--accent)]/20 text-[color:var(--accent)]">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Studio</p>
          <p className="text-base font-semibold text-[color:var(--text)]">Storyboard</p>
        </div>
      </div>

      <nav className="glass flex-1 space-y-1 overflow-y-auto px-3 py-4">
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

      <div className="glass px-4 py-4 text-xs text-[color:var(--muted)]">
        <p className="font-semibold text-[color:var(--text)]/90">Creator OS</p>
        <p>Designed for daily publishing rituals.</p>
      </div>
    </aside>
  )
}
