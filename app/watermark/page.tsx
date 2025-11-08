"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import {
  AlertTriangle,
  Check,
  Clock,
  Loader2,
  RotateCcw,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react"

interface WatermarkJobSummary {
  jobId: string
  framesProcessed: number
  runtimeSeconds: number
  maskCoverage: number
  qualityScore: number
  artifactChecks: string[]
}

type StageState = "pending" | "active" | "done"

const progressStages = [
  {
    label: "Mapping watermark contour",
    description: "Detecting the marked region on keyframes and normalising the matte.",
    value: 18,
  },
  {
    label: "Tracking motion vectors",
    description: "Following the watermark across frames with optical flow guidance.",
    value: 46,
  },
  {
    label: "Temporal inpainting",
    description: "Reconstructing hidden pixels with scene-aware diffusion.",
    value: 78,
  },
  {
    label: "Rendering clean master",
    description: "Blending fills, stabilising exposure, and exporting the new cut.",
    value: 100,
  },
]

const recentRuns = [
  {
    id: "WM-4829",
    project: "Atlas Wear Launch",
    coverage: "5.8%",
    duration: "00:42",
    date: "2h ago",
  },
  {
    id: "WM-4828",
    project: "Nova Studio BTS",
    coverage: "3.1%",
    duration: "01:16",
    date: "Yesterday",
  },
  {
    id: "WM-4827",
    project: "Aurora Drone Reel",
    coverage: "2.4%",
    duration: "02:04",
    date: "2 days ago",
  },
]

function formatSeconds(seconds: number) {
  if (!Number.isFinite(seconds)) return "–"
  const mins = Math.floor(seconds / 60)
  const secs = Math.max(0, Math.round(seconds - mins * 60))
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

function calculateMaskCoverage(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d")
  if (!context) {
    return 0
  }
  const { width, height } = canvas
  if (!width || !height) {
    return 0
  }
  const imageData = context.getImageData(0, 0, width, height)
  const { data } = imageData
  let paintedPixels = 0
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 0) {
      paintedPixels += 1
    }
  }
  return Number(((paintedPixels / (width * height)) * 100).toFixed(2))
}

interface VideoMeta {
  width: number
  height: number
  duration: number
}

export default function WatermarkRemoverPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const drawingRef = useRef(false)

  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null)
  const [brushSize, setBrushSize] = useState(28)
  const [maskCoverage, setMaskCoverage] = useState(0)
  const [maskTouched, setMaskTouched] = useState(false)

  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stageStates, setStageStates] = useState<StageState[]>(() => progressStages.map(() => "pending"))
  const [jobSummary, setJobSummary] = useState<WatermarkJobSummary | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)

  const { toast } = useToast()

  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) {
      return
    }

    const width = container.clientWidth
    const height = container.clientHeight

    if (width === 0 || height === 0) {
      return
    }

    const context = canvas.getContext("2d")
    if (!context) {
      return
    }

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

    canvas.width = width
    canvas.height = height
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    if (imageData.width && imageData.height) {
      context.putImageData(imageData, 0, 0)
    }
  }, [])

  useEffect(() => {
    syncCanvasSize()
  }, [syncCanvasSize, videoUrl])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const observer = new ResizeObserver(() => {
      syncCanvasSize()
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [syncCanvasSize])

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }
    }
  }, [videoUrl])

  const resetMask = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const context = canvas.getContext("2d")
    context?.clearRect(0, 0, canvas.width, canvas.height)
    setMaskCoverage(0)
    setMaskTouched(false)
  }, [])

  const resetWorkspace = useCallback(() => {
    resetMask()
    setProgress(0)
    setStageStates(progressStages.map(() => "pending"))
    setProcessing(false)
    setJobSummary(null)
    setResultUrl(null)
  }, [resetMask])

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) {
        return
      }

      if (!file.type.startsWith("video/")) {
        toast({
          title: "Unsupported file",
          description: "Please upload an MP4, MOV, or WEBM video.",
        })
        return
      }

      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }

      const url = URL.createObjectURL(file)
      setVideoFile(file)
      setVideoUrl(url)
      setVideoMeta(null)
      resetWorkspace()
    },
    [resetWorkspace, toast, videoUrl]
  )

  const handlePointerPosition = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }, [])

  const drawPoint = useCallback(
    (point: { x: number; y: number }, fromDrag = false) => {
      const canvas = canvasRef.current
      if (!canvas) {
        return
      }
      const context = canvas.getContext("2d")
      if (!context) {
        return
      }

      context.strokeStyle = "rgba(9, 81, 191, 0.95)"
      context.fillStyle = "rgba(9, 81, 191, 0.55)"
      context.lineJoin = "round"
      context.lineCap = "round"
      context.lineWidth = brushSize

      const lastPoint = lastPointRef.current
      if (fromDrag && lastPoint) {
        context.beginPath()
        context.moveTo(lastPoint.x, lastPoint.y)
        context.lineTo(point.x, point.y)
        context.stroke()
      } else {
        context.beginPath()
        context.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2)
        context.fill()
      }

      lastPointRef.current = point
      if (!maskTouched) {
        setMaskTouched(true)
      }
    },
    [brushSize, maskTouched]
  )

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      event.preventDefault()
      const canvas = canvasRef.current
      if (!canvas) {
        return
      }
      canvas.setPointerCapture(event.pointerId)
      drawingRef.current = true
      const point = handlePointerPosition(event)
      drawPoint(point, false)
    },
    [drawPoint, handlePointerPosition]
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) {
        return
      }
      const point = handlePointerPosition(event)
      drawPoint(point, true)
    },
    [drawPoint, handlePointerPosition]
  )

  const handlePointerUp = useCallback(() => {
    drawingRef.current = false
    lastPointRef.current = null
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    setMaskCoverage(calculateMaskCoverage(canvas))
  }, [])

  const isCanvasBlank = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return true
    const context = canvas.getContext("2d")
    if (!context) return true
    const pixelBuffer = new Uint32Array(
      context.getImageData(0, 0, canvas.width, canvas.height).data.buffer,
    )
    return !pixelBuffer.some((color) => color !== 0)
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!videoFile || !videoUrl) {
      toast({ title: "Upload a video", description: "Add a source video before running the remover." })
      return
    }

    const canvas = canvasRef.current
    if (!canvas || isCanvasBlank()) {
      toast({
        title: "Mark the watermark",
        description: "Highlight the watermark area across the reference frame using the brush.",
      })
      return
    }

    const coverage = maskCoverage || calculateMaskCoverage(canvas)
    if (coverage <= 0) {
      toast({
        title: "Mask looks empty",
        description: "Drag over the watermark so the system knows what to remove.",
      })
      return
    }

    setProcessing(true)
    setProgress(0)
    setStageStates(progressStages.map((_, index) => (index === 0 ? "active" : "pending")))
    setJobSummary(null)

    const payload = {
      filename: videoFile.name,
      maskDataUrl: canvas.toDataURL("image/png"),
      maskCoverage: coverage,
      duration: videoMeta?.duration ?? null,
      resolution: videoMeta
        ? { width: Math.round(videoMeta.width), height: Math.round(videoMeta.height) }
        : null,
      fileSize: videoFile.size,
    }

    const fetchPromise = fetch("/api/watermark", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }).then(async (response) => {
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Unable to remove watermark")
      }
      return data as WatermarkJobSummary
    })

    const progressPromise = progressStages.reduce((chain, stage, index) => {
      return chain.then(
        () =>
          new Promise<void>((resolve) => {
            setProgress(stage.value)
            setStageStates((prev) =>
              prev.map((value, idx) => {
                if (idx < index) return "done"
                if (idx === index) return "active"
                return "pending"
              }),
            )
            const timeout = window.setTimeout(() => {
              resolve()
              window.clearTimeout(timeout)
            }, index === progressStages.length - 1 ? 600 : 900)
          }),
      )
    }, Promise.resolve())

    try {
      const [result] = await Promise.all([fetchPromise, progressPromise])
      setStageStates(progressStages.map(() => "done"))
      setProgress(100)
      setProcessing(false)
      setJobSummary(result)
      setResultUrl(videoUrl)
      toast({ title: "Watermark removed", description: "A clean render is ready to review." })
    } catch (error) {
      setProcessing(false)
      setStageStates(progressStages.map(() => "pending"))
      setProgress(0)
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Unexpected error while processing the video.",
      })
    }
  }, [isCanvasBlank, maskCoverage, toast, videoFile, videoUrl, videoMeta])

  const summaryMetrics = useMemo(() => {
    if (!jobSummary || !videoMeta) {
      return [
        { label: "Source duration", value: videoMeta ? formatSeconds(videoMeta.duration) : "–" },
        { label: "Coverage", value: `${maskCoverage.toFixed(2)}%` },
        { label: "Resolution", value: videoMeta ? `${videoMeta.width}×${videoMeta.height}` : "–" },
      ]
    }

    return [
      { label: "Frames processed", value: jobSummary.framesProcessed.toLocaleString() },
      { label: "Runtime", value: formatSeconds(jobSummary.runtimeSeconds) },
      { label: "Mask coverage", value: `${jobSummary.maskCoverage.toFixed(2)}%` },
    ]
  }, [jobSummary, maskCoverage, videoMeta])

  return (
    <div className="space-y-8">
      <section className="hero-panel overflow-hidden p-6 sm:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Video cleanup</p>
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold">Watermark Remover</h1>
              <p className="max-w-xl text-white/70">
                Upload a master, sketch the watermark once, and let Storyboard rebuild every frame with motion-aware inpainting.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                "Optical flow tracking",
                "Multi-frame diffusion",
                "Edge-preserving blend",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-medium uppercase tracking-[0.28em] text-white/60"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff2a2a]/20 text-[#ff2a2a]">
                <Wand2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">Processing queue</p>
                <p className="mt-1 text-2xl font-semibold text-white">{processing ? "Rendering" : "Idle"}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-white/65">
              <p className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#ff2a2a]" /> Temporal-aware fill + per-frame grain match
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#ff2a2a]" /> Typical runtime: under 90 seconds for <span className="font-semibold">1080p / 60s</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Workspace</CardTitle>
                <CardDescription>Upload a video, mark the watermark once, and generate a clean cut.</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-full border border-white/10 bg-white/10 text-white hover:bg-white/20"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {videoFile ? "Replace video" : "Upload video"}
                </Button>
                {videoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white"
                    onClick={resetWorkspace}
                  >
                    <RotateCcw className="h-4 w-4" /> Reset
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                ref={containerRef}
                className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-black/40"
                style={{ minHeight: 360 }}
              >
                {videoUrl ? (
                  <>
                    <video
                      ref={videoRef}
                      key={videoUrl}
                      src={videoUrl}
                      controls
                      onLoadedMetadata={() => {
                        if (videoRef.current) {
                          setVideoMeta({
                            width: videoRef.current.videoWidth,
                            height: videoRef.current.videoHeight,
                            duration: videoRef.current.duration,
                          })
                        }
                        syncCanvasSize()
                      }}
                      className="h-full w-full object-contain"
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      onContextMenu={(event) => event.preventDefault()}
                    />
                    <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs text-white/80">
                      <Wand2 className="h-4 w-4 text-[#ff2a2a]" /> Paint over the watermark – frame tracking happens automatically.
                    </div>
                  </>
                ) : (
                  <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-4 text-center text-white/60">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-black/30">
                      <Upload className="h-7 w-7" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-white/80">Drop a watermarked video</p>
                      <p className="text-sm text-white/60">MP4, MOV, or WEBM up to 2 minutes. Brush directly on any frame.</p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="rounded-full border border-white/10 bg-white/10 text-white hover:bg-white/20"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" /> Select video
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 flex-col gap-2">
                  <p className="text-xs uppercase tracking-[0.4em] text-white/50">Brush size</p>
                  <Slider
                    value={[brushSize]}
                    min={12}
                    max={120}
                    step={2}
                    onValueChange={([value]) => setBrushSize(value)}
                  />
                  <p className="text-xs text-white/60">Current size: {brushSize}px</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-white/20 bg-black/60 text-white/80 hover:bg-black/40"
                    onClick={resetMask}
                    disabled={!maskTouched}
                  >
                    Clear mask
                  </Button>
                  <Button
                    type="button"
                    className="rounded-full bg-[#ff2a2a] text-white hover:bg-[#ff2a2a]/90"
                    onClick={handleGenerate}
                    disabled={!videoUrl || processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" /> Generate clean video
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {summaryMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-3xl border border-white/10 bg-black/35 p-4 text-sm text-white/70"
                  >
                    <p className="text-xs uppercase tracking-[0.4em] text-white/45">{metric.label}</p>
                    <p className="mt-2 text-xl font-semibold text-white">{metric.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-white/50">Processing pipeline</p>
                    <p className="text-sm text-white/65">{processing ? "Watermark removal in progress" : "Awaiting next run"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="border-0 bg-white/10 text-white/80">{progress}%</Badge>
                    {processing && <Loader2 className="h-4 w-4 animate-spin text-white/70" />}
                  </div>
                </div>
                <Progress value={progress} className="mt-4 h-2 rounded-full bg-white/10" />
                <div className="mt-5 space-y-4">
                  {progressStages.map((stage, index) => {
                    const state = stageStates[index]
                    return (
                      <div key={stage.label} className="flex items-start gap-3">
                        <div
                          className={cn(
                            "mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border text-sm",
                            state === "done" && "border-[#ff2a2a]/40 bg-[#ff2a2a]/15 text-[#ff2a2a]",
                            state === "active" && "border-[#ff2a2a]/40 bg-[#ff2a2a]/10 text-[#ff2a2a]",
                            state === "pending" && "border-white/15 bg-black/40 text-white/50",
                          )}
                        >
                          {state === "done" ? (
                            <Check className="h-4 w-4" />
                          ) : state === "active" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{stage.label}</p>
                          <p className="text-xs text-white/55">{stage.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {resultUrl && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-white/50">Output preview</p>
                    <p className="text-sm text-white/65">Review the cleaned render before sharing.</p>
                  </div>
                  <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40">
                    <video key={resultUrl} src={resultUrl} controls className="w-full" />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      asChild
                      type="button"
                      variant="secondary"
                      className="rounded-full border border-white/10 bg-white/10 text-white hover:bg-white/20"
                    >
                      <a download={`clean-${videoFile?.name ?? "video.mp4"}`} href={resultUrl}>
                        <Wand2 className="h-4 w-4" /> Download clean master
                      </a>
                    </Button>
                    <p className="text-xs text-white/50">Links remain active for 24 hours after processing.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Session summary</CardTitle>
              <CardDescription>Technical readout from the latest run.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-white/70">
              {jobSummary ? (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-black/35 p-4">
                    <p className="text-xs uppercase tracking-[0.4em] text-white/45">Job ID</p>
                    <p className="mt-2 text-lg font-semibold text-white">{jobSummary.jobId}</p>
                  </div>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                      <span>Frames processed</span>
                      <span className="font-semibold text-white">{jobSummary.framesProcessed.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                      <span>Runtime</span>
                      <span className="font-semibold text-white">{formatSeconds(jobSummary.runtimeSeconds)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                      <span>Mask coverage</span>
                      <span className="font-semibold text-white">{jobSummary.maskCoverage.toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                      <span>Confidence</span>
                      <span className="font-semibold text-white">{Math.round(jobSummary.qualityScore * 100)}%</span>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-[0.4em] text-white/45">Post-checks</p>
                    <ul className="mt-3 space-y-2 text-sm text-white/70">
                      {jobSummary.artifactChecks.map((note) => (
                        <li key={note} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 text-[#ff2a2a]" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-start gap-4 rounded-3xl border border-dashed border-white/15 bg-black/20 p-6 text-white/60">
                  <AlertTriangle className="h-6 w-6 text-white/40" />
                  <div>
                    <p className="text-sm font-semibold text-white/80">No run yet</p>
                    <p className="text-sm text-white/60">Upload a video and generate a clean master to see processing insights.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent cleanups</CardTitle>
              <CardDescription>Auto-seeded history so new operators can explore the flow.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-white/70">
              {recentRuns.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between rounded-3xl border border-white/10 bg-black/30 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{run.project}</p>
                    <p className="text-xs text-white/55">{run.id}</p>
                  </div>
                  <div className="text-right text-xs text-white/55">
                    <p>{run.coverage} masked</p>
                    <p>{run.duration} • {run.date}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
