export const WORKFLOW_STAGES = [
  { key: "idea", label: "Idea", description: "Topic selected and aligned with brand goals." },
  { key: "prompted", label: "Prompted", description: "Prompt stack prepared and reviewed." },
  { key: "generated", label: "Generated", description: "First video/script render completed." },
  { key: "enhanced", label: "Enhanced", description: "Edits, captions, and overlays polished." },
  { key: "qc", label: "QC", description: "Quality control checklist cleared." },
  { key: "scheduled", label: "Scheduled", description: "Campaign scheduled on the target platform." },
  { key: "published", label: "Published", description: "Content is live and ready for analytics." },
] as const

type StageConfig = (typeof WORKFLOW_STAGES)[number]
export type StageKey = StageConfig["key"]

export const isStageKey = (value: string | null | undefined): value is StageKey => {
  return WORKFLOW_STAGES.some((stage) => stage.key === value)
}

export const getStageMeta = (key: string | null | undefined) => {
  if (!isStageKey(key)) {
    return WORKFLOW_STAGES[0]
  }

  return WORKFLOW_STAGES.find((stage) => stage.key === key) ?? WORKFLOW_STAGES[0]
}
