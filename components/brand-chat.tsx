"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { BrandSelector } from "@/components/brand-selector"
import { Loader2, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { BrandVectorInsight } from "@/lib/brand-brain"

interface BrandChatProps {
  brands: { id: string; name: string }[]
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
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
  const [references, setReferences] = useState<BrandVectorInsight[]>([])
  const { toast } = useToast()

  if (!brands?.length) {
    return (
      <Card className="glass p-6">
        <p className="text-sm text-white/70">
          Add a brand first—once it exists, the Brand Brain can spin up strategy notes instantly.
        </p>
      </Card>
    )
  }

  const sendMessage = async () => {
    if (!input.trim() || !selectedBrandId) return

    const newMessage: ChatMessage = { role: "user", content: input.trim() }
    const nextMessages = [...messages, newMessage]
    setMessages(nextMessages)
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/brand-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: selectedBrandId, history: messages, prompt: newMessage.content }),
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
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }])
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to respond right now."
      toast({
        variant: "destructive",
        title: "Brand brain failed",
        description: message,
      })
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Brand could not respond right now: ${message}` },
      ])
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
    <Card className="glass p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <BrandSelector
            brands={brands}
            selectedBrandId={selectedBrandId}
            onBrandChange={(id) => {
              setSelectedBrandId(id)
              setMessages([])
              setReferences([])
            }}
          />
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Sparkles className="h-4 w-4 text-primary" />
            Brand Brain chat beta
          </div>
        </div>

        <div className="glass rounded-xl p-4 h-[420px] overflow-y-auto space-y-3">
          {messages.length === 0 && (
            <p className="text-sm text-white/50">Ask your brand about strategy, prompts, or guardrails.</p>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg text-sm whitespace-pre-wrap ${
                message.role === "user" ? "bg-primary/20 ml-auto max-w-[80%]" : "bg-white/5 mr-auto max-w-[85%]"
              }`}
            >
              {message.content}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Textarea
            placeholder="Ask your brand..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="glass"
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
          <div className="glass rounded-xl p-4 border border-white/10 space-y-3">
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
    </Card>
  )
}
