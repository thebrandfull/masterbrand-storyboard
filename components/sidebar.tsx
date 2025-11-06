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
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Content", href: "/content", icon: PenSquare },
  { name: "Brands", href: "/brands", icon: Layers },
  { name: "Brand Brain", href: "/brain", icon: Sparkles },
  { name: "Bulk Generate", href: "/bulk", icon: Zap },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-64 flex-col border-r border-white/5 bg-[#050505]/95 px-4 pb-6 pt-6 shadow-[0_20px_60px_rgba(0,0,0,0.75)] backdrop-blur-2xl">
      <div className="mb-8 flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff2a2a]/20 text-[#ff2a2a]">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Studio</p>
          <p className="text-lg font-semibold text-white">Storyboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white/65 transition",
                isActive
                  ? "border border-white/10 bg-white/10 text-white shadow-[0_10px_40px_rgba(0,0,0,0.55)]"
                  : "hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 transition duration-200",
                  isActive ? "text-[#ff2a2a]" : "text-white/50 group-hover:text-[#ff2a2a]"
                )}
              />
              <span className="flex-1">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-6 rounded-2xl border border-white/5 bg-white/5 p-4 text-xs text-white/60">
        <p className="font-semibold text-white/80">Creator OS</p>
        <p className="text-white/50">Designed for daily publishing rituals.</p>
      </div>
    </aside>
  )
}
