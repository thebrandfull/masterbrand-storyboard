"use client"

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import type { CaptionStyle, CaptionWord } from "@/types/captions"

export type CaptionPreviewProps = {
  videoUrl?: string
  audioSrc?: string
  poster?: string
  words: CaptionWord[]
  style: CaptionStyle
  offset: number
  onCurrentTimeChange?: (time: number) => void
}

type CaptionGroup = {
  id: string
  words: CaptionWord[]
  start: number
  end: number
}

const animationClassMap: Record<string, string> = {
  "fade-in": "caption-animate-fade",
  "slide-up": "caption-animate-slide-up",
  "slide-down": "caption-animate-slide-down",
  "bounce": "caption-animate-bounce",
  "scale": "caption-animate-scale",
  typewriter: "caption-animate-type",
}

const motionClassMap: Record<string, string> = {
  static: "",
  float: "caption-motion-float",
  drop: "caption-motion-drop",
  punch: "caption-motion-punch",
  drift: "caption-motion-drift",
}

export function CaptionPreview({
  videoUrl,
  audioSrc,
  poster,
  words,
  style,
  offset,
  onCurrentTimeChange,
}: CaptionPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const time = video.currentTime
      const adjustedTime = Math.max(time + offset, 0)
      setCurrentTime(adjustedTime)
      onCurrentTimeChange?.(adjustedTime)
    }

    const handleSeek = () => {
      const audio = audioRef.current
      if (!audio) return
      const target = Math.max(video.currentTime + offset, 0)
      audio.currentTime = Math.min(target, audio.duration || target)
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("seeked", handleSeek)
    video.addEventListener("loadeddata", handleSeek)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("seeked", handleSeek)
      video.removeEventListener("loadeddata", handleSeek)
    }
  }, [offset, onCurrentTimeChange])

  useEffect(() => {
    const video = videoRef.current
    const audio = audioRef.current
    if (!video || !audio) return

    const handlePlay = async () => {
      audio.currentTime = Math.max(video.currentTime + offset, 0)
      try {
        await audio.play()
      } catch (error) {
        console.warn("Audio playback blocked", error)
      }
    }

    const handlePause = () => {
      audio.pause()
    }

    const handleEnded = () => {
      audio.pause()
      audio.currentTime = 0
    }

    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("ended", handleEnded)
    }
  }, [offset])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioSrc) return
    audio.src = audioSrc
    audio.load()
  }, [audioSrc])

  const groups = useMemo(() => buildGroups(words, style.wordsPerCaption), [words, style.wordsPerCaption])

  const activeGroup = useMemo(() => {
    return groups.find((group) => currentTime >= group.start - 0.05 && currentTime <= group.end + 0.15)
  }, [groups, currentTime])

  const activeWordIds = useMemo(() => {
    const activeWords = words.filter((word) => currentTime >= word.start - 0.05 && currentTime <= word.end + 0.05)
    return new Set(activeWords.map((word) => word.id))
  }, [currentTime, words])

  return (
    <div className="space-y-4">
      <div
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-[0_20px_80px_rgba(0,0,0,0.65)]"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <video
          ref={videoRef}
          className="h-[360px] w-full object-cover"
          controls
          poster={poster}
          src={videoUrl ?? undefined}
        />
        <audio ref={audioRef} className="hidden" preload="metadata" />
        {activeGroup && (
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-10">
            <div
              className={[
                "max-w-3xl text-center",
                animationClassMap[style.animation] ?? "",
                motionClassMap[style.motion] ?? "",
                isHovering ? "opacity-100" : "opacity-95",
              ]
                .filter(Boolean)
                .join(" ")}
              style={buildCaptionWrapperStyle(style)}
            >
              <div style={buildCaptionTextStyle(style)}>
                {activeGroup.words.map((word) => {
                  const isActive = activeWordIds.has(word.id)
                  return (
                    <span
                      key={word.id}
                      className={[
                        "inline-block transition-all duration-150",
                        isActive ? "caption-word-active" : "caption-word-idle",
                      ].join(" ")}
                      style={{
                        marginRight: `${style.wordSpacing}em`,
                        color: isActive ? style.highlightColor : style.color,
                      }}
                    >
                      {style.uppercase ? word.text.toUpperCase() : word.text}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-white/60">
        <p>
          Current time: <span className="font-semibold text-white">{currentTime.toFixed(2)}s</span>
        </p>
        <p>
          Caption groups: <span className="font-semibold text-white">{groups.length}</span>
        </p>
      </div>
    </div>
  )
}

function buildGroups(words: CaptionWord[], wordsPerGroup: number): CaptionGroup[] {
  if (wordsPerGroup <= 0) return []
  const groups: CaptionGroup[] = []
  let current: CaptionWord[] = []

  for (const word of words) {
    current.push(word)
    if (current.length >= wordsPerGroup) {
      groups.push({
        id: current[0]?.id ?? `${groups.length}`,
        words: current,
        start: current[0]?.start ?? 0,
        end: current[current.length - 1]?.end ?? current[0]?.end ?? 0,
      })
      current = []
    }
  }

  if (current.length > 0) {
    groups.push({
      id: current[0]?.id ?? `${groups.length}`,
      words: current,
      start: current[0]?.start ?? 0,
      end: current[current.length - 1]?.end ?? current[0]?.end ?? 0,
    })
  }

  return groups
}

function buildCaptionWrapperStyle(style: CaptionStyle): CSSProperties {
  return {
    backgroundColor: applyOpacity(style.backgroundColor, style.backgroundOpacity),
    padding: `${style.paddingY}rem ${style.paddingX}rem`,
    borderRadius: `${style.borderRadius}px`,
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: style.shadow ? "0 18px 40px rgba(0,0,0,0.55)" : "none",
    backdropFilter: "blur(18px)",
  }
}

function buildCaptionTextStyle(style: CaptionStyle): CSSProperties {
  return {
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    fontSize: `${style.fontSize}px`,
    textTransform: style.uppercase ? "uppercase" : "none",
    letterSpacing: `${style.letterSpacing}px`,
    lineHeight: style.lineHeight,
    textAlign: style.align,
  }
}

function applyOpacity(hexColor: string, opacity: number) {
  if (!hexColor.startsWith("#")) return hexColor
  const value = hexColor.replace("#", "")
  const bigint = parseInt(value, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}
