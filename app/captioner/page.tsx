"use client"

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CloudUpload, Download, Save, Sparkles } from "lucide-react"
import { CaptionPreview } from "@/components/captioner/caption-preview"
import { CaptionTimeline } from "@/components/captioner/caption-timeline"
import { StylePanel } from "@/components/captioner/style-panel"
import { VoicePanel, type VoiceSettings } from "@/components/captioner/voice-panel"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import type { CaptionStyle, CaptionWord, CaptionPreset } from "@/types/captions"
import type { ElevenLabsVoice } from "@/lib/elevenlabs"

const sampleScript = `Welcome back to the studio. Today we\'re turning a raw idea into a finished vertical in under sixty seconds. We\'ll sculpt the hook, lock the pacing, style the captions, and let ElevenLabs drive the narration.`

const defaultStyle: CaptionStyle = {
  fontFamily: "Inter",
  fontWeight: 700,
  fontSize: 42,
  color: "#EDEDED",
  highlightColor: "#0951BF",
  backgroundColor: "#0B0B0C",
  backgroundOpacity: 0.6,
  uppercase: false,
  align: "center",
  letterSpacing: 0.4,
  lineHeight: 1.18,
  shadow: true,
  animation: "fade-in",
  motion: "float",
  wordsPerCaption: 3,
  wordSpacing: 0.35,
  paddingX: 1.4,
  paddingY: 0.9,
  borderRadius: 18,
}

const stylePresets: CaptionPreset[] = [
  {
    id: "glass-blue",
    name: "Glass blue",
    description: "Frosted block with electric highlights",
    style: {
      ...defaultStyle,
      color: "#EDEDED",
      highlightColor: "#4C8DFF",
      backgroundColor: "#0B0B0C",
      backgroundOpacity: 0.55,
      motion: "float",
      animation: "fade-in",
      wordsPerCaption: 3,
    },
  },
  {
    id: "electric",
    name: "Electric",
    description: "Punchy uppercase with hard bounce",
    style: {
      ...defaultStyle,
      uppercase: true,
      animation: "bounce",
      motion: "punch",
      highlightColor: "#FF2A2A",
      fontFamily: "Space Grotesk",
      fontWeight: 800,
      fontSize: 44,
      letterSpacing: 1,
      backgroundOpacity: 0.4,
      borderRadius: 12,
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Lightweight lower-third caption",
    style: {
      ...defaultStyle,
      backgroundOpacity: 0.2,
      motion: "static",
      animation: "slide-up",
      fontWeight: 600,
      fontSize: 36,
      paddingX: 1.2,
      paddingY: 0.7,
      borderRadius: 12,
      wordsPerCaption: 4,
      highlightColor: "#EDEDED",
      color: "#EDEDED",
    },
  },
]

const defaultWords: CaptionWord[] = [
  { id: "w1", text: "Welcome", start: 0, end: 0.6 },
  { id: "w2", text: "back", start: 0.6, end: 1.1 },
  { id: "w3", text: "to", start: 1.1, end: 1.4 },
  { id: "w4", text: "the", start: 1.4, end: 1.6 },
  { id: "w5", text: "studio.", start: 1.6, end: 2.2 },
  { id: "w6", text: "Today", start: 2.2, end: 2.8 },
  { id: "w7", text: "we're", start: 2.8, end: 3.1 },
  { id: "w8", text: "turning", start: 3.1, end: 3.7 },
  { id: "w9", text: "a", start: 3.7, end: 3.9 },
  { id: "w10", text: "raw", start: 3.9, end: 4.2 },
  { id: "w11", text: "idea", start: 4.2, end: 4.7 },
  { id: "w12", text: "into", start: 4.7, end: 5.0 },
  { id: "w13", text: "a", start: 5.0, end: 5.2 },
  { id: "w14", text: "finished", start: 5.2, end: 5.8 },
  { id: "w15", text: "vertical", start: 5.8, end: 6.5 },
]

const defaultVoiceSettings: VoiceSettings = {
  stability: 0.55,
  similarity_boost: 0.65,
  style: 0.2,
  use_speaker_boost: true,
}

const sampleVideoUrl = "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4"

export default function CaptionerPage() {
  const { toast } = useToast()
  const [script, setScript] = useState(sampleScript)
  const [style, setStyle] = useState<CaptionStyle>(defaultStyle)
  const [words, setWords] = useState<CaptionWord[]>(defaultWords)
  const [selectedWordId, setSelectedWordId] = useState<string | undefined>(undefined)
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([])
  const [loadingVoices, setLoadingVoices] = useState(false)
  const [voiceId, setVoiceId] = useState<string>("")
  const [modelId, setModelId] = useState("eleven_multilingual_v2")
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(defaultVoiceSettings)
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioSrc, setAudioSrc] = useState<string | undefined>(undefined)
  const [audioDuration, setAudioDuration] = useState<number | undefined>(undefined)
  const [pendingNormalization, setPendingNormalization] = useState(false)
  const [offset, setOffset] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | undefined>(sampleVideoUrl)
  const [poster, setPoster] = useState<string | undefined>(undefined)
  const objectUrlRef = useRef<string | null>(null)
  const posterUrlRef = useRef<string | null>(null)

  const totalDuration = useMemo(() => {
    if (words.length === 0) return 0
    return Math.max(...words.map((word) => word.end))
  }, [words])

  const fetchVoices = useCallback(async () => {
    setLoadingVoices(true)
    try {
      const response = await fetch("/api/elevenlabs/voices")
      if (!response.ok) {
        throw new Error("Failed to load voices")
      }
      const data = await response.json()
      setVoices(data.voices ?? [])
      if (!voiceId && data.voices?.length) {
        setVoiceId(data.voices[0].voice_id)
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "Unable to load voices",
        description: "Check your ElevenLabs API key and refresh.",
        variant: "destructive",
      })
    } finally {
      setLoadingVoices(false)
    }
  }, [toast, voiceId])

  useEffect(() => {
    fetchVoices()
  }, [fetchVoices])

  useEffect(() => {
    if (!audioSrc) return
    const audio = new Audio(audioSrc)
    const handleLoaded = () => {
      setAudioDuration(audio.duration)
      setPendingNormalization(true)
    }
    audio.addEventListener("loadedmetadata", handleLoaded)
    audio.load()
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded)
    }
  }, [audioSrc])

  useEffect(() => {
    if (!pendingNormalization || !audioDuration || words.length === 0) return
    const maxEnd = Math.max(...words.map((word) => word.end))
    if (!maxEnd || Math.abs(maxEnd - audioDuration) < 0.15) {
      setPendingNormalization(false)
      return
    }
    const ratio = audioDuration / maxEnd
    setWords((previous) =>
      previous.map((word) => ({
        ...word,
        start: Number((word.start * ratio).toFixed(3)),
        end: Number((word.end * ratio).toFixed(3)),
      }))
    )
    setPendingNormalization(false)
  }, [pendingNormalization, audioDuration, words])

  const handleGenerate = useCallback(async () => {
    if (!script.trim() || !voiceId) {
      toast({
        title: "Add script and voice",
        description: "Paste a script and select a voice to generate.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/elevenlabs/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: script,
          voiceId,
          modelId,
          voiceSettings,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: "Failed to generate" }))
        throw new Error(errorBody.error ?? "Failed to generate voice")
      }

      const data = await response.json()
      const audio = data.audioBase64 as string
      const generatedWords = (data.words as CaptionWord[]) ?? []

      setWords(generatedWords)
      setAudioSrc(`data:audio/mpeg;base64,${audio}`)
      setPendingNormalization(true)
      toast({
        title: "Voiceover ready",
        description: "Audio and caption timings synced.",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Check the ElevenLabs configuration.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }, [modelId, script, toast, voiceId, voiceSettings])

  const handleWordChange = useCallback((id: string, update: Partial<CaptionWord>) => {
    setWords((previous) =>
      previous.map((word) => (word.id === id ? { ...word, ...update } : word))
    )
  }, [])

  const handleWordDelete = useCallback((id: string) => {
    setWords((previous) => previous.filter((word) => word.id !== id))
  }, [])

  const handleInsertAfter = useCallback((id: string) => {
    setWords((previous) => {
      const index = previous.findIndex((word) => word.id === id)
      const target = previous[index]
      const newWord: CaptionWord = {
        id: crypto.randomUUID(),
        text: "New",
        start: Number((target?.end ?? 0).toFixed(2)),
        end: Number(((target?.end ?? 0) + 0.4).toFixed(2)),
      }
      const next = [...previous]
      next.splice(index + 1, 0, newWord)
      return next
    })
  }, [])

  const handleBulkShift = useCallback((delta: number) => {
    setWords((previous) =>
      previous.map((word) => ({
        ...word,
        start: Number(Math.max(0, word.start + delta).toFixed(3)),
        end: Number(Math.max(0, word.end + delta).toFixed(3)),
      }))
    )
  }, [])

  const handleDistribute = useCallback(
    (duration: number) => {
      if (!duration || duration <= 0) return
      const count = words.length
      if (count === 0) return
      const segment = duration / count
      setWords((previous) =>
        previous.map((word, index) => {
          const start = segment * index
          const end = segment * (index + 1) - 0.05
          return {
            ...word,
            start: Number(Math.max(0, start).toFixed(3)),
            end: Number(Math.max(start + 0.25, end).toFixed(3)),
          }
        })
      )
    },
    [words.length]
  )

  const handleVideoUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
    }
    objectUrlRef.current = objectUrl
    setVideoUrl(objectUrl)
  }, [])

  const handlePosterUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    if (posterUrlRef.current) {
      URL.revokeObjectURL(posterUrlRef.current)
    }
    posterUrlRef.current = objectUrl
    setPoster(objectUrl)
  }, [])

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
      if (posterUrlRef.current) {
        URL.revokeObjectURL(posterUrlRef.current)
      }
    }
  }, [])

  const handleExport = useCallback(() => {
    const payload = {
      script,
      voiceId,
      modelId,
      voiceSettings,
      style,
      words,
      offset,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `caption-preset-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [modelId, offset, script, style, voiceId, voiceSettings, words])

  const captionDocument = useMemo(
    () => ({
      script,
      style,
      voiceId,
      modelId,
      voiceSettings,
      offset,
      words,
    }),
    [modelId, offset, script, style, voiceId, voiceSettings, words]
  )

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Caption lab</p>
            <h1 className="text-3xl font-semibold text-white">ElevenLabs caption designer</h1>
            <p className="max-w-2xl text-sm text-white/60">
              Upload a video, drive a new voiceover, and craft stylized, word-timed captions that track every syllable. Animation,
              color, and layout are all editable in real-time.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              className="rounded-full bg-[#ff2a2a] px-5 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-[#ff2a2a]/90"
              onClick={handleExport}
            >
              <Download className="mr-2 h-4 w-4" /> Export JSON
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="rounded-full border border-white/10 bg-white/5 px-5 text-xs font-semibold uppercase tracking-[0.3em]"
              onClick={() => {
                navigator.clipboard
                  .writeText(JSON.stringify(captionDocument, null, 2))
                  .then(() => {
                    toast({ title: "Caption config copied" })
                  })
                  .catch(() => {
                    toast({
                      title: "Clipboard blocked",
                      description: "Enable clipboard permissions to copy configuration.",
                      variant: "destructive",
                    })
                  })
              }}
            >
              <Save className="mr-2 h-4 w-4" /> Copy config
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="glass rounded-3xl border-white/10 bg-black/40">
            <div className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff2a2a]/15 text-[#ff2a2a]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Workflow preset included</p>
                  <p className="text-xs text-white/60">Starter captions + sample video so you can demo instantly.</p>
                </div>
              </div>
            </div>
          </Card>
          <Card className="glass rounded-3xl border-white/10 bg-black/40">
            <div className="space-y-3 p-6">
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">Offset</p>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  type="number"
                  step="0.01"
                  value={offset}
                  onChange={(event) => setOffset(Number(event.target.value))}
                  className="w-28 border-white/10 bg-black/40 text-white"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold uppercase tracking-[0.3em]"
                  onClick={() => setOffset(0)}
                >
                  Reset offset
                </Button>
                <p className="text-xs text-white/60">
                  Use offset to nudge captions if the media has a preroll or silence.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">Video</p>
                <h3 className="text-lg font-semibold text-white">Upload footage</h3>
                <p className="text-xs text-white/60">Supports MP4, MOV, and web-friendly containers.</p>
              </div>
              <div className="flex gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
                  <CloudUpload className="h-4 w-4" />
                  <span>Video</span>
                  <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
                  <CloudUpload className="h-4 w-4" />
                  <span>Poster</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePosterUpload} />
                </label>
              </div>
            </header>
            <CaptionPreview
              videoUrl={videoUrl}
              poster={poster}
              audioSrc={audioSrc}
              words={words}
              style={style}
              offset={offset}
            />
          </div>
          <CaptionTimeline
            words={words}
            selectedWordId={selectedWordId}
            onSelect={setSelectedWordId}
            onWordChange={handleWordChange}
            onWordDelete={handleWordDelete}
            onInsertAfter={handleInsertAfter}
            onBulkShift={handleBulkShift}
            onEvenlyDistribute={handleDistribute}
            totalDurationHint={audioDuration ?? totalDuration}
          />
        </div>
        <div className="space-y-6">
          <VoicePanel
            script={script}
            onScriptChange={setScript}
            voiceId={voiceId}
            onVoiceIdChange={setVoiceId}
            voices={voices}
            loadingVoices={loadingVoices}
            onRefreshVoices={fetchVoices}
            onGenerateVoice={handleGenerate}
            isGenerating={isGenerating}
            audioPreview={audioSrc}
            voiceSettings={voiceSettings}
            onVoiceSettingsChange={setVoiceSettings}
            modelId={modelId}
            onModelIdChange={setModelId}
          />
          <StylePanel
            style={style}
            presets={stylePresets}
            onStyleChange={setStyle}
            onPresetApply={(preset) => setStyle({ ...preset.style })}
          />
        </div>
      </section>
    </div>
  )
}
