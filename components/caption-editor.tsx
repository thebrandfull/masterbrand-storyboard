"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  CAPTION_FONTS,
  loadGoogleFonts,
} from "@/lib/caption-fonts"
import type { FontOption } from "@/lib/caption-fonts"
import {
  DEFAULT_CAPTION_STYLE,
  getCaptionEffectStyles,
  getBackgroundShapeStyles,
} from "@/types/caption-styles"
import type {
  CaptionStyle,
  CaptionAnimation,
} from "@/types/caption-styles"

interface CaptionEditorProps {
  videoUrl?: string
  captionSegments: Array<{ text: string; start: number; end: number }>
  onStyleChange: (style: CaptionStyle) => void
  initialStyle?: CaptionStyle
}

const FIXED_POSITION = { x: 50, y: 82 }

const animationMap: Partial<Record<CaptionAnimation, string>> = {
  "fade-in": "caption-fade",
  "slide-up": "caption-slide-up",
  "slide-down": "caption-slide-down",
  bounce: "caption-bounce",
  pop: "caption-bounce",
  "scale-up": "caption-scale",
  "typewriter": "caption-type",
  "glow-pulse": "caption-float",
  highlight: "caption-bounce",
  wave: "caption-drift",
  shake: "caption-punch",
  "rotate-in": "caption-drop",
  "blur-in": "caption-fade",
}

const animationOptions: CaptionAnimation[] = [
  "pop",
  "bounce",
  "fade-in",
  "slide-up",
  "slide-down",
  "scale-up",
  "typewriter",
  "glow-pulse",
  "wave",
  "shake",
  "highlight",
]

export function CaptionEditor(props: CaptionEditorProps) {
  const {
    captionSegments,
    onStyleChange,
    initialStyle = DEFAULT_CAPTION_STYLE,
  } = props

  const [style, setStyle] = useState<CaptionStyle>({
    ...DEFAULT_CAPTION_STYLE,
    ...initialStyle,
    position: FIXED_POSITION,
  })
  const syncingFromParent = useRef(false)

  // Ensure Google fonts are available
  useEffect(() => {
    loadGoogleFonts(CAPTION_FONTS)
  }, [])

  // Sync when parent changes defaults
  useEffect(() => {
    syncingFromParent.current = true
    setStyle((prev) => ({
      ...prev,
      ...initialStyle,
      position: FIXED_POSITION,
    }))
  }, [initialStyle])

  // Emit style changes upward
  useEffect(() => {
    if (syncingFromParent.current) {
      syncingFromParent.current = false
      return
    }
    onStyleChange({ ...style, position: FIXED_POSITION })
  }, [style, onStyleChange])

  const updateStyle = useCallback((updates: Partial<CaptionStyle>) => {
    setStyle((prev) => ({
      ...prev,
      ...updates,
      position: FIXED_POSITION,
    }))
  }, [])

  const previewLines = useMemo(() => {
    const source =
      captionSegments[0]?.text?.trim() || "Preview your captions here"
    const words = source.split(/\s+/).filter(Boolean)
    if (words.length === 0) return ["Preview your captions"]

    const lines: string[] = []
    let currentLine: string[] = []
    let charCount = 0

    words.forEach((word) => {
      const nextLength = charCount + (currentLine.length > 0 ? 1 : 0) + word.length
      if (
        currentLine.length >= style.maxWordsPerLine ||
        nextLength > style.maxCharsPerLine
      ) {
        if (currentLine.length > 0) {
          lines.push(currentLine.join(" "))
        }
        currentLine = [word]
        charCount = word.length
      } else {
        currentLine.push(word)
        charCount = nextLength
      }
    })

    if (currentLine.length > 0) {
      lines.push(currentLine.join(" "))
    }

    return lines.slice(0, 2)
  }, [captionSegments, style.maxWordsPerLine, style.maxCharsPerLine])

  const animationName = animationMap[style.animation]
  const previewStyle: CaptionStyle = {
    ...style,
    fontSize: Math.max(28, Math.round(style.fontSize * 0.35)),
  }
  const animationStyle = animationName
    ? {
        animation: `${animationName} 1.6s ease-in-out infinite`,
      }
    : {}

  const fontOptions = useMemo(
    () =>
      CAPTION_FONTS.filter((font: FontOption, index) => index < 24),
    [],
  )

  return (
    <Card className="space-y-6 border border-white/10 bg-[color:var(--surface)]/40 p-6">
      <div>
        <h3 className="text-lg font-semibold text-[color:var(--text)]">
          Caption Style
        </h3>
        <p className="text-sm text-[color:var(--muted-text)]">
          Captions are locked to the lower third for best reach. Tweak the look
          below and use the mini preview to see font, color, and animation.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
        <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted-text)]">
          Preview
        </div>
        <div className="mt-3 flex flex-col items-center gap-2 text-center">
          {previewLines.map((line, index) => (
            <div
              key={`${line}-${index}`}
              className="px-3"
              style={{
                ...getCaptionEffectStyles(previewStyle),
                ...getBackgroundShapeStyles(previewStyle),
                ...animationStyle,
              }}
            >
              {line}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-[color:var(--muted-text)]">
          Animation: {style.animation} • Case: {style.textTransform}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-[color:var(--text)]">Font</Label>
          <Select
            value={style.fontFamily}
            onValueChange={(value) =>
              updateStyle({ fontFamily: value })
            }
          >
            <SelectTrigger className="border-white/10 bg-black/30 text-[color:var(--text)]">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-black text-white">
              {fontOptions.map((font) => (
                <SelectItem
                  key={font.family}
                  value={font.family}
                  style={{ fontFamily: font.family }}
                >
                  {font.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-[color:var(--text)]">
            Font Size: {style.fontSize}px
          </Label>
          <Slider
            value={[style.fontSize]}
            onValueChange={(value) =>
              updateStyle({ fontSize: value[0] })
            }
            min={32}
            max={110}
            step={2}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-[color:var(--text)]">Text Color</Label>
          <Input
            type="color"
            value={style.textColor}
            onChange={(event) =>
              updateStyle({ textColor: event.target.value })
            }
            className="h-10 w-full cursor-pointer"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[color:var(--text)]">Letter Case</Label>
          <Select
            value={style.textTransform}
            onValueChange={(value) =>
              updateStyle({
                textTransform: value as CaptionStyle["textTransform"],
              })
            }
          >
            <SelectTrigger className="border-white/10 bg-black/30 text-[color:var(--text)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-black text-white">
              <SelectItem value="none">Original</SelectItem>
              <SelectItem value="uppercase">UPPERCASE</SelectItem>
              <SelectItem value="capitalize">Title Case</SelectItem>
              <SelectItem value="lowercase">lowercase</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[color:var(--text)]">
              Stroke (outline)
            </Label>
            <label className="flex items-center gap-2 text-xs text-[color:var(--muted-text)]">
              <span>{style.outlineEnabled ? "On" : "Off"}</span>
              <input
                type="checkbox"
                checked={style.outlineEnabled}
                onChange={(event) =>
                  updateStyle({ outlineEnabled: event.target.checked })
                }
                className="h-3.5 w-3.5 cursor-pointer accent-[color:hsl(var(--accent))]"
              />
            </label>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="color"
              value={style.outlineColor}
              disabled={!style.outlineEnabled}
              onChange={(event) =>
                updateStyle({ outlineColor: event.target.value })
              }
              className="h-10 w-14 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="flex-1">
              <p className="text-xs text-[color:var(--muted-text)]">
                Thickness: {style.outlineWidth}px
              </p>
              <Slider
                value={[style.outlineWidth]}
                onValueChange={([value]) =>
                  updateStyle({ outlineWidth: value })
                }
                min={1}
                max={12}
                step={1}
                disabled={!style.outlineEnabled}
                className="w-full"
              />
            </div>
          </div>
        </div>
        <div />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[color:var(--text)]">
              Highlight box
            </Label>
            <label className="flex items-center gap-2 text-xs text-[color:var(--muted-text)]">
              <span>
                {style.backgroundShape !== "none" ? "On" : "Off"}
              </span>
              <input
                type="checkbox"
                checked={style.backgroundShape !== "none"}
                onChange={(event) =>
                  updateStyle(
                    event.target.checked
                      ? {
                          backgroundShape: "rounded",
                          backgroundRadius: style.backgroundRadius ?? 16,
                        }
                      : { backgroundShape: "none" },
                  )
                }
                className="h-3.5 w-3.5 cursor-pointer accent-[color:hsl(var(--accent))]"
              />
            </label>
          </div>
          {style.backgroundShape !== "none" && (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={style.backgroundColor}
                  onChange={(event) =>
                    updateStyle({ backgroundColor: event.target.value })
                  }
                  className="h-10 w-14 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="text-xs text-[color:var(--muted-text)]">
                    Opacity {Math.round(style.backgroundOpacity * 100)}%
                  </p>
                  <Slider
                    value={[style.backgroundOpacity]}
                    onValueChange={(value) =>
                      updateStyle({ backgroundOpacity: value[0] })
                    }
                    min={0}
                    max={1}
                    step={0.05}
                  />
                </div>
              </div>
              <div>
                <p className="text-xs text-[color:var(--muted-text)]">
                  Corner roundness: {style.backgroundRadius ?? 16}px
                </p>
                <Slider
                  value={[style.backgroundRadius ?? 16]}
                  onValueChange={(value) =>
                    updateStyle({ backgroundRadius: value[0] })
                  }
                  min={0}
                  max={40}
                  step={1}
                />
              </div>
              <div>
                <p className="text-xs text-[color:var(--muted-text)]">
                  Padding: {style.backgroundPadding}px
                </p>
                <Slider
                  value={[style.backgroundPadding]}
                  onValueChange={(value) =>
                    updateStyle({ backgroundPadding: value[0] })
                  }
                  min={6}
                  max={32}
                  step={2}
                />
              </div>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-[color:var(--text)]">Animation</Label>
          <Select
            value={style.animation}
            onValueChange={(value) =>
              updateStyle({ animation: value as CaptionAnimation })
            }
          >
            <SelectTrigger className="border-white/10 bg-black/30 text-[color:var(--text)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-black text-white">
              {animationOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-[color:var(--text)]">
            Max words per line: {style.maxWordsPerLine}
          </Label>
          <Slider
            value={[style.maxWordsPerLine]}
            onValueChange={([value]) =>
              updateStyle({ maxWordsPerLine: value })
            }
            min={1}
            max={6}
            step={1}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[color:var(--text)]">
            Max characters per line: {style.maxCharsPerLine}
          </Label>
          <Slider
            value={[style.maxCharsPerLine]}
            onValueChange={([value]) =>
              updateStyle({ maxCharsPerLine: value })
            }
            min={12}
            max={60}
            step={2}
          />
        </div>
      </div>
    </Card>
  )
}
