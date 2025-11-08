"use client"

import { ChangeEvent, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import type { ElevenLabsVoice } from "@/lib/elevenlabs"

export type VoiceSettings = {
  stability: number
  similarity_boost: number
  style: number
  use_speaker_boost: boolean
}

type VoicePanelProps = {
  script: string
  onScriptChange: (script: string) => void
  voiceId: string
  onVoiceIdChange: (voiceId: string) => void
  voices: ElevenLabsVoice[]
  loadingVoices: boolean
  onRefreshVoices: () => void
  onGenerateVoice: () => void
  isGenerating: boolean
  audioPreview?: string
  voiceSettings: VoiceSettings
  onVoiceSettingsChange: (settings: VoiceSettings) => void
  modelId: string
  onModelIdChange: (modelId: string) => void
}

const modelOptions = [
  { value: "eleven_multilingual_v2", label: "Multilingual v2" },
  { value: "eleven_turbo_v2", label: "Turbo v2" },
  { value: "eleven_flash_v2", label: "Flash v2" },
]

export function VoicePanel({
  script,
  onScriptChange,
  voiceId,
  onVoiceIdChange,
  voices,
  loadingVoices,
  onRefreshVoices,
  onGenerateVoice,
  isGenerating,
  audioPreview,
  voiceSettings,
  onVoiceSettingsChange,
  modelId,
  onModelIdChange,
}: VoicePanelProps) {
  const wordCount = useMemo(() => script.trim().split(/\s+/).filter(Boolean).length, [script])
  const selectedVoice = voices.find((voice) => voice.voice_id === voiceId)

  const handleSettingChange = (partial: Partial<VoiceSettings>) => {
    onVoiceSettingsChange({ ...voiceSettings, ...partial })
  }

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : ""
      onScriptChange(value)
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Voice</p>
          <h3 className="text-lg font-semibold text-white">Voiceover engine</h3>
          <p className="text-xs text-white/60">Script to speech with ElevenLabs, aligned to the caption timeline.</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="rounded-full border border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-[0.3em]"
          onClick={onRefreshVoices}
          disabled={loadingVoices}
        >
          {loadingVoices ? "Refreshing" : "Refresh voices"}
        </Button>
      </header>

      <section className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Script</Label>
          <Textarea
            value={script}
            onChange={(event) => onScriptChange(event.target.value)}
            placeholder="Paste the voiceover script or auto-generated copy..."
            className="min-h-[180px] border-white/10 bg-black/40 text-sm text-white"
          />
          <p className="text-xs text-white/50">{wordCount} words</p>
        </div>
        <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Voice model</Label>
            <Select value={modelId} onValueChange={onModelIdChange}>
              <SelectTrigger className="border-white/10 bg-black/50 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#111]/95 text-white">
                {modelOptions.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-white/50">Voice</Label>
            <Select value={voiceId} onValueChange={onVoiceIdChange}>
              <SelectTrigger className="border-white/10 bg-black/50 text-white">
                <SelectValue placeholder="Select voice" />
              </SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto border-white/10 bg-[#111]/95 text-white">
                {voices.map((voice) => (
                  <SelectItem key={voice.voice_id} value={voice.voice_id}>
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{voice.name}</span>
                      {voice.description && <span className="text-xs text-white/50">{voice.description}</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedVoice?.preview_url && (
              <audio controls src={selectedVoice.preview_url} className="mt-2 w-full" preload="none">
                <track kind="captions" />
              </audio>
            )}
          </div>
          <div className="space-y-4">
            <SettingControl
              label="Stability"
              value={voiceSettings.stability}
              onChange={(value) => handleSettingChange({ stability: value })}
            />
            <SettingControl
              label="Similarity boost"
              value={voiceSettings.similarity_boost}
              onChange={(value) => handleSettingChange({ similarity_boost: value })}
            />
            <SettingControl
              label="Style exaggeration"
              value={voiceSettings.style}
              onChange={(value) => handleSettingChange({ style: value })}
            />
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/60 p-3">
              <div>
                <p className="text-sm font-semibold text-white">Speaker boost</p>
                <p className="text-xs text-white/50">Push vocal clarity for noisier mixes</p>
              </div>
              <Button
                type="button"
                variant={voiceSettings.use_speaker_boost ? "default" : "secondary"}
                className="rounded-full border border-white/10 bg-white/10 text-xs font-semibold uppercase tracking-[0.3em]"
                onClick={() => handleSettingChange({ use_speaker_boost: !voiceSettings.use_speaker_boost })}
              >
                {voiceSettings.use_speaker_boost ? "On" : "Off"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            className="rounded-full bg-[#ff2a2a] px-6 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-[#ff2a2a]/90"
            onClick={onGenerateVoice}
            disabled={isGenerating || !voiceId || !script.trim()}
          >
            {isGenerating ? "Generating..." : "Generate voice & captions"}
          </Button>
          <Input
            type="file"
            accept=".txt"
            className="max-w-[220px] border-white/10 bg-black/40 text-white"
            onChange={handleFileUpload}
          />
        </div>
        <p className="text-xs text-white/50">Upload .txt to replace script quickly.</p>
        {audioPreview && (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Voiceover preview</p>
            <audio controls src={audioPreview} className="mt-2 w-full">
              <track kind="captions" />
            </audio>
          </div>
        )}
      </section>
    </div>
  )

}

type SettingControlProps = {
  label: string
  value: number
  onChange: (value: number) => void
}

function SettingControl({ label, value, onChange }: SettingControlProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-white/60">
        <span className="uppercase tracking-[0.3em] text-white/50">{label}</span>
        <span>{value.toFixed(2)}</span>
      </div>
      <Slider
        min={0}
        max={1}
        step={0.01}
        value={[value]}
        onValueChange={([next]) => onChange(Number(next.toFixed(2)))}
      />
    </div>
  )
}
