export interface Topic {
  id: string
  label: string
  weight: number
  brand_id?: string
  examples?: string[] | null
  min_frequency?: number | null
  max_frequency?: number | null
}

export function selectTopicByWeight(topics: Topic[]): Topic | null {
  if (topics.length === 0) return null

  // Calculate total weight
  const totalWeight = topics.reduce((sum, topic) => sum + (topic.weight || 1), 0)

  // Random selection based on weight
  let random = Math.random() * totalWeight

  for (const topic of topics) {
    random -= (topic.weight || 1)
    if (random <= 0) {
      return topic
    }
  }

  return topics[0] // Fallback
}

export function getTopicVariety(
  topics: Topic[],
  count: number,
  recentTopics: string[] = []
): Topic[] {
  const selected: Topic[] = []
  const available = topics.filter(t => !recentTopics.includes(t.id))

  if (available.length === 0) {
    // If all topics were recently used, reset
    return getTopicVariety(topics, count, [])
  }

  for (let i = 0; i < count && available.length > 0; i++) {
    const topic = selectTopicByWeight(available)
    if (topic) {
      selected.push(topic)
      // Remove selected topic from available pool
      const index = available.findIndex(t => t.id === topic.id)
      if (index > -1) {
        available.splice(index, 1)
      }
    }
  }

  return selected
}
