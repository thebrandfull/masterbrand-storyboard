const API_BASE = "https://api.kie.ai/api/v1"

export type KieAspectRatio = "portrait" | "landscape"
export type KieFrameCount = "10" | "15"

export interface CreateSoraTaskInput {
  prompt: string
  aspectRatio?: KieAspectRatio
  nFrames?: KieFrameCount
  removeWatermark?: boolean
  callBackUrl?: string
}

export interface KieTaskResponse {
  code: number
  message: string
  data: {
    taskId: string
  }
}

export interface KieTaskStatus {
  taskId: string
  model: string
  state: "waiting" | "queuing" | "generating" | "success" | "fail"
  param: string
  resultJson?: string
  failCode?: string
  failMsg?: string
  completeTime?: number
  createTime: number
  updateTime: number
  consumeCredits?: number
  costTime?: number
  remainedCredits?: number
}

export interface KieTaskQueryResponse {
  code: number
  message: string
  data: KieTaskStatus
}

export interface KieResultUrls {
  resultUrls: string[]
  resultWaterMarkUrls?: string[]
}

function getApiKey() {
  const key = process.env.KEIAI_API_KEY
  if (!key) {
    throw new Error("KEIAI_API_KEY is not configured")
  }
  return key
}

async function kieFetch(path: string, init?: RequestInit) {
  const key = getApiKey()
  const headers = new Headers(init?.headers)
  headers.set("Authorization", `Bearer ${key}`)
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const detail = await safeParseError(response)
    throw new Error(detail ?? `Kie.ai request failed with ${response.status}`)
  }

  return response
}

async function safeParseError(response: Response) {
  try {
    const data = await response.json()
    return data?.message || data?.msg || response.statusText
  } catch {
    return null
  }
}

export async function createSoraTask({
  prompt,
  aspectRatio = "landscape",
  nFrames = "10",
  removeWatermark = true,
  callBackUrl,
}: CreateSoraTaskInput): Promise<string> {
  const body = {
    model: "sora-2-text-to-video",
    ...(callBackUrl && { callBackUrl }),
    input: {
      prompt,
      aspect_ratio: aspectRatio,
      n_frames: nFrames,
      remove_watermark: removeWatermark,
    },
  }

  const response = await kieFetch("/jobs/createTask", {
    method: "POST",
    body: JSON.stringify(body),
  })

  const result: KieTaskResponse = await response.json()

  if (result.code !== 200 || !result.data?.taskId) {
    throw new Error(result.message || "Failed to create Sora task")
  }

  return result.data.taskId
}

export async function queryTaskStatus(taskId: string): Promise<KieTaskStatus> {
  const response = await kieFetch(`/jobs/recordInfo?taskId=${taskId}`, {
    method: "GET",
  })

  const result: KieTaskQueryResponse = await response.json()

  if (result.code !== 200 || !result.data) {
    throw new Error(result.message || "Failed to query task status")
  }

  return result.data
}

export async function waitForTaskCompletion(
  taskId: string,
  maxAttempts: number = 60,
  intervalMs: number = 5000
): Promise<KieTaskStatus> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await queryTaskStatus(taskId)

    if (status.state === "success" || status.state === "fail") {
      return status
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error(`Task ${taskId} did not complete within timeout period`)
}

export function parseResultUrls(resultJson?: string): KieResultUrls | null {
  if (!resultJson) return null

  try {
    const parsed = JSON.parse(resultJson)
    return {
      resultUrls: parsed.resultUrls || [],
      resultWaterMarkUrls: parsed.resultWaterMarkUrls,
    }
  } catch {
    return null
  }
}
