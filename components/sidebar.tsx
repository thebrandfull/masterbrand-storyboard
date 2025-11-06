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
    <div className="flex h-screen w-64 flex-col fixed left-0 top-0 glass border-r border-white/10">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-white/10">
        <div className="rounded-lg bg-primary/20 p-2">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <span className="text-xl font-bold">Storyboard</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium smooth",
                isActive
                  ? "bg-primary/20 text-primary"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        <p className="text-xs text-white/40">
          Made for content creators
        </p>
      </div>
    </div>
  )
}
