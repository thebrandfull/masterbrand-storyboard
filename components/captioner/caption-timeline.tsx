"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import type { CaptionWord } from "@/types/captions"

export type CaptionTimelineProps = {
  words: CaptionWord[]
  selectedWordId?: string
  onSelect?: (wordId: string) => void
  onWordChange: (wordId: string, update: Partial<CaptionWord>) => void
  onWordDelete: (wordId: string) => void
  onInsertAfter: (wordId: string) => void
  onBulkShift: (delta: number) => void
  onEvenlyDistribute: (duration: number) => void
  totalDurationHint?: number
}

export function CaptionTimeline({
  words,
  selectedWordId,
  onSelect,
  onWordChange,
  onWordDelete,
  onInsertAfter,
  onBulkShift,
  onEvenlyDistribute,
  totalDurationHint,
}: CaptionTimelineProps) {
  const duration = useMemo(() => {
    if (words.length === 0) return totalDurationHint ?? 0
    const last = words.reduce((acc, word) => (word.end > acc.end ? word : acc), words[0])
    return last.end
  }, [words, totalDurationHint])

  const referenceDuration = duration || totalDurationHint || 0

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Timeline</p>
          <h3 className="text-lg font-semibold text-white">Word sync</h3>
          <p className="text-xs text-white/60">Adjust timing, add emphasis, and lock the captions to the beat.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            className="rounded-full border border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-[0.3em]"
            onClick={() => onBulkShift(-0.05)}
          >
            -50ms
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="rounded-full border border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-[0.3em]"
            onClick={() => onBulkShift(0.05)}
          >
            +50ms
          </Button>
          <Button
            type="button"
            className="rounded-full bg-[#ff2a2a] text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-[#ff2a2a]/90"
            onClick={() => onEvenlyDistribute(duration || totalDurationHint || 0)}
          >
            Smooth spacing
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative h-2 rounded-full bg-black/40">
          <div className="absolute inset-y-0 left-0 w-full rounded-full bg-gradient-to-r from-white/50 via-white/70 to-white/20" />
        </div>
        <p className="text-xs text-white/50">Total duration reference: {referenceDuration.toFixed(2)}s</p>
      </div>

      <div className="grid gap-4">
        {words.map((word) => {
          const isSelected = word.id === selectedWordId
          const widthPercent = duration > 0 ? Math.max(2, ((word.end - word.start) / duration) * 100) : 8
          const marginPercent = duration > 0 ? (word.start / duration) * 100 : 0
          return (
            <div
              key={word.id}
              className={`rounded-2xl border ${
                isSelected ? "border-white/40 bg-white/10" : "border-white/10 bg-black/40"
              } p-4 transition hover:border-white/30`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant={isSelected ? "default" : "secondary"}
                  className="rounded-full border border-white/10 bg-white/10 px-3 text-xs font-semibold uppercase tracking-[0.3em]"
                  onClick={() => onSelect?.(word.id)}
                >
                  {isSelected ? "Active" : "Select"}
                </Button>
                <Input
                  value={word.text}
                  onChange={(event) => onWordChange(word.id, { text: event.target.value })}
                  className="min-w-[160px] flex-1 border-white/10 bg-black/40 text-sm text-white"
                />
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span>start</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={Number(word.start.toFixed(2))}
                    onChange={(event) => onWordChange(word.id, { start: Number(event.target.value) })}
                    className="w-20 border-white/10 bg-black/40"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span>end</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={Number(word.end.toFixed(2))}
                    onChange={(event) => onWordChange(word.id, { end: Number(event.target.value) })}
                    className="w-20 border-white/10 bg-black/40"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold uppercase tracking-[0.3em]"
                    onClick={() => onInsertAfter(word.id)}
                  >
                    + word
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:text-white"
                    onClick={() => onWordDelete(word.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-white/70"
                  style={{ width: `${widthPercent}%`, marginLeft: `${marginPercent}%` }}
                />
              </div>
              <div className="mt-3">
                <Slider
                  min={0}
                  max={referenceDuration || 1}
                  step={0.01}
                  value={[word.start, word.end]}
                  onValueChange={([start, end]) => onWordChange(word.id, { start, end })}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
