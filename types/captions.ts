export type CaptionWord = {
  id: string
  text: string
  start: number
  end: number
}

export type CaptionStyle = {
  fontFamily: string
  fontWeight: number
  fontSize: number
  color: string
  backgroundColor: string
  highlightColor: string
  uppercase: boolean
  align: "left" | "center" | "right"
  letterSpacing: number
  lineHeight: number
  shadow: boolean
  animation: string
  motion: string
  wordsPerCaption: number
  wordSpacing: number
  paddingY: number
  paddingX: number
  borderRadius: number
  backgroundOpacity: number
}

export type CaptionPreset = {
  id: string
  name: string
  description: string
  style: CaptionStyle
}

export type CaptionAnimationOption = {
  value: string
  label: string
  description: string
}

export type CaptionMotionOption = {
  value: string
  label: string
  description: string
}
