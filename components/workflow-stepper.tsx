"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, ChevronRight, AlertCircle, Paperclip, X } from "lucide-react"
import { cn, getStatusColor } from "@/lib/utils"
import { updateContentItemStatus, updateContentItemDetails } from "@/lib/actions/content"
import { useToast } from "@/hooks/use-toast"

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

const WORKFLOW_STAGES = [
  { key: "idea", label: "Idea", description: "Topic selected" },
  { key: "prompted", label: "Prompted", description: "Prompts generated" },
  { key: "generated", label: "Generated", description: "Video created" },
  { key: "enhanced", label: "Enhanced", description: "Edits complete" },
  { key: "qc", label: "QC", description: "Quality checked" },
  { key: "scheduled", label: "Scheduled", description: "Ready to publish" },
  { key: "published", label: "Published", description: "Live on platform" },
]

export function WorkflowStepper({ contentItem, generations, onUpdate }: WorkflowStepperProps) {
  const [notes, setNotes] = useState(contentItem.notes || "")
  const [attachments, setAttachments] = useState<Attachment[]>(() =>
    parseAttachments(contentItem.attachments)
  )
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("")
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [isSavingAttachments, setIsSavingAttachments] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()
  const notesInitialized = useRef(false)
  const attachmentsInitialized = useRef(false)

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
  const canEditAttachments = contentItem.status === "generated" || contentItem.status === "enhanced"

  const handleAddAttachment = () => {
    if (!newAttachmentUrl.trim() || !canEditAttachments) return
    const trimmed = newAttachmentUrl.trim()

    try {
      // Validate URL shape before saving
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

  const currentStageIndex = WORKFLOW_STAGES.findIndex(
    (stage) => stage.key === contentItem.status
  )

  const handleNextStage = async () => {
    if (currentStageIndex >= WORKFLOW_STAGES.length - 1) return

    setIsUpdating(true)
    const nextStatus = WORKFLOW_STAGES[currentStageIndex + 1].key as "idea" | "prompted" | "generated" | "enhanced" | "qc" | "scheduled" | "published"

    const result = await updateContentItemStatus(contentItem.id, nextStatus)

    if (result.success) {
      toast({
        title: "Status updated",
        description: `Moved to ${WORKFLOW_STAGES[currentStageIndex + 1].label}`,
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
  }

  const handlePreviousStage = async () => {
    if (currentStageIndex <= 0) return

    setIsUpdating(true)
    const prevStatus = WORKFLOW_STAGES[currentStageIndex - 1].key as "idea" | "prompted" | "generated" | "enhanced" | "qc" | "scheduled" | "published"

    const result = await updateContentItemStatus(contentItem.id, prevStatus)

    if (result.success) {
      toast({
        title: "Status updated",
        description: `Moved back to ${WORKFLOW_STAGES[currentStageIndex - 1].label}`,
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
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="glass rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Workflow Progress</h3>
          <Badge className={getStatusColor(contentItem.status)}>
            {WORKFLOW_STAGES[currentStageIndex]?.label}
          </Badge>
        </div>

        {/* Stage Indicators */}
        <div className="relative">
          <div className="flex justify-between items-center">
            {WORKFLOW_STAGES.map((stage, index) => {
              const isComplete = index < currentStageIndex
              const isCurrent = index === currentStageIndex
              const isFuture = index > currentStageIndex

              return (
                <div key={stage.key} className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center mb-2 smooth z-10",
                      isComplete && "bg-primary text-primary-foreground",
                      isCurrent && "bg-primary/20 text-primary ring-2 ring-primary",
                      isFuture && "glass text-white/40"
                    )}
                  >
                    {isComplete ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm">{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs text-center",
                      isCurrent && "text-white font-semibold",
                      !isCurrent && "text-white/60"
                    )}
                  >
                    {stage.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Connecting Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10 -z-0" style={{ width: '90%', marginLeft: '5%' }}>
            <div
              className="h-full bg-primary smooth"
              style={{
                width: `${(currentStageIndex / (WORKFLOW_STAGES.length - 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Current Stage Details */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>{WORKFLOW_STAGES[currentStageIndex]?.label} Stage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-white/60">
            {WORKFLOW_STAGES[currentStageIndex]?.description}
          </p>

          {/* Stage-specific content */}
          {contentItem.status === "prompted" && generations && generations.length > 0 && (
            <div className="space-y-3">
              <Label>Generated Prompts</Label>
              {generations.map((gen: any, index: number) => (
                <Card key={gen.id} className="glass p-4">
                  <h4 className="font-semibold mb-2">Variation {index + 1}</h4>
                  <p className="text-sm text-white/80 mb-2">{gen.prompt_text}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {gen.tags?.map((tag: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label className="flex items-center justify-between">
                Notes
                {isSavingNotes && (
                  <span className="text-xs text-white/60">Saving...</span>
                )}
              </Label>
              <Textarea
                placeholder="Add notes, links, or instructions for this stage..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="glass mt-2"
              />
            </div>

            <div>
              <Label className="flex items-center justify-between">
                Attachments
                {isSavingAttachments && (
                  <span className="text-xs text-white/60">Saving...</span>
                )}
              </Label>
              {canEditAttachments && (
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="https://drive.google.com/..."
                    value={newAttachmentUrl}
                    onChange={(e) => setNewAttachmentUrl(e.target.value)}
                    className="glass"
                  />
                  <Button
                    type="button"
                    onClick={handleAddAttachment}
                    disabled={!newAttachmentUrl.trim()}
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              )}
              {attachments.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {attachments.map((attachment, index) => (
                    <div
                      key={`${attachment.url}-${index}`}
                      className="glass rounded-md px-3 py-2 flex items-center justify-between gap-3"
                    >
                      <div className="flex flex-col">
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary underline break-all"
                        >
                          {getAttachmentLabel(attachment, index)}
                        </a>
                        {attachment.addedAt && (
                          <span className="text-xs text-white/40">
                            Added {formatAttachmentDate(attachment.addedAt)}
                          </span>
                        )}
                      </div>
                      {canEditAttachments && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/50 mt-2">No attachments yet.</p>
              )}
            </div>
          </div>

          {blockerHistory.length > 0 && (
            <div className="glass rounded-lg p-4 border-l-4 border-destructive">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <h4 className="font-semibold text-destructive mb-1">Blocker history</h4>
                  <ul className="space-y-1 text-sm text-white/70">
                    {blockerHistory.map((entry, index) => (
                      <li key={`${entry}-${index}`}>• {entry}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="ghost"
              onClick={handlePreviousStage}
              disabled={currentStageIndex === 0 || isUpdating}
            >
              Previous Stage
            </Button>
            <Button
              onClick={handleNextStage}
              disabled={
                currentStageIndex === WORKFLOW_STAGES.length - 1 || isUpdating
              }
            >
              {isUpdating ? "Updating..." : "Next Stage"}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
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
