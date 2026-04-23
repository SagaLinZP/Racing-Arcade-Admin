import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type EventStatus = 'Draft' | 'Upcoming' | 'RegistrationOpen' | 'RegistrationClosed' | 'InProgress' | 'Completed' | 'ResultsPublished' | 'Cancelled'

export function formatDate(date: string | Date, locale: string = 'en') {
  const d = new Date(date)
  return d.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date, locale: string = 'en') {
  const d = new Date(date)
  return d.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export type Region = 'CN' | 'AP' | 'AM' | 'EU'

export interface ScoringTableEntry {
  position: number
  points: number
  note_zh?: string
  note_en?: string
}

export function statusColor(status: string): string {
  switch (status) {
    case 'Draft': return 'bg-gray-100 text-gray-700'
    case 'Upcoming': return 'bg-blue-100 text-blue-700'
    case 'RegistrationOpen': return 'bg-green-100 text-green-700'
    case 'RegistrationClosed': return 'bg-yellow-100 text-yellow-700'
    case 'InProgress': return 'bg-orange-100 text-orange-700'
    case 'Completed': return 'bg-purple-100 text-purple-700'
    case 'ResultsPublished': return 'bg-emerald-100 text-emerald-700'
    case 'Cancelled': return 'bg-red-100 text-red-700'
    case 'pending': return 'bg-yellow-100 text-yellow-700'
    case 'reviewing': return 'bg-blue-100 text-blue-700'
    case 'resolved': return 'bg-green-100 text-green-700'
    case 'dismissed': return 'bg-gray-100 text-gray-700'
    case 'active': return 'bg-green-100 text-green-700'
    case 'upcoming': return 'bg-blue-100 text-blue-700'
    case 'completed': return 'bg-purple-100 text-purple-700'
    case 'banned': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}
