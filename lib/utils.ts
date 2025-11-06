import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    idea: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    prompted: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    generated: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    enhanced: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    qc: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    scheduled: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    published: 'bg-green-500/20 text-green-300 border-green-500/30',
  }
  return colors[status] || colors.idea
}
