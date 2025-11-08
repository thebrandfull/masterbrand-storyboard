"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Check, ChevronLeft, ChevronRight, Paperclip, PlayCircle, X } from "lucide-react"
import { cn, getStatusColor } from "@/lib/utils"
import { updateContentItemStatus, updateContentItemDetails } from "@/lib/actions/content"
import { useToast } from "@/hooks/use-toast"
import { WORKFLOW_STAGES, StageKey, isStageKey } from "@/lib/constants/workflow"

interface WorkflowStepperProps {
  contentItem: any
  generations?: any[]
  onUpdate: () => void
}

type Attachment = {
  url: string
  label?: string
  addedAt?: string
}

const stageIndex = (key: StageKey) =>
  WORKFLOW_STAGES.findIndex((stage) => stage.key === key)

export function WorkflowStepper({ contentItem, generations, onUpdate }: WorkflowStepperProps) {
  const sanitizedStatus: StageKey = isStageKey(contentItem.status)
    ? (contentItem.status as StageKey)
    : WORKFLOW_STAGES[0].key

  const [notes, setNotes] = useState(contentItem.notes || "")
  const [attachments, setAttachments] = useState<Attachment[]>(() =>
    parseAttachments(contentItem.attachments)
  )
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("")
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [isSavingAttachments, setIsSavingAttachments] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [activeStageKey, setActiveStageKey] = useState<StageKey>(sanitizedStatus)

  const { toast } = useToast()
  const notesInitialized = useRef(false)
  const attachmentsInitialized = useRef(false)

  useEffect(() => {
    if (isStageKey(contentItem.status)) {
      setActiveStageKey(contentItem.status as StageKey)
    }
  }, [contentItem.status])

  const emitContentUpdate = useCallback(() => {
    if (typeof window === "undefined") return
    window.dispatchEvent(
      new CustomEvent("content-items-updated", {
        detail: { brandId: contentItem.brand_id },
      })
    )
  }, [contentItem.brand_id])

  const persistDetails = useCallback(
    async (payload: { notes?: string; attachments?: Attachment[] }) => {
      const result = await updateContentItemDetails(contentItem.id, payload)

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Save failed",
          description: result.error || "Unable to save content details",
        })
        return false
      }

      emitContentUpdate()
      return true
    },
    [contentItem.id, emitContentUpdate, toast]
  )

  useEffect(() => {
    if (!notesInitialized.current) {
      notesInitialized.current = true
      return
    }
    let cancelled = false
    setIsSavingNotes(true)
    const timeout = setTimeout(() => {
      persistDetails({ notes }).finally(() => {
        if (!cancelled) {
          setIsSavingNotes(false)
        }
      })
    }, 600)

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [notes, persistDetails])

  useEffect(() => {
    if (!attachmentsInitialized.current) {
      attachmentsInitialized.current = true
      return
    }
    let cancelled = false
    setIsSavingAttachments(true)
    persistDetails({ attachments }).finally(() => {
      if (!cancelled) {
        setIsSavingAttachments(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [attachments, persistDetails])

  const blockerHistory = useMemo(
    () => parseBlockerHistory(contentItem.blocker_reason),
    [contentItem.blocker_reason]
  )

  const currentStageIndex = Math.max(0, stageIndex(sanitizedStatus))
  const activeStageIndex = Math.max(0, stageIndex(activeStageKey))
  const currentStage = WORKFLOW_STAGES[currentStageIndex]
  const activeStage = WORKFLOW_STAGES[activeStageIndex]

  const canEditAttachments = sanitizedStatus === "generated" || sanitizedStatus === "enhanced"
  const canAdvance = currentStageIndex < WORKFLOW_STAGES.length - 1
  const nextStageLabel = WORKFLOW_STAGES[currentStageIndex + 1]?.label ?? "Finalized"
  const prevStageLabel = WORKFLOW_STAGES[currentStageIndex - 1]?.label ?? "Start"

  const handleAddAttachment = () => {
    if (!newAttachmentUrl.trim() || !canEditAttachments) return
    const trimmed = newAttachmentUrl.trim()

    try {
      new URL(trimmed)
    } catch {
      toast({
        variant: "destructive",
        title: "Invalid attachment URL",
        description: "Please enter a valid link (including https://).",
      })
      return
    }

    setAttachments((prev) => [
      ...prev,
      { url: trimmed, addedAt: new Date().toISOString() },
    ])
    setNewAttachmentUrl("")
  }

  const handleRemoveAttachment = (index: number) => {
    if (!canEditAttachments) return
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const attemptStatusChange = useCallback(
    async (targetIndex: number) => {
      if (targetIndex === currentStageIndex) return
      if (targetIndex < 0 || targetIndex >= WORKFLOW_STAGES.length) return

      setIsUpdating(true)
      const targetStage = WORKFLOW_STAGES[targetIndex]
      const direction = targetIndex > currentStageIndex ? "Moved to" : "Reverted to"

      const result = await updateContentItemStatus(contentItem.id, targetStage.key)

      if (result.success) {
        toast({
          title: "Status updated",
          description: `${direction} ${targetStage.label}`,
        })
        emitContentUpdate()
        onUpdate()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update status",
        })
      }

      setIsUpdating(false)
    },
    [contentItem.id, currentStageIndex, emitContentUpdate, onUpdate, toast]
  )

  const handleNextStage = () => {
    if (!canAdvance || isUpdating) return
    attemptStatusChange(currentStageIndex + 1)
  }

  const handlePreviousStage = () => {
    if (currentStageIndex === 0 || isUpdating) return
    attemptStatusChange(currentStageIndex - 1)
  }

  const handleJumpToStage = () => {
    if (isUpdating || activeStageIndex === currentStageIndex) return
    attemptStatusChange(activeStageIndex)
  }

  return (
    <div className="glass p-6 sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(260px,320px)_1fr]">
        <div className="space-y-6">
          <div className="glass p-5">
            <div className="flex items-center gap-3 text-sm text-[color:var(--muted)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--accent)]/15 text-[color:var(--accent)]">
                <PlayCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em]">Pipeline</p>
                <p className="text-base font-medium text-[color:var(--text)]">{currentStage.label} stage in progress</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-[color:var(--muted)]">
              Preview any stage, line up notes, and fast-forward the project the moment it is ready.
            </p>
          </div>

          <div className="space-y-4">
            {WORKFLOW_STAGES.map((stage, index) => {
              const isComplete = index < currentStageIndex
              const isCurrent = stage.key === sanitizedStatus
              const isActive = stage.key === activeStageKey

              return (
                <div key={stage.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-sm font-semibold transition",
                        isComplete && "bg-[color:var(--accent)] text-white border-transparent",
                        isCurrent && !isComplete && "border-[color:var(--accent)] text-[color:var(--accent)]",
                        !isComplete && !isCurrent && "text-[color:var(--muted)]"
                      )}
                    >
                      {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                    </span>
                    {index < WORKFLOW_STAGES.length - 1 && (
                      <span
                        className={cn(
                          "mt-2 h-full w-px flex-1",
                          isComplete ? "bg-[color:var(--accent)]" : "bg-white/10"
                        )}
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveStageKey(stage.key)}
                    className={cn(
                      "flex-1 rounded-lg border border-white/10 px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/60",
                      isActive ? "bg-white/10" : "hover:bg-white/5",
                      isCurrent && "ring-1 ring-[color:var(--accent)]/70"
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-[color:var(--text)]">{stage.label}</p>
                      {isCurrent && (
                        <Badge className="border-0 bg-[color:var(--accent)] text-white">Live</Badge>
                      )}
                      {!isCurrent && isComplete && (
                        <Badge variant="outline" className="border-white/15 text-[color:var(--text)]/80">
                          Done
                        </Badge>
                      )}
                      {!isCurrent && isActive && (
                        <Badge className="border-0 bg-white/10 text-[color:var(--text)]/70">Preview</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">{stage.description}</p>
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--muted)]">Stage in focus</p>
                <h3 className="mt-2 text-2xl font-semibold text-[color:var(--text)]">{activeStage.label}</h3>
                <p className="text-sm text-[color:var(--muted)]">{activeStage.description}</p>
              </div>
              <Badge className={cn("border text-xs", getStatusColor(sanitizedStatus))}>
                {currentStage.label}
              </Badge>
            </div>

            {activeStageKey !== sanitizedStatus && (
              <div className="mt-5 glass p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--text)]">
                      Previewing {activeStage.label}
                    </p>
                    <p className="text-xs text-[color:var(--muted)]">
                      Line up assets ahead of time and push when everything feels ready.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleJumpToStage}
                    disabled={isUpdating}
                    className="bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent)]/90"
                  >
                    {isUpdating ? "Updating..." : `Move to ${activeStage.label}`}
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-5">
              <div className="glass p-4">
                <Label className="flex items-center justify-between text-[color:var(--text)]/90">
                  Notes
                  {isSavingNotes && <span className="text-xs text-[color:var(--muted)]">Saving...</span>}
                </Label>
                <Textarea
                  placeholder="Add notes, links, or instructions for this stage..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-3 min-h-[120px] border-white/10 bg-transparent text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus-visible:ring-[color:var(--accent)]/60"
                />
              </div>

              <div className="glass p-4">
                <Label className="flex items-center justify-between text-[color:var(--text)]/90">
                  Attachments
                  {isSavingAttachments && (
                    <span className="text-xs text-[color:var(--muted)]">Saving...</span>
                  )}
                </Label>
                {canEditAttachments && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="https://drive.google.com/..."
                      value={newAttachmentUrl}
                      onChange={(e) => setNewAttachmentUrl(e.target.value)}
                      className="border-white/10 bg-transparent text-[color:var(--text)] placeholder:text-[color:var(--muted)]"
                    />
                    <Button
                      type="button"
                      onClick={handleAddAttachment}
                      disabled={!newAttachmentUrl.trim()}
                      className="bg-[color:var(--accent)]/20 text-[color:var(--text)] hover:bg-[color:var(--accent)]/30"
                    >
                      <Paperclip className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                )}
                {attachments.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {attachments.map((attachment, index) => (
                      <div
                        key={`${attachment.url}-${index}`}
                        className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <div>
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-[color:var(--accent)] underline-offset-2 hover:underline"
                          >
                            {getAttachmentLabel(attachment, index)}
                          </a>
                          {attachment.addedAt && (
                            <p className="text-xs text-[color:var(--muted)]">
                              Added {formatAttachmentDate(attachment.addedAt)}
                            </p>
                          )}
                        </div>
                        {canEditAttachments && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveAttachment(index)}
                            className="text-[color:var(--muted)] hover:text-[color:var(--text)]"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-[color:var(--muted)]">No attachments yet.</p>
                )}
              </div>

              {generations && generations.length > 0 && (
                <div className="glass p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--text)]">Prompt playlist</p>
                      <p className="text-xs text-[color:var(--muted)]">Variations generated for this content item</p>
                    </div>
                    <Badge className="border-0 bg-white/10 text-[color:var(--text)]/80">
                      {generations.length} takes
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {generations.map((gen: any, index: number) => (
                      <div
                        key={gen.id}
                        className="rounded-lg border border-white/10 bg-white/5 p-4"
                      >
                        <p className="text-xs uppercase text-[color:var(--muted)]">Variation {index + 1}</p>
                        <p className="mt-2 text-sm text-[color:var(--text)]/90">{gen.prompt_text}</p>
                        {gen.tags?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {gen.tags.map((tag: string, i: number) => (
                              <Badge key={`${gen.id}-${tag}-${i}`} variant="outline" className="border-white/15 text-[color:var(--text)]/80">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {blockerHistory.length > 0 && (
                <div className="rounded-lg border border-[color:var(--accent)]/30 bg-[color:var(--accent)]/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-[color:var(--accent)]" />
                    <div>
                      <p className="font-semibold text-[color:var(--text)]">Blocker history</p>
                      <ul className="mt-2 space-y-1 text-sm text-[color:var(--muted)]">
                        {blockerHistory.map((entry, index) => (
                          <li key={`${entry}-${index}`}>• {entry}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <Button
                variant="outline"
                onClick={handlePreviousStage}
                disabled={currentStageIndex === 0 || isUpdating}
                className="border-white/15 text-[color:var(--muted)] hover:bg-white/10"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                {prevStageLabel}
              </Button>
              <Button
                onClick={handleNextStage}
                disabled={!canAdvance || isUpdating}
                className="bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent)]/90"
              >
                {isUpdating ? "Updating..." : `Advance to ${nextStageLabel}`}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function parseAttachments(raw: any): Attachment[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw
      .filter((item) => item && typeof item === "object" && typeof item.url === "string")
      .map((item) => ({
        url: String(item.url),
        label: typeof item.label === "string" ? item.label : undefined,
        addedAt: (item.addedAt || item.added_at) as string | undefined,
      }))
  }
  return []
}

function parseBlockerHistory(raw: string | null): string[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) => {
          if (typeof entry === "string") return entry
          if (entry && typeof entry === "object" && typeof entry.message === "string") {
            return entry.message
          }
          return null
        })
        .filter((entry): entry is string => Boolean(entry))
    }
  } catch {
    // Ignore parse failures and fall back to plain text
  }

  return raw
    .split(/\n|•/g)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function getAttachmentLabel(attachment: Attachment, index: number) {
  if (attachment.label) return attachment.label
  try {
    const url = new URL(attachment.url)
    return url.hostname.replace(/^www\./, "")
  } catch {
    return `Attachment ${index + 1}`
  }
}

function formatAttachmentDate(iso?: string) {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}
