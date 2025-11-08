"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CaptionStyle, CaptionPreset } from "@/types/captions"

const fontOptions = [
  "Inter",
  "Neue Haas Grotesk Display",
  "Suisse Intl",
  "Space Grotesk",
  "Clash Display",
  "Satoshi",
  "General Sans",
  "Montserrat",
]

const animationOptions = [
  { value: "fade-in", label: "Fade in" },
  { value: "slide-up", label: "Slide up" },
  { value: "slide-down", label: "Slide down" },
  { value: "bounce", label: "Bounce" },
  { value: "scale", label: "Scale" },
  { value: "typewriter", label: "Typewriter" },
]

const motionOptions = [
  { value: "static", label: "Static" },
  { value: "float", label: "Soft float" },
  { value: "drop", label: "Drop in" },
  { value: "punch", label: "Punch" },
  { value: "drift", label: "Drift" },
]

type StylePanelProps = {
  style: CaptionStyle
  presets: CaptionPreset[]
  onStyleChange: (style: CaptionStyle) => void
  onPresetApply: (preset: CaptionPreset) => void
}

export function StylePanel({ style, presets, onStyleChange, onPresetApply }: StylePanelProps) {
  const handleUpdate = (partial: Partial<CaptionStyle>) => {
    onStyleChange({ ...style, ...partial })
  }

  return (
    <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Styling</p>
        <h3 className="text-lg font-semibold text-white">Caption aesthetics</h3>
        <p className="text-sm text-white/60">Fine-tune typography, color, and motion to match the brand cut.</p>
      </header>

      <section className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Font family</Label>
            <Select value={style.fontFamily} onValueChange={(value) => handleUpdate({ fontFamily: value })}>
              <SelectTrigger className="border-white/10 bg-black/40 text-white">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#111]/95 text-white">
                {fontOptions.map((font) => (
                  <SelectItem key={font} value={font} className="focus:bg-white/10 focus:text-white">
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Font weight</Label>
            <Slider
              min={300}
              max={900}
              step={100}
              value={[style.fontWeight]}
              onValueChange={([value]) => handleUpdate({ fontWeight: value })}
            />
            <p className="text-xs text-white/50">{style.fontWeight}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Font size</Label>
            <Slider
              min={24}
              max={72}
              step={2}
              value={[style.fontSize]}
              onValueChange={([value]) => handleUpdate({ fontSize: value })}
            />
            <p className="text-xs text-white/50">{style.fontSize}px</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Words per card</Label>
            <Slider
              min={1}
              max={6}
              step={1}
              value={[style.wordsPerCaption]}
              onValueChange={([value]) => handleUpdate({ wordsPerCaption: value })}
            />
            <p className="text-xs text-white/50">{style.wordsPerCaption} words</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ColorField
            label="Text color"
            value={style.color}
            onChange={(value) => handleUpdate({ color: value })}
          />
          <ColorField
            label="Highlight"
            value={style.highlightColor}
            onChange={(value) => handleUpdate({ highlightColor: value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ColorField
            label="Background"
            value={style.backgroundColor}
            onChange={(value) => handleUpdate({ backgroundColor: value })}
          />
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Background opacity</Label>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={[style.backgroundOpacity]}
              onValueChange={([value]) => handleUpdate({ backgroundOpacity: parseFloat(value.toFixed(2)) })}
            />
            <p className="text-xs text-white/50">{Math.round(style.backgroundOpacity * 100)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Letter spacing</Label>
            <Slider
              min={-1}
              max={6}
              step={0.1}
              value={[style.letterSpacing]}
              onValueChange={([value]) => handleUpdate({ letterSpacing: Number(value.toFixed(1)) })}
            />
            <p className="text-xs text-white/50">{style.letterSpacing}px</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Line height</Label>
            <Slider
              min={0.9}
              max={1.6}
              step={0.05}
              value={[style.lineHeight]}
              onValueChange={([value]) => handleUpdate({ lineHeight: Number(value.toFixed(2)) })}
            />
            <p className="text-xs text-white/50">{style.lineHeight}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Horizontal padding</Label>
            <Slider
              min={0.5}
              max={4}
              step={0.1}
              value={[style.paddingX]}
              onValueChange={([value]) => handleUpdate({ paddingX: Number(value.toFixed(1)) })}
            />
            <p className="text-xs text-white/50">{style.paddingX}rem</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Vertical padding</Label>
            <Slider
              min={0.4}
              max={2.5}
              step={0.1}
              value={[style.paddingY]}
              onValueChange={([value]) => handleUpdate({ paddingY: Number(value.toFixed(1)) })}
            />
            <p className="text-xs text-white/50">{style.paddingY}rem</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Border radius</Label>
            <Slider
              min={0}
              max={48}
              step={2}
              value={[style.borderRadius]}
              onValueChange={([value]) => handleUpdate({ borderRadius: value })}
            />
            <p className="text-xs text-white/50">{style.borderRadius}px</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Word spacing</Label>
            <Slider
              min={0}
              max={1.6}
              step={0.05}
              value={[style.wordSpacing]}
              onValueChange={([value]) => handleUpdate({ wordSpacing: Number(value.toFixed(2)) })}
            />
            <p className="text-xs text-white/50">{style.wordSpacing}em</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Animation</Label>
            <Select value={style.animation} onValueChange={(value) => handleUpdate({ animation: value })}>
              <SelectTrigger className="border-white/10 bg-black/40 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#111]/95 text-white">
                {animationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Motion</Label>
            <Select value={style.motion} onValueChange={(value) => handleUpdate({ motion: value })}>
              <SelectTrigger className="border-white/10 bg-black/40 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#111]/95 text-white">
                {motionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Alignment</Label>
            <Select value={style.align} onValueChange={(value: "left" | "center" | "right") => handleUpdate({ align: value })}>
              <SelectTrigger className="border-white/10 bg-black/40 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#111]/95 text-white">
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Uppercase</Label>
            <Button
              variant={style.uppercase ? "default" : "secondary"}
              className="rounded-full border border-white/10 bg-white/10 text-xs font-semibold uppercase tracking-[0.3em]"
              onClick={() => handleUpdate({ uppercase: !style.uppercase })}
              type="button"
            >
              {style.uppercase ? "On" : "Off"}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-3">
          <div>
            <p className="text-sm font-semibold text-white">Glow shadow</p>
            <p className="text-xs text-white/50">Adds subtle depth for readability</p>
          </div>
          <Button
            variant={style.shadow ? "default" : "secondary"}
            className="rounded-full border border-white/10 bg-white/10 text-xs font-semibold uppercase tracking-[0.3em]"
            onClick={() => handleUpdate({ shadow: !style.shadow })}
            type="button"
          >
            {style.shadow ? "Enabled" : "Disabled"}
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <header>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Presets</p>
          <p className="text-sm text-white/60">Drop-in looks to start from</p>
        </header>
        <div className="grid gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPresetApply(preset)}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-left text-sm text-white/70 transition hover:bg-white/10"
            >
              <span className="font-semibold text-white">{preset.name}</span>
              <span className="text-xs text-white/50">{preset.description}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

type ColorFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-[0.3em] text-white/50">{label}</Label>
      <div className="flex items-center gap-3">
        <Input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-16 cursor-pointer rounded-xl border border-white/10 bg-black/40 p-1"
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="flex-1 border-white/10 bg-black/40 text-white"
        />
      </div>
    </div>
  )
}
