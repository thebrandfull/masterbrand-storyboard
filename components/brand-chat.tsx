"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { BrandSelector } from "@/components/brand-selector"
import { Loader2, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { LuminousPanel } from "@/components/ui/luminous-panel"
import type { BrandVectorInsight } from "@/lib/brand-brain"

interface BrandChatProps {
  brands: { id: string; name: string }[]
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  id?: string
  created_at?: string
  pending?: boolean
}

function getReferenceLabel(metadata?: Record<string, unknown> | null) {
  if (!metadata || typeof metadata !== "object") return ""
  const potential = (metadata as { label?: unknown }).label
  return typeof potential === "string" && potential.trim() ? potential : ""
}

export default function BrandChat({ brands }: BrandChatProps) {
  const [selectedBrandId, setSelectedBrandId] = useState(brands?.[0]?.id || "")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [references, setReferences] = useState<BrandVectorInsight[]>([])
  const { toast } = useToast()

  const loadHistory = useCallback(async (brandId: string) => {
    if (!brandId) return
    setHistoryLoading(true)
    try {
      const response = await fetch(`/api/brand-chat?brandId=${brandId}`)
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load chat history")
      }
      setMessages(data.messages || [])
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load history."
      console.error("[BrandChat] history load failed:", message)
      setMessages([])
      toast({
        variant: "destructive",
        title: "Chat history unavailable",
        description: message,
      })
    } finally {
      setHistoryLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (!selectedBrandId && brands[0]?.id) {
      setSelectedBrandId(brands[0].id)
      return
    }
    if (selectedBrandId) {
      setReferences([])
      setMessages([])
      loadHistory(selectedBrandId)
    }
  }, [selectedBrandId, brands, loadHistory])

  if (!brands?.length) {
    return (
      <LuminousPanel className="p-6">
        <p className="text-sm text-white/70">
          Add a brand first—once it exists, the Brand Brain can spin up strategy notes instantly.
        </p>
      </LuminousPanel>
    )
  }

  const sendMessage = async () => {
    if (!input.trim() || !selectedBrandId || loading) return

    const trimmed = input.trim()
    const optimisticId = `local-${Date.now()}`
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      role: "user",
      content: trimmed,
      created_at: new Date().toISOString(),
      pending: true,
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/brand-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: selectedBrandId, prompt: trimmed }),
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || "Failed to talk to brand")
      }

      if (data.fallback) {
        toast({
          title: "Fallback mode",
          description: "Using cached insights because DeepSeek is offline.",
        })
      }

      setReferences(data.insights || [])
      setMessages((prev) => {
        const updated = prev.map((msg) =>
          msg.id === optimisticId ? { ...msg, pending: false } : msg
        )
        return [
          ...updated,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.response,
            created_at: new Date().toISOString(),
          },
        ]
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to respond right now."
      toast({
        variant: "destructive",
        title: "Brand brain failed",
        description: message,
      })
      setMessages((prev) => {
        const updated = prev.map((msg) =>
          msg.id === optimisticId ? { ...msg, pending: false } : msg
        )
        return [
          ...updated,
          {
            id: `assistant-error-${Date.now()}`,
            role: "assistant",
            content: `Brand could not respond right now: ${message}`,
            created_at: new Date().toISOString(),
          },
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  return (
    <LuminousPanel className="p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <BrandSelector
            brands={brands}
            selectedBrandId={selectedBrandId}
            onBrandChange={(id) => {
              setSelectedBrandId(id)
            }}
          />
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Sparkles className="h-4 w-4 text-primary" />
            Brand Brain chat beta
          </div>
        </div>

        <div className="h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4">
          {historyLoading && (
            <div className="flex items-center justify-center py-10 text-white/60">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading chat history...
            </div>
          )}
          {!historyLoading && messages.length === 0 && (
            <p className="text-sm text-white/50">Ask your brand about strategy, prompts, or guardrails.</p>
          )}
          {messages.map((message) => (
            <div
              key={message.id || message.created_at || `${message.role}-${Math.random()}`}
              className={`p-3 rounded-lg text-sm whitespace-pre-wrap ${
                message.role === "user" ? "bg-primary/20 ml-auto max-w-[80%]" : "bg-white/5 mr-auto max-w-[85%]"
              } ${message.pending ? "opacity-70" : ""}`}
            >
              {message.content}
              {message.created_at && (
                <p className="mt-2 text-[10px] uppercase tracking-wide text-white/40">
                  {formatTimestamp(message.created_at)}
                  {message.pending ? " • sending" : ""}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Textarea
            placeholder="Ask your brand..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="rounded-2xl border border-white/10 bg-[#0f0f0f] text-white placeholder:text-white/50"
            rows={3}
          />
          <div className="flex justify-end">
            <Button onClick={sendMessage} disabled={!input.trim() || !selectedBrandId || loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Thinking...
                </>
              ) : (
                "Send"
              )}
            </Button>
          </div>
        </div>

        {references.length > 0 && (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/40">
              <span>Referenced memory</span>
              <span>{references.length} snippet{references.length === 1 ? "" : "s"}</span>
            </div>
            <div className="space-y-3">
              {references.map((ref) => {
                const label = getReferenceLabel(ref.metadata as Record<string, unknown> | null)
                return (
                  <div key={ref.id} className="rounded-lg bg-white/5 p-3 border border-white/5">
                    <p className="text-xs text-primary uppercase tracking-wide mb-1">
                      {ref.type}
                      {label ? ` • ${label}` : ""}
                    </p>
                  <p className="text-sm text-white/80 whitespace-pre-wrap">
                    {ref.content.length > 320 ? `${ref.content.slice(0, 317)}…` : ref.content}
                  </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </LuminousPanel>
  )
}

function formatTimestamp(timestamp?: string) {
  if (!timestamp) return ""
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}
