import type { AlignmentCharacter, TranscriptWord } from "./elevenlabs"

export interface Caption {
  text: string
  start: number // milliseconds
  end: number // milliseconds
}

export interface CaptionGeneratorOptions {
  maxWordsPerCaption?: number
  maxCharsPerCaption?: number
  minDuration?: number // milliseconds
}

const DEFAULT_OPTIONS: Required<CaptionGeneratorOptions> = {
  maxWordsPerCaption: 2, // TikTok style - 2 words max
  maxCharsPerCaption: 20,
  minDuration: 500, // 0.5 seconds minimum for fast-paced captions
}

/**
 * Generate synchronized captions from ElevenLabs alignment data
 */
export function generateCaptions(
  alignment: AlignmentCharacter[],
  options: CaptionGeneratorOptions = {}
): Caption[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const captions: Caption[] = []

  if (!alignment || alignment.length === 0) {
    return captions
  }

  let currentCaption: { words: string[]; start: number; chars: number } = {
    words: [],
    start: 0,
    chars: 0,
  }
  let currentWord = ""
  let wordStartTime = alignment[0].start * 1000 // Convert to milliseconds

  for (let i = 0; i < alignment.length; i++) {
    const char = alignment[i]
    const charTime = char.start * 1000
    const charCode = char.character

    // Handle word boundaries (space, punctuation, etc.)
    if (charCode === " " || i === alignment.length - 1) {
      // Add last character if it's the end
      if (i === alignment.length - 1 && charCode !== " ") {
        currentWord += charCode
      }

      // Add word to caption if we have one
      if (currentWord.trim().length > 0) {
        currentCaption.words.push(currentWord.trim())
        currentCaption.chars += currentWord.length

        // Check if we should create a new caption
        const shouldBreak =
          currentCaption.words.length >= opts.maxWordsPerCaption ||
          currentCaption.chars >= opts.maxCharsPerCaption

        if (shouldBreak || i === alignment.length - 1) {
          const endTime = char.end ? char.end * 1000 : (char.start + 0.5) * 1000
          const duration = endTime - currentCaption.start

          // Only add caption if it meets minimum duration
          if (duration >= opts.minDuration) {
            captions.push({
              text: currentCaption.words.join(" "),
              start: currentCaption.start,
              end: endTime,
            })
          }

          // Start new caption
          currentCaption = {
            words: [],
            start: endTime,
            chars: 0,
          }
        }

        currentWord = ""
        wordStartTime = charTime
      }
    } else {
      // Add character to current word
      currentWord += charCode
      if (currentWord.length === 1) {
        wordStartTime = charTime
      }
      if (currentCaption.words.length === 0) {
        currentCaption.start = wordStartTime
      }
    }
  }

  return captions
}

/**
 * Format captions as SRT (SubRip) format
 */
export function formatAsSRT(captions: Caption[]): string {
  return captions
    .map((caption, index) => {
      const startTime = formatSRTTime(caption.start)
      const endTime = formatSRTTime(caption.end)
      return `${index + 1}\n${startTime} --> ${endTime}\n${caption.text}\n`
    })
    .join("\n")
}

/**
 * Format captions as VTT (WebVTT) format
 */
export function formatAsVTT(captions: Caption[]): string {
  const header = "WEBVTT\n\n"
  const body = captions
    .map((caption, index) => {
      const startTime = formatVTTTime(caption.start)
      const endTime = formatVTTTime(caption.end)
      return `${index + 1}\n${startTime} --> ${endTime}\n${caption.text}\n`
    })
    .join("\n")
  return header + body
}

/**
 * Format captions as JSON
 */
export function formatAsJSON(captions: Caption[]): string {
  return JSON.stringify(captions, null, 2)
}

/**
 * Format time in SRT format (HH:MM:SS,mmm)
 */
function formatSRTTime(milliseconds: number): string {
  const hours = Math.floor(milliseconds / 3600000)
  const minutes = Math.floor((milliseconds % 3600000) / 60000)
  const seconds = Math.floor((milliseconds % 60000) / 1000)
  const ms = Math.floor(milliseconds % 1000)

  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)},${pad(ms, 3)}`
}

/**
 * Format time in VTT format (HH:MM:SS.mmm)
 */
function formatVTTTime(milliseconds: number): string {
  return formatSRTTime(milliseconds).replace(",", ".")
}

function pad(num: number, size: number): string {
  return num.toString().padStart(size, "0")
}

/**
 * Generate caption segments for word-by-word highlighting
 */
export function generateWordCaptions(alignment: AlignmentCharacter[]): Caption[] {
  const captions: Caption[] = []
  let currentWord = ""
  let wordStartTime = 0

  for (let i = 0; i < alignment.length; i++) {
    const char = alignment[i]
    const charTime = char.start * 1000

    if (char.character === " " || i === alignment.length - 1) {
      if (i === alignment.length - 1 && char.character !== " ") {
        currentWord += char.character
      }

      if (currentWord.trim().length > 0) {
        const endTime = char.end ? char.end * 1000 : (char.start + 0.3) * 1000
        captions.push({
          text: currentWord.trim(),
          start: wordStartTime,
          end: endTime,
        })
        currentWord = ""
      }
    } else {
      if (currentWord.length === 0) {
        wordStartTime = charTime
      }
      currentWord += char.character
    }
  }

  return captions
}

/**
 * Generate captions from ElevenLabs transcript words with character-level timestamps
 */
export function generateCaptionsFromTranscript(
  words: TranscriptWord[],
  options: CaptionGeneratorOptions = {}
): Caption[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const captions: Caption[] = []

  if (!words || words.length === 0) {
    return captions
  }

  let currentCaption: { words: string[]; start: number; end: number; chars: number } = {
    words: [],
    start: 0,
    end: 0,
    chars: 0,
  }

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const wordText = word.text.trim()

    if (!wordText) continue

    // Initialize caption start time
    if (currentCaption.words.length === 0) {
      currentCaption.start = word.start * 1000 // Convert to milliseconds
    }

    currentCaption.words.push(wordText)
    currentCaption.chars += wordText.length
    currentCaption.end = word.end * 1000

    const limitReached =
      currentCaption.words.length >= opts.maxWordsPerCaption ||
      currentCaption.chars >= opts.maxCharsPerCaption
    const isLastWord = i === words.length - 1

    if (limitReached || isLastWord) {
      const duration = currentCaption.end - currentCaption.start
      const meetsDuration = duration >= opts.minDuration || isLastWord

      if (meetsDuration) {
        captions.push({
          text: currentCaption.words.join(" "),
          start: currentCaption.start,
          end: currentCaption.end,
        })

        currentCaption = {
          words: [],
          start: 0,
          end: 0,
          chars: 0,
        }
      }
    }
  }

  return captions
}
