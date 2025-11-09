import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { execFile } from "child_process"
import { randomUUID } from "crypto"
import { createSoraTask, waitForTaskCompletion, parseResultUrls } from "@/lib/kie"
import {
  generateSpeech,
  speechToSpeech,
  transcribeAudio,
  buildWordsFromAlignment,
  type TranscriptWord,
} from "@/lib/elevenlabs"
import { generateContent } from "@/lib/deepseek"
import { generateCaptionsFromTranscript, formatAsSRT, formatAsVTT } from "@/lib/caption-generator"
import type { Database } from "@/types/database"

type BrandRow = Database["public"]["Tables"]["brands"]["Row"]

export const maxDuration = 600 // 10 minutes max for this workflow (Sora 2 can take time)
export const runtime = "nodejs"

interface WorkflowRequest {
  // Brand context
  brand: Pick<
    BrandRow,
    "name" | "mission" | "voice_tone" | "target_audience" | "visual_lexicon" | "dos" | "donts" | "negative_prompts"
  >

  // Video parameters
  topic: string
  platform: string
  aspectRatio?: "portrait" | "landscape"
  duration?: "10" | "15"

  // Voice parameters
  voiceId: string
  voiceSettings?: {
    stability?: number
    similarity_boost?: number
    style?: number
    use_speaker_boost?: boolean
  }

  // Cameos
  cameos?: Array<{ name: string; description: string; visualDescription: string }>

  // Optional overrides
  customPrompt?: string
  customVoiceoverScript?: string
  visualKeywords?: string[]
  negativePrompts?: string[]
  existingVideoBase64?: string
  existingVideoMimeType?: string
  captionOptions?: {
    maxWordsPerCaption?: number
    maxCharsPerCaption?: number
    minDurationMs?: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WorkflowRequest
    const {
      brand,
      topic,
      platform,
      aspectRatio = "landscape",
      duration = "10",
      voiceId,
      voiceSettings,
      cameos,
      customPrompt,
      customVoiceoverScript,
      visualKeywords,
      negativePrompts,
      existingVideoBase64,
      existingVideoMimeType,
      captionOptions,
    } = body

    const isUploadMode = typeof existingVideoBase64 === "string" && existingVideoBase64.length > 0
    const trimmedTopic = topic?.trim() ?? ""
    const computedMinDuration =
      captionOptions?.minDurationMs ??
      ((captionOptions?.maxWordsPerCaption ?? 2) <= 1 ? 180 : 360)

    const captionConfig = {
      maxWordsPerCaption: Math.min(Math.max(captionOptions?.maxWordsPerCaption ?? 2, 1), 6),
      maxCharsPerCaption: Math.min(Math.max(captionOptions?.maxCharsPerCaption ?? 20, 8), 60),
      minDuration: Math.max(140, computedMinDuration),
    }

    // Validate required fields
    if (!brand || !platform || !voiceId || (!isUploadMode && !trimmedTopic)) {
      return NextResponse.json(
        { error: "Missing required fields: brand, platform, voiceId, and topic (for Sora flow)" },
        { status: 400 }
      )
    }

    // Step 1: Generate script and metadata with DeepSeek
    console.log("Step 1: Generating script with DeepSeek...")
    let metadataResult: Awaited<ReturnType<typeof generateContent>> | null =
      isUploadMode
        ? null
        : await generateContent({
            brand,
            topic: trimmedTopic,
            platform,
            visualKeywords,
            negativePrompts,
            cameos,
          })

    let videoPrompt = !isUploadMode ? customPrompt || metadataResult?.prompts?.[0] || "" : customPrompt || ""
    let voiceoverScript =
      customVoiceoverScript ||
      (metadataResult?.voiceoverScript || metadataResult?.description || transcriptPlaceholder(trimmedTopic || ""))
    let alternativePrompts = !isUploadMode ? metadataResult?.prompts?.slice(1) || [] : []

    let videoBlob: Blob
    let soraVideoUrl: string | null = null
    let taskId: string | null = null
    let taskInfo: Record<string, unknown> | null = null

    if (isUploadMode) {
      console.log("Step 2: Using uploaded video payload, skipping Sora generation...")
      const videoBuffer = Buffer.from(existingVideoBase64, "base64")
      if (!videoBuffer.length) {
        throw new Error("Uploaded video data was empty")
      }
      if (videoBuffer.length > 120 * 1024 * 1024) {
        throw new Error("Uploaded video exceeds the 120MB limit")
      }
      videoBlob = new Blob([videoBuffer], { type: existingVideoMimeType || "video/mp4" })
    } else {
      // Step 2: Create Sora video task
      console.log("Step 2: Creating Sora video task...")
      taskId = await createSoraTask({
        prompt: videoPrompt,
        aspectRatio,
        nFrames: duration,
        removeWatermark: true,
      })

      // Step 3: Wait for video completion (with timeout)
      console.log("Step 3: Waiting for Sora video generation (this may take 3-7 minutes)...")
      const taskStatus = await waitForTaskCompletion(taskId, 60, 10000) // 60 attempts x 10s = 10 minutes max

      if (taskStatus.state !== "success") {
        throw new Error(taskStatus.failMsg || `Video generation failed with code: ${taskStatus.failCode}`)
      }

      taskInfo = {
        consumeCredits: taskStatus.consumeCredits,
        costTime: taskStatus.costTime,
        createTime: taskStatus.createTime,
        completeTime: taskStatus.completeTime,
      }

      // Step 4: Parse video URLs
      const resultUrls = parseResultUrls(taskStatus.resultJson)
      if (!resultUrls || resultUrls.resultUrls.length === 0) {
        throw new Error("No video URL returned from Kie.ai")
      }

      soraVideoUrl = resultUrls.resultUrls[0]

      // Step 5: Download Sora video
      console.log("Step 4: Downloading Sora video...")
      const videoResponse = await fetch(soraVideoUrl)
      if (!videoResponse.ok) {
        throw new Error("Failed to download Sora video")
      }
      videoBlob = await videoResponse.blob()
    }

    let transcriptWords: TranscriptWord[] = []
    let transcriptText = ""
    let transcriptLanguage = "en"
    let voiceAudioBase64 = ""
    let usedSpeechToSpeech = false

    if (isUploadMode) {
      console.log("Step 5: Transcribing uploaded audio...")
      const uploadTranscript = await transcribeAudio(videoBlob, {
        timestampsGranularity: "word",
        languageCode: "en",
      })
      transcriptWords = uploadTranscript.words
      transcriptText = uploadTranscript.text
      transcriptLanguage = uploadTranscript.language_code || "en"

      console.log("Step 6: Regenerating ElevenLabs voiceover via speech-to-speech...")
      try {
        const s2sSpeech = await speechToSpeech({
          audioFile: videoBlob,
          voiceId,
          voiceSettings,
        })
        voiceAudioBase64 = s2sSpeech.audioBase64
        usedSpeechToSpeech = true
      } catch (error) {
        console.warn("Speech-to-speech failed, falling back to TTS regeneration:", error)
        const regeneratedSpeech = await generateSpeech({
          text: transcriptText,
          voiceId,
          voiceSettings,
        })
        voiceAudioBase64 = regeneratedSpeech.audioBase64
        if (transcriptWords.length === 0) {
          transcriptWords = buildWordsFromAlignment(regeneratedSpeech.alignment, transcriptText)
        }
      }
    } else {
      console.log("Step 5: Generating ElevenLabs voiceover...")
      const generatedSpeech = await generateSpeech({
        text: voiceoverScript,
        voiceId,
        voiceSettings,
      })
      voiceAudioBase64 = generatedSpeech.audioBase64
      transcriptText = voiceoverScript
      transcriptLanguage = "en"
      transcriptWords = buildWordsFromAlignment(generatedSpeech.alignment, voiceoverScript)
    }

    if (isUploadMode && transcriptWords.length > 0 && voiceAudioBase64 && !usedSpeechToSpeech) {
      voiceAudioBase64 = await alignVoiceoverToTranscriptDuration(voiceAudioBase64, transcriptWords)
    }

    // Step 9: Generate TikTok-style captions (2 words max)
    console.log("Step 7: Generating TikTok-style captions...")
    const captions = generateCaptionsFromTranscript(transcriptWords, {
      maxWordsPerCaption: captionConfig.maxWordsPerCaption,
      maxCharsPerCaption: captionConfig.maxCharsPerCaption,
      minDuration: captionConfig.minDuration,
    })

    const captionsSRT = formatAsSRT(captions)
    const captionsVTT = formatAsVTT(captions)

    if (isUploadMode) {
      const transcriptSummary = summarizeTranscriptForTopic(transcriptText)
      metadataResult = await generateContent({
        brand,
        topic: transcriptSummary,
        platform,
        visualKeywords,
        negativePrompts,
        cameos,
      })
      voiceoverScript = customVoiceoverScript || transcriptText
      alternativePrompts = []
      videoPrompt = customPrompt || ""
    }

    if (!metadataResult) {
      throw new Error("Failed to generate metadata")
    }

    // Step 10: Return complete workflow result
    return NextResponse.json({
      success: true,
      data: {
        // Video data
        videoUrl: soraVideoUrl,
        videoTaskId: taskId,
        videoSource: isUploadMode ? "upload" : "sora",

        // Audio data (voice-changed)
        audioBase64: voiceAudioBase64,

        // Transcript data
        transcript: {
          text: transcriptText,
          words: transcriptWords.map((word) => ({
            text: word.text,
            start: word.start,
            end: word.end,
            type: "word",
          })),
          languageCode: transcriptLanguage,
        },

        // Captions (2 words per line, TikTok style)
        captions: {
          segments: captions,
          srt: captionsSRT,
          vtt: captionsVTT,
          count: captions.length,
        },

        // Metadata
        title: metadataResult.title,
        description: metadataResult.description,
        tags: metadataResult.tags,
        thumbnailBrief: metadataResult.thumbnailBrief,

        // Prompts and scripts used
        videoPrompt,
        voiceoverScript,
        alternativePrompts,

        // Task info
        taskInfo,
      },
    })
  } catch (error) {
    console.error("Error in Sora workflow:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Workflow generation failed",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

function summarizeTranscriptForTopic(transcriptText: string) {
  if (!transcriptText?.trim()) {
    return "Summarize and describe the uploaded video"
  }
  const words = transcriptText.split(/\s+/).slice(0, 80).join(" ")
  return `Use this transcript excerpt to summarize the video and generate platform-ready metadata: ${words}`
}

function transcriptPlaceholder(fallbackTopic: string) {
  return fallbackTopic || "Voiceover script will match the generated narration."
}

async function alignVoiceoverToTranscriptDuration(audioBase64: string, words: TranscriptWord[]): Promise<string> {
  const durationSeconds = getTranscriptDuration(words)
  if (!audioBase64 || durationSeconds <= 0) {
    return audioBase64
  }

  try {
    return await retimeAudioBase64(audioBase64, durationSeconds)
  } catch (error) {
    console.warn("Failed to retime ElevenLabs audio, returning original:", error)
    return audioBase64
  }
}

function getTranscriptDuration(words: TranscriptWord[]): number {
  if (!words || words.length === 0) return 0
  const lastWord = words[words.length - 1]
  return typeof lastWord.end === "number" ? lastWord.end : 0
}

async function retimeAudioBase64(audioBase64: string, targetDurationSeconds: number): Promise<string> {
  if (!isFinite(targetDurationSeconds) || targetDurationSeconds <= 0) {
    return audioBase64
  }

  const inputPath = join(tmpdir(), `sora-voice-${randomUUID()}.mp3`)
  const outputPath = join(tmpdir(), `sora-voice-${randomUUID()}.mp3`)
  try {
    await fs.writeFile(inputPath, Buffer.from(audioBase64, "base64"))

    const currentDuration = await probeAudioDuration(inputPath)
    if (!currentDuration || !isFinite(currentDuration) || currentDuration <= 0) {
      return audioBase64
    }

    const ratio = targetDurationSeconds / currentDuration
    if (!isFinite(ratio) || ratio <= 0) {
      return audioBase64
    }

    const tolerance = 0.015 // 1.5% duration variance allowed
    if (Math.abs(ratio - 1) <= tolerance) {
      return audioBase64
    }

    const tempoFilter = buildTempoFilterChain(ratio)
    if (!tempoFilter) {
      return audioBase64
    }

    await runCommand("ffmpeg", [
      "-y",
      "-i",
      inputPath,
      "-vn",
      "-filter:a",
      tempoFilter,
      outputPath,
    ])

    const adjustedBuffer = await fs.readFile(outputPath)
    return adjustedBuffer.toString("base64")
  } finally {
    await safeUnlink(inputPath)
    await safeUnlink(outputPath)
  }
}

function buildTempoFilterChain(ratio: number): string | null {
  let remaining = ratio
  const filters: string[] = []

  // Keep ratio within ffmpeg atempo constraints (0.5x - 2x)
  while (remaining > 2) {
    filters.push("atempo=2.0")
    remaining /= 2
  }

  while (remaining < 0.5) {
    filters.push("atempo=0.5")
    remaining /= 0.5
  }

  if (Math.abs(remaining - 1) > 0.0001) {
    filters.push(`atempo=${remaining.toFixed(6)}`)
  }

  if (filters.length === 0) {
    return null
  }

  return filters.join(",")
}

async function probeAudioDuration(filePath: string): Promise<number | null> {
  try {
    const output = await runCommand("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ])
    const duration = parseFloat(output.trim())
    return isFinite(duration) ? duration : null
  } catch (error) {
    console.warn("ffprobe failed while measuring audio duration:", error)
    return null
  }
}

async function runCommand(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(command, args, { encoding: "utf8" }, (error, stdout, stderr) => {
      if (error) {
        const enriched = new Error(
          `${command} ${args.join(" ")} failed: ${stderr || error.message}`
        )
        reject(enriched)
        return
      }
      resolve(stdout)
    })

    // Prevent unhandled errors
    child.on("error", reject)
  })
}

async function safeUnlink(filePath: string) {
  try {
    await fs.unlink(filePath)
  } catch {
    // ignore
  }
}
