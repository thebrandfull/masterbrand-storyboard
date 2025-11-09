"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type LuminousPanelProps = React.PropsWithChildren<{
  className?: string
  spotlightColor?: string
  glowColor?: string
  borderColor?: string
}>

/**
 * Minimal spotlight/glow frame inspired by React Bits' SpotlightCard.
 * Adds a soft mouse-tracking highlight plus a static glow for subtle depth.
 */
export function LuminousPanel({
  children,
  className,
  spotlightColor = "rgba(255, 0, 51, 0.25)",
  glowColor = "rgba(255, 0, 51, 0.12)",
  borderColor = "rgba(255, 255, 255, 0.08)",
}: LuminousPanelProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setPrefersReducedMotion(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  const handlePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!ref.current || prefersReducedMotion) return
    const rect = ref.current.getBoundingClientRect()
    setPos({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    })
  }

  const handleEnter = () => {
    if (!prefersReducedMotion) {
      setOpacity(0.6)
    }
  }

  const handleLeave = () => {
    if (!prefersReducedMotion) {
      setOpacity(0)
    }
  }

  return (
    <div
      ref={ref}
      onPointerMove={handlePointer}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      className={cn(
        "relative rounded-3xl border bg-white/[0.015] p-6 sm:p-8",
        "border-[color:var(--panel-border,var(--border))]",
        "before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-gradient-to-b before:from-white/5 before:to-transparent before:opacity-60",
        className,
      )}
      style={{
        borderColor,
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 ease-out"
        style={{
          opacity,
          background: `radial-gradient(circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 75%)`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] blur-3xl"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${glowColor}, transparent 55%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
