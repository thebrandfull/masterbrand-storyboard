/**
 * Advanced caption styling types and utilities
 * TikTok-quality caption system
 */

export type CaptionAnimation =
  | 'none'
  | 'fade-in'
  | 'slide-up'
  | 'slide-down'
  | 'scale-up'
  | 'bounce'
  | 'pop'
  | 'typewriter'
  | 'karaoke' // Word-by-word highlight
  | 'wave' // Wave animation
  | 'shake' // Shake effect
  | 'glow-pulse' // Pulsing glow
  | 'rotate-in' // Rotate entrance
  | 'blur-in' // Blur to focus

export type CaptionEffect =
  | 'none'
  | 'outline' // Text stroke
  | 'shadow' // Drop shadow
  | 'glow' // Outer glow
  | 'neon' // Neon effect
  | 'gradient' // Gradient text
  | '3d' // 3D text
  | 'double-outline' // Double stroke
  | 'glitch' // Glitch effect
  | 'fire' // Fire gradient
  | 'ice' // Ice gradient
  | 'gold' // Metallic gold
  | 'chrome' // Chrome effect

export type CaptionPosition = {
  x: number // 0-100 percentage
  y: number // 0-100 percentage
}

export interface CaptionStyle {
  // Font
  fontFamily: string
  fontSize: number
  fontWeight: number
  letterSpacing: number
  lineHeight: number

  // Colors
  textColor: string
  outlineColor: string
  shadowColor: string
  backgroundColor: string
  backgroundOpacity: number

  // Effects
  effect: CaptionEffect
  animation: CaptionAnimation

  // Outline/Stroke
  outlineWidth: number
  outlineEnabled: boolean

  // Shadow
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  shadowEnabled: boolean

  // Glow
  glowIntensity: number
  glowColor: string
  glowEnabled: boolean

  // Gradient (for gradient text effect)
  gradientColors: [string, string]
  gradientAngle: number

  // 3D Effect
  depth3D: number

  // Position
  position: CaptionPosition

  // Background Shape
  backgroundShape: 'none' | 'rectangle' | 'rounded' | 'pill' | 'circle'
  backgroundPadding: number
  backgroundRadius?: number

  // Case
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize'

  // Word chunking
  maxWordsPerLine: number
  maxCharsPerLine: number
}

export const DEFAULT_CAPTION_STYLE: CaptionStyle = {
  fontFamily: 'Montserrat',
  fontSize: 72,
  fontWeight: 900,
  letterSpacing: 0,
  lineHeight: 1.2,

  textColor: '#FFFFFF',
  outlineColor: '#000000',
  shadowColor: '#000000',
  backgroundColor: '#000000',
  backgroundOpacity: 0.5,

  effect: 'outline',
  animation: 'pop',

  outlineWidth: 4,
  outlineEnabled: true,

  shadowBlur: 20,
  shadowOffsetX: 0,
  shadowOffsetY: 4,
  shadowEnabled: true,

  glowIntensity: 20,
  glowColor: '#FFFFFF',
  glowEnabled: false,

  gradientColors: ['#FF6B6B', '#4ECDC4'],
  gradientAngle: 45,

  depth3D: 4,

  position: { x: 50, y: 75 },

  backgroundShape: 'none',
  backgroundPadding: 12,
  backgroundRadius: 16,

  textTransform: 'uppercase',

  maxWordsPerLine: 2,
  maxCharsPerLine: 20,
}

/**
 * TikTok-style caption presets
 */
export interface CaptionPreset {
  id: string
  name: string
  description: string
  style: CaptionStyle
  preview: string
}

export const CAPTION_PRESETS: CaptionPreset[] = [
  {
    id: 'tiktok-classic',
    name: 'TikTok Classic',
    description: 'Bold white text with black outline',
    preview: 'VIRAL TEXT',
    style: {
      ...DEFAULT_CAPTION_STYLE,
      fontFamily: 'Montserrat',
      fontSize: 72,
      fontWeight: 900,
      textColor: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 6,
      outlineEnabled: true,
      shadowEnabled: true,
      shadowBlur: 25,
      effect: 'outline',
      animation: 'pop',
      textTransform: 'uppercase',
    },
  },
  {
    id: 'neon-glow',
    name: 'Neon Glow',
    description: 'Vibrant neon text with glow',
    preview: 'NEON VIBES',
    style: {
      ...DEFAULT_CAPTION_STYLE,
      fontFamily: 'Bebas Neue',
      fontSize: 80,
      fontWeight: 400,
      textColor: '#00FF87',
      glowEnabled: true,
      glowColor: '#00FF87',
      glowIntensity: 40,
      effect: 'neon',
      animation: 'glow-pulse',
      textTransform: 'uppercase',
    },
  },
  {
    id: 'gradient-fire',
    name: 'Fire Gradient',
    description: 'Hot gradient from yellow to red',
    preview: 'ON FIRE',
    style: {
      ...DEFAULT_CAPTION_STYLE,
      fontFamily: 'Anton',
      fontSize: 76,
      fontWeight: 400,
      gradientColors: ['#FFD700', '#FF4500'],
      gradientAngle: 90,
      effect: 'gradient',
      animation: 'scale-up',
      outlineEnabled: true,
      outlineColor: '#000000',
      outlineWidth: 4,
      textTransform: 'uppercase',
    },
  },
  {
    id: '3d-pop',
    name: '3D Pop',
    description: '3D text with depth',
    preview: '3D STYLE',
    style: {
      ...DEFAULT_CAPTION_STYLE,
      fontFamily: 'Black Ops One',
      fontSize: 70,
      fontWeight: 400,
      textColor: '#FF6B9D',
      depth3D: 8,
      effect: '3d',
      animation: 'bounce',
      shadowEnabled: true,
      shadowBlur: 30,
      textTransform: 'uppercase',
    },
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Simple and elegant',
    preview: 'Stay Clean',
    style: {
      ...DEFAULT_CAPTION_STYLE,
      fontFamily: 'Poppins',
      fontSize: 64,
      fontWeight: 700,
      textColor: '#FFFFFF',
      backgroundShape: 'rounded',
      backgroundColor: '#000000',
      backgroundOpacity: 0.7,
      backgroundPadding: 16,
      effect: 'none',
      animation: 'fade-in',
      outlineEnabled: false,
      shadowEnabled: false,
      textTransform: 'capitalize',
    },
  },
  {
    id: 'karaoke',
    name: 'Karaoke Style',
    description: 'Word-by-word highlight animation',
    preview: 'SING ALONG',
    style: {
      ...DEFAULT_CAPTION_STYLE,
      fontFamily: 'Inter',
      fontSize: 68,
      fontWeight: 800,
      textColor: '#FFFFFF',
      outlineEnabled: true,
      outlineColor: '#FF1493',
      outlineWidth: 5,
      effect: 'outline',
      animation: 'karaoke',
      textTransform: 'uppercase',
    },
  },
  {
    id: 'gold-luxury',
    name: 'Gold Luxury',
    description: 'Metallic gold effect',
    preview: 'LUXURY',
    style: {
      ...DEFAULT_CAPTION_STYLE,
      fontFamily: 'Cinzel',
      fontSize: 72,
      fontWeight: 900,
      gradientColors: ['#FFD700', '#FFA500'],
      gradientAngle: 135,
      effect: 'gold',
      animation: 'rotate-in',
      shadowEnabled: true,
      shadowBlur: 35,
      shadowColor: '#8B4513',
      textTransform: 'uppercase',
    },
  },
  {
    id: 'ice-cool',
    name: 'Ice Cool',
    description: 'Icy blue gradient',
    preview: 'STAY COOL',
    style: {
      ...DEFAULT_CAPTION_STYLE,
      fontFamily: 'Oswald',
      fontSize: 74,
      fontWeight: 700,
      gradientColors: ['#00D9FF', '#0099CC'],
      gradientAngle: 180,
      effect: 'ice',
      animation: 'slide-down',
      glowEnabled: true,
      glowColor: '#00D9FF',
      glowIntensity: 25,
      textTransform: 'uppercase',
    },
  },
]

/**
 * Get caption effect CSS
 */
export function getCaptionEffectStyles(style: CaptionStyle): React.CSSProperties {
  const styles: React.CSSProperties = {
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    fontWeight: style.fontWeight,
    letterSpacing: `${style.letterSpacing}px`,
    lineHeight: style.lineHeight,
    textTransform: style.textTransform,
  }

  // Apply text color or gradient
  if (style.effect === 'gradient' || style.effect === 'fire' || style.effect === 'ice' || style.effect === 'gold') {
    styles.background = `linear-gradient(${style.gradientAngle}deg, ${style.gradientColors[0]}, ${style.gradientColors[1]})`
    styles.WebkitBackgroundClip = 'text'
    styles.WebkitTextFillColor = 'transparent'
    styles.backgroundClip = 'text'
  } else if (style.effect === 'chrome') {
    styles.background = 'linear-gradient(180deg, #C0C0C0 0%, #808080 50%, #404040 100%)'
    styles.WebkitBackgroundClip = 'text'
    styles.WebkitTextFillColor = 'transparent'
    styles.backgroundClip = 'text'
  } else {
    styles.color = style.textColor
  }

  // Outline/Stroke
  if (style.outlineEnabled && style.effect !== 'gradient') {
    styles.WebkitTextStroke = `${style.outlineWidth}px ${style.outlineColor}`
    if (style.effect === 'double-outline') {
      styles.textShadow = `0 0 ${style.outlineWidth * 2}px ${style.outlineColor}`
    }
  }

  // Shadow
  let shadows: string[] = []
  if (style.shadowEnabled) {
    shadows.push(
      `${style.shadowOffsetX}px ${style.shadowOffsetY}px ${style.shadowBlur}px ${style.shadowColor}`
    )
  }

  // Glow
  if (style.glowEnabled || style.effect === 'glow' || style.effect === 'neon') {
    const glowColor = style.glowEnabled ? style.glowColor : style.textColor
    shadows.push(`0 0 ${style.glowIntensity}px ${glowColor}`)
    shadows.push(`0 0 ${style.glowIntensity * 2}px ${glowColor}`)
  }

  // 3D Effect
  if (style.effect === '3d') {
    const depth = style.depth3D
    for (let i = 1; i <= depth; i++) {
      const opacity = 1 - i / depth
      shadows.push(`${i}px ${i}px 0 rgba(0, 0, 0, ${opacity})`)
    }
  }

  if (shadows.length > 0) {
    styles.textShadow = shadows.join(', ')
  }

  return styles
}

/**
 * Get background shape styles
 */
export function getBackgroundShapeStyles(style: CaptionStyle): React.CSSProperties {
  if (style.backgroundShape === 'none') return {}

  const bgColor = `rgba(${parseInt(style.backgroundColor.slice(1, 3), 16)}, ${parseInt(
    style.backgroundColor.slice(3, 5),
    16
  )}, ${parseInt(style.backgroundColor.slice(5, 7), 16)}, ${style.backgroundOpacity})`

  const styles: React.CSSProperties = {
    backgroundColor: bgColor,
    padding: `${style.backgroundPadding}px`,
  }

  const radius =
    style.backgroundRadius ??
    (style.backgroundShape === 'pill'
      ? 999
      : style.backgroundShape === 'rounded'
        ? 12
        : style.backgroundShape === 'circle'
          ? 999
          : 0)

  switch (style.backgroundShape) {
    case 'rounded':
      styles.borderRadius = `${radius}px`
      break
    case 'pill':
      styles.borderRadius = '999px'
      break
    case 'circle':
      styles.borderRadius = '50%'
      styles.aspectRatio = '1'
      break
    case 'rectangle':
      styles.borderRadius = `${radius}px`
      break
  }

  return styles
}
