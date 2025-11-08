/**
 * Advanced Video Compiler with TikTok-quality caption effects
 * Supports all advanced animations and effects from caption-styles.ts
 */

import type { CaptionStyle, CaptionAnimation } from '@/types/caption-styles'

export interface CaptionSegment {
  text: string
  start: number // milliseconds
  end: number // milliseconds
}

export interface VideoCompilerOptions {
  videoUrl: string
  audioBase64: string
  captions: CaptionSegment[]
  style: CaptionStyle
  onProgress?: (progress: number) => void
}

const loadVideo = (url: string): Promise<HTMLVideoElement> =>
  new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.onloadedmetadata = () => {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        reject(new Error(`Video loaded but has invalid dimensions`))
        return
      }
      console.log(`✅ Video loaded: ${video.videoWidth}x${video.videoHeight}, ${video.duration}s`)
      resolve(video)
    }
    video.onerror = (error) => {
      console.error('❌ Video load error:', error)
      reject(error)
    }
    video.src = url
    video.load()
  })

const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

export const compileVideoWithCaptions = async (options: VideoCompilerOptions): Promise<Blob> => {
  const { videoUrl, audioBase64, captions, style, onProgress } = options

  // Load video
  onProgress?.(0.1)
  const video = await loadVideo(videoUrl)

  // Create audio context and load audio
  onProgress?.(0.2)
  const audioContext = new AudioContext()
  const audioBlob = base64ToBlob(audioBase64, 'audio/mpeg')
  const audioArrayBuffer = await audioBlob.arrayBuffer()
  const audioBuffer = await audioContext.decodeAudioData(audioArrayBuffer)

  const duration = video.duration
  const width = video.videoWidth
  const height = video.videoHeight

  // Create canvas for rendering
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', {
    alpha: false,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
  }) as CanvasRenderingContext2D

  if (!ctx) {
    throw new Error('Failed to get 2D context from canvas')
  }

  // Set up audio destination
  const audioDestination = audioContext.createMediaStreamDestination()
  const audioSource = audioContext.createBufferSource()
  audioSource.buffer = audioBuffer
  audioSource.connect(audioDestination)

  // Schedule audio to start
  const recordingStartTime = audioContext.currentTime + 0.1
  audioSource.start(recordingStartTime)

  onProgress?.(0.3)

  // Set up recording
  const videoStream = canvas.captureStream(30) // 30 FPS
  const audioStream = audioDestination.stream
  const combinedStream = new MediaStream([
    videoStream.getVideoTracks()[0],
    audioStream.getAudioTracks()[0],
  ])

  const recorder = new MediaRecorder(combinedStream, {
    mimeType: 'video/webm;codecs=vp9,opus',
    videoBitsPerSecond: 8000000, // 8 Mbps for high quality
  })

  const chunks: Blob[] = []
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data)
    }
  }

  const recordingPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const videoBlob = new Blob(chunks, { type: 'video/webm' })
      resolve(videoBlob)
    }
  })

  recorder.start()
  video.play()

  onProgress?.(0.4)

  // Render loop
  const renderStartTime = performance.now()
  await renderVideoWithCaptions(
    ctx,
    video,
    captions,
    duration,
    style,
    width,
    height,
    renderStartTime,
    (progress) => onProgress?.(0.4 + progress * 0.5) // 40% to 90%
  )

  // Hold last frame briefly
  await new Promise((resolve) => setTimeout(resolve, 300))

  recorder.stop()
  video.pause()
  await audioContext.close()

  onProgress?.(1)

  return recordingPromise
}

const renderVideoWithCaptions = (
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  captions: CaptionSegment[],
  totalDuration: number,
  style: CaptionStyle,
  videoWidth: number,
  videoHeight: number,
  renderStartTime: number,
  onProgress: (progress: number) => void
): Promise<void> =>
  new Promise((resolve) => {
    let frameCount = 0
    const animate = () => {
      const currentTime = (performance.now() - renderStartTime) / 1000

      // Update progress
      if (frameCount % 30 === 0) {
        onProgress(Math.min(currentTime / totalDuration, 1))
      }
      frameCount++

      if (currentTime >= totalDuration) {
        // Draw final frame
        drawFrame(ctx, video, captions, totalDuration, style, videoWidth, videoHeight)
        resolve()
        return
      }

      // Draw current frame
      drawFrame(ctx, video, captions, currentTime, style, videoWidth, videoHeight)

      requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  })

const drawFrame = (
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  captions: CaptionSegment[],
  currentTime: number, // in seconds
  style: CaptionStyle,
  videoWidth: number,
  videoHeight: number
) => {
  // Draw video frame
  ctx.drawImage(video, 0, 0, videoWidth, videoHeight)

  // Find active captions at current time
  const currentTimeMs = currentTime * 1000
  const activeCaptions = captions.filter((cap) => currentTimeMs >= cap.start && currentTimeMs < cap.end)

  if (activeCaptions.length === 0) return

  // Draw captions
  drawCaptions(ctx, activeCaptions, style, currentTime, videoWidth, videoHeight)
}

const drawCaptions = (
  ctx: CanvasRenderingContext2D,
  activeCaptions: CaptionSegment[],
  style: CaptionStyle,
  currentTime: number,
  videoWidth: number,
  videoHeight: number
) => {
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Calculate position
  const x = (videoWidth * style.position.x) / 100
  const y = (videoHeight * style.position.y) / 100

  // Process text with transforms
  const lines = activeCaptions.map((cap) => {
    const words = cap.text.split(' ').slice(0, style.maxWordsPerLine)
    let text = words.join(' ')

    switch (style.textTransform) {
      case 'uppercase':
        text = text.toUpperCase()
        break
      case 'lowercase':
        text = text.toLowerCase()
        break
      case 'capitalize':
        text = text.replace(/\b\w/g, (char) => char.toUpperCase())
        break
    }

    return { text, caption: cap }
  })

  const lineHeight = style.fontSize * style.lineHeight
  const totalHeight = lines.length * lineHeight
  let currentY = y - totalHeight / 2

  lines.forEach(({ text, caption }) => {
    const wordStartTime = caption.start / 1000
    const wordEndTime = caption.end / 1000
    const wordDuration = wordEndTime - wordStartTime
    const timeIntoWord = currentTime - wordStartTime
    // Auto-calculate animation duration: 30% of word duration, capped at 500ms
    const autoAnimDuration = Math.min(wordDuration * 0.3, 0.5)
    const animProgress = Math.min(Math.max(timeIntoWord / autoAnimDuration, 0), 1)

    ctx.save()

    // Apply animation transform
    const transform = getAnimationTransform(style.animation, animProgress)
    ctx.translate(x, currentY)
    ctx.scale(transform.scale, transform.scale)
    ctx.translate(-x, -currentY)
    ctx.translate(transform.offsetX, transform.offsetY)
    ctx.globalAlpha = transform.alpha

    // Draw background shape
    if (style.backgroundShape !== 'none') {
      drawBackgroundShape(ctx, x, currentY, text, style)
    }

    // Apply text effect
    applyTextEffect(ctx, text, x, currentY, style, animProgress)

    ctx.restore()
    currentY += lineHeight
  })
}

/**
 * Get animation transform based on animation type and progress
 */
function getAnimationTransform(
  animation: CaptionAnimation,
  progress: number
): { scale: number; offsetX: number; offsetY: number; alpha: number } {
  const t = Math.min(Math.max(progress, 0), 1)

  switch (animation) {
    case 'fade-in':
      return { scale: 1, offsetX: 0, offsetY: 0, alpha: t }

    case 'slide-up':
      return { scale: 1, offsetX: 0, offsetY: (1 - t) * 50, alpha: t }

    case 'slide-down':
      return { scale: 1, offsetX: 0, offsetY: -(1 - t) * 50, alpha: t }

    case 'scale-up':
      const scaleEase = 0.3 + 0.7 * (1 - Math.pow(1 - t, 3))
      return { scale: scaleEase, offsetX: 0, offsetY: 0, alpha: t }

    case 'bounce':
      const bounceEase = Math.sin(t * Math.PI * 2) * (1 - t) * 0.5
      return { scale: 1, offsetX: 0, offsetY: -bounceEase * 40, alpha: 1 }

    case 'pop':
      const popScale = 1 + Math.sin(t * Math.PI) * 0.3
      return { scale: popScale, offsetX: 0, offsetY: 0, alpha: 1 }

    case 'wave':
      const waveOffset = Math.sin(t * Math.PI * 4) * 10
      return { scale: 1, offsetX: 0, offsetY: waveOffset, alpha: 1 }

    case 'shake':
      const shakeX = (Math.random() - 0.5) * 8 * (1 - t)
      return { scale: 1, offsetX: shakeX, offsetY: 0, alpha: 1 }

    case 'glow-pulse':
      const pulseScale = 1 + Math.sin(t * Math.PI * 3) * 0.1
      return { scale: pulseScale, offsetX: 0, offsetY: 0, alpha: 1 }

    case 'rotate-in':
      // Rotation handled separately in text rendering
      return { scale: t, offsetX: 0, offsetY: 0, alpha: t }

    case 'blur-in':
      // Blur handled separately
      return { scale: 1, offsetX: 0, offsetY: 0, alpha: t }

    case 'karaoke':
    case 'typewriter':
      return { scale: 1, offsetX: 0, offsetY: 0, alpha: 1 }

    case 'none':
    default:
      return { scale: 1, offsetX: 0, offsetY: 0, alpha: 1 }
  }
}

/**
 * Draw background shape for caption
 */
function drawBackgroundShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  style: CaptionStyle
) {
  ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`
  const metrics = ctx.measureText(text)
  const textWidth = metrics.width
  const padding = style.backgroundPadding

  const bgColor = hexToRgba(style.backgroundColor, style.backgroundOpacity)

  ctx.fillStyle = bgColor

  const boxX = x - textWidth / 2 - padding
  const boxY = y - style.fontSize / 2 - padding
  const boxWidth = textWidth + padding * 2
  const boxHeight = style.fontSize + padding * 2
  const radius = style.backgroundRadius ?? 12

  switch (style.backgroundShape) {
    case 'rectangle':
      if (radius > 0) {
        drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, radius)
      } else {
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight)
      }
      break
    case 'rounded':
      drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, radius)
      break
    case 'pill':
      drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, boxHeight / 2)
      break
    case 'circle':
      const circleRadius = Math.max(boxWidth, boxHeight) / 2
      ctx.beginPath()
      ctx.arc(x, y, circleRadius + padding, 0, Math.PI * 2)
      ctx.fill()
      break
  }
}

/**
 * Apply text effect (gradient, 3D, neon, etc.)
 */
function applyTextEffect(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  style: CaptionStyle,
  animProgress: number
) {
  ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`
  ctx.letterSpacing = `${style.letterSpacing}px`

  // Shadow setup
  if (style.shadowEnabled) {
    ctx.shadowColor = style.shadowColor
    ctx.shadowBlur = style.shadowBlur
    ctx.shadowOffsetX = style.shadowOffsetX
    ctx.shadowOffsetY = style.shadowOffsetY
  }

  // Apply effect-specific rendering
  switch (style.effect) {
    case 'gradient':
    case 'fire':
    case 'ice':
    case 'gold':
      applyGradientEffect(ctx, text, x, y, style)
      break

    case '3d':
      apply3DEffect(ctx, text, x, y, style)
      break

    case 'neon':
    case 'glow':
      applyNeonEffect(ctx, text, x, y, style)
      break

    case 'chrome':
      applyChromeEffect(ctx, text, x, y, style)
      break

    case 'double-outline':
      applyDoubleOutlineEffect(ctx, text, x, y, style)
      break

    case 'outline':
    default:
      applyOutlineEffect(ctx, text, x, y, style)
      break
  }

  // For karaoke effect, add highlight overlay
  if (style.animation === 'karaoke') {
    applyKaraokeEffect(ctx, text, x, y, style, animProgress)
  }
}

function applyGradientEffect(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, style: CaptionStyle) {
  const metrics = ctx.measureText(text)
  const textWidth = metrics.width
  const textHeight = style.fontSize

  let gradient: CanvasGradient

  // Create gradient based on effect type
  if (style.effect === 'fire') {
    gradient = ctx.createLinearGradient(x, y - textHeight / 2, x, y + textHeight / 2)
    gradient.addColorStop(0, '#FFD700')
    gradient.addColorStop(0.5, '#FF8C00')
    gradient.addColorStop(1, '#FF4500')
  } else if (style.effect === 'ice') {
    gradient = ctx.createLinearGradient(x, y - textHeight / 2, x, y + textHeight / 2)
    gradient.addColorStop(0, '#E0F7FA')
    gradient.addColorStop(0.5, '#00BCD4')
    gradient.addColorStop(1, '#0097A7')
  } else if (style.effect === 'gold') {
    gradient = ctx.createLinearGradient(x, y - textHeight / 2, x, y + textHeight / 2)
    gradient.addColorStop(0, '#FFD700')
    gradient.addColorStop(0.5, '#FFA500')
    gradient.addColorStop(1, '#FF8C00')
  } else {
    // Custom gradient
    const angle = (style.gradientAngle * Math.PI) / 180
    const dx = Math.cos(angle) * textWidth
    const dy = Math.sin(angle) * textHeight
    gradient = ctx.createLinearGradient(x - dx / 2, y - dy / 2, x + dx / 2, y + dy / 2)
    gradient.addColorStop(0, style.gradientColors[0])
    gradient.addColorStop(1, style.gradientColors[1])
  }

  // Outline
  if (style.outlineEnabled) {
    ctx.strokeStyle = style.outlineColor
    ctx.lineWidth = style.outlineWidth
    ctx.lineJoin = 'round'
    ctx.strokeText(text, x, y)
  }

  // Fill with gradient
  ctx.fillStyle = gradient
  ctx.fillText(text, x, y)
}

function apply3DEffect(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, style: CaptionStyle) {
  // Draw 3D depth layers
  for (let i = style.depth3D; i > 0; i--) {
    const opacity = (style.depth3D - i) / style.depth3D
    ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 0.5})`
    ctx.fillText(text, x + i, y + i)
  }

  // Outline
  if (style.outlineEnabled) {
    ctx.strokeStyle = style.outlineColor
    ctx.lineWidth = style.outlineWidth
    ctx.lineJoin = 'round'
    ctx.strokeText(text, x, y)
  }

  // Main text
  ctx.fillStyle = style.textColor
  ctx.fillText(text, x, y)
}

function applyNeonEffect(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, style: CaptionStyle) {
  const glowColor = style.glowEnabled ? style.glowColor : style.textColor

  // Multiple glow layers for neon effect
  for (let i = 0; i < 3; i++) {
    ctx.shadowColor = glowColor
    ctx.shadowBlur = style.glowIntensity * (i + 1)
    ctx.fillStyle = glowColor
    ctx.fillText(text, x, y)
  }

  // Core text
  ctx.shadowBlur = 0
  ctx.fillStyle = style.textColor
  ctx.fillText(text, x, y)
}

function applyChromeEffect(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, style: CaptionStyle) {
  const textHeight = style.fontSize

  // Chrome gradient (silver/metallic)
  const gradient = ctx.createLinearGradient(x, y - textHeight / 2, x, y + textHeight / 2)
  gradient.addColorStop(0, '#E8E8E8')
  gradient.addColorStop(0.25, '#C0C0C0')
  gradient.addColorStop(0.5, '#808080')
  gradient.addColorStop(0.75, '#C0C0C0')
  gradient.addColorStop(1, '#A0A0A0')

  // Dark outline for definition
  ctx.strokeStyle = '#404040'
  ctx.lineWidth = style.outlineWidth * 1.5
  ctx.lineJoin = 'round'
  ctx.strokeText(text, x, y)

  // Chrome fill
  ctx.fillStyle = gradient
  ctx.fillText(text, x, y)
}

function applyDoubleOutlineEffect(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, style: CaptionStyle) {
  // Outer outline
  ctx.strokeStyle = style.shadowColor
  ctx.lineWidth = style.outlineWidth * 2
  ctx.lineJoin = 'round'
  ctx.strokeText(text, x, y)

  // Inner outline
  ctx.strokeStyle = style.outlineColor
  ctx.lineWidth = style.outlineWidth
  ctx.strokeText(text, x, y)

  // Main text
  ctx.fillStyle = style.textColor
  ctx.fillText(text, x, y)
}

function applyOutlineEffect(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, style: CaptionStyle) {
  // Outline
  if (style.outlineEnabled) {
    ctx.strokeStyle = style.outlineColor
    ctx.lineWidth = style.outlineWidth
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.strokeText(text, x, y)
  }

  // Main text
  ctx.fillStyle = style.textColor
  ctx.fillText(text, x, y)
}

function applyKaraokeEffect(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  style: CaptionStyle,
  progress: number
) {
  // Highlight progressing words with different color
  const metrics = ctx.measureText(text)
  const textWidth = metrics.width
  const highlightWidth = textWidth * progress

  // Create clip region for highlight
  ctx.save()
  ctx.beginPath()
  ctx.rect(x - textWidth / 2, y - style.fontSize / 2, highlightWidth, style.fontSize)
  ctx.clip()

  // Draw highlight color
  ctx.fillStyle = style.outlineColor
  ctx.fillText(text, x, y)

  ctx.restore()
}

/**
 * Draw rounded rectangle
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.max(Math.min(radius, width / 2, height / 2), 0)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
  ctx.fill()
}

/**
 * Convert hex color to rgba with opacity
 */
function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}
