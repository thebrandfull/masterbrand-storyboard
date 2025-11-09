"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

type NoiseBackgroundProps = {
  className?: string
  patternAlpha?: number
  refreshInterval?: number
  size?: number
}

/**
 * Minimal adaptation of React Bits' Noise background component.
 * Renders an animated grain overlay that adds subtle texture to solid gradients.
 */
export function NoiseBackground({
  className,
  patternAlpha = 28,
  refreshInterval = 3,
  size = 1024,
}: NoiseBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    let frame = 0
    let raf: number

    const drawNoise = () => {
      const imageData = ctx.createImageData(size, size)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255
        data[i] = value
        data[i + 1] = value
        data[i + 2] = value
        data[i + 3] = patternAlpha
      }

      ctx.putImageData(imageData, 0, 0)
    }

    const resize = () => {
      canvas.width = size
      canvas.height = size
      canvas.style.width = "100%"
      canvas.style.height = "100%"
    }

    const loop = () => {
      if (frame % refreshInterval === 0) {
        drawNoise()
      }
      frame += 1
      raf = window.requestAnimationFrame(loop)
    }

    resize()
    loop()

    return () => {
      window.cancelAnimationFrame(raf)
    }
  }, [patternAlpha, refreshInterval, size])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 h-full w-full opacity-80 mix-blend-screen", className)}
      style={{ imageRendering: "pixelated" }}
    />
  )
}
