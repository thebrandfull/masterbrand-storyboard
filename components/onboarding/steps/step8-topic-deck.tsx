"use client"

import { useState } from "react"
import { UseFormReturn } from "react-hook-form"
import { BrandFormData, BrandSuggestions } from "@/types/brand"
import { FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Plus, Trash2 } from "lucide-react"

interface StepProps {
  form: UseFormReturn<BrandFormData>
  suggestions?: BrandSuggestions | null
}

export function Step8TopicDeck({ form }: StepProps) {
  const [newTopic, setNewTopic] = useState({
    label: "",
    weight: 5,
  })

  const topics = form.watch("topics") || []

  const addTopic = () => {
    if (newTopic.label.trim()) {
      form.setValue("topics", [
        ...topics,
        {
          label: newTopic.label.trim(),
          weight: newTopic.weight,
          examples: [],
        },
      ])
      setNewTopic({ label: "", weight: 5 })
    }
  }

  const removeTopic = (index: number) => {
    form.setValue(
      "topics",
      topics.filter((_, i) => i !== index)
    )
  }

  const updateTopicWeight = (index: number, weight: number) => {
    const updated = [...topics]
    updated[index].weight = weight
    form.setValue("topics", updated)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Topic Deck</h3>
        <p className="text-white/60">Define content topics and their frequency</p>
      </div>

      {/* Add New Topic */}
      <div className="glass rounded-lg p-4 space-y-4">
        <h4 className="font-semibold">Add Topic</h4>
        <div className="flex gap-3">
          <Input
            placeholder="Topic name (e.g., Product Tips, Behind the Scenes)"
            value={newTopic.label}
            onChange={(e) => setNewTopic({ ...newTopic, label: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTopic())}
            className="glass flex-1"
          />
          <Button onClick={addTopic} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div>
          <label className="text-sm text-white/60 mb-2 block">
            Weight: {newTopic.weight}/10
          </label>
          <Slider
            value={[newTopic.weight]}
            onValueChange={([value]) => setNewTopic({ ...newTopic, weight: value })}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-white/40 mt-1">
            Higher weight = appears more frequently in generation
          </p>
        </div>
      </div>

      {/* Topic List */}
      <FormField
        control={form.control}
        name="topics"
        render={() => (
          <FormItem>
            <FormLabel>Topics ({topics.length}) *</FormLabel>
            <FormDescription>
              Add at least one topic. These will be used to generate diverse content.
            </FormDescription>
            <div className="space-y-3 mt-3">
              {topics.map((topic, index) => (
                <Card key={index} className="glass p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold">{topic.label}</h5>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTopic(index)}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-white/60 mb-1 block">
                        Weight: {topic.weight}/10
                      </label>
                      <Slider
                        value={[topic.weight]}
                        onValueChange={([value]) => updateTopicWeight(index, value)}
                        min={1}
                        max={10}
                        step={1}
                      />
                    </div>
                    <Badge variant="secondary" className="glass">
                      {topic.weight * 10}% frequency
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {topics.length === 0 && (
        <div className="glass rounded-lg p-6 text-center border border-white/10">
          <p className="text-white/60">
            No topics added yet. Add at least one topic to continue.
          </p>
        </div>
      )}

      <div className="glass rounded-lg p-4 border border-white/10">
        <p className="text-sm text-white/60">
          <strong className="text-white">Examples:</strong> "Educational (weight: 7)",
          "Behind-the-Scenes (weight: 3)", "Product Showcase (weight: 5)"
        </p>
      </div>
    </div>
  )
}
