import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Competition, Round, CompetitionStatus, RoundStatus } from "@/data/competitions"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type EventStatus = 'Draft' | 'Upcoming' | 'RegistrationOpen' | 'RegistrationClosed' | 'InProgress' | 'Completed' | 'ResultsPublished' | 'Cancelled'
export type { CompetitionStatus, RoundStatus } from "@/data/competitions"

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

export function getRoundStatus(round: Round): RoundStatus {
  const now = Date.now()
  const regOpen = new Date(round.registrationOpenAt).getTime()
  const regClose = new Date(round.registrationCloseAt).getTime()

  if (round.cancelledReason_zh || round.cancelledReason_en) return 'Cancelled'

  const allSessions = round.stages.flatMap(s => s.sessions)
  const firstStart = allSessions.length > 0 ? Math.min(...allSessions.map(s => new Date(s.startsAt).getTime())) : Infinity
  const lastEnd = allSessions.length > 0 ? Math.max(...allSessions.map(s => new Date(s.endsAt).getTime())) : -Infinity
  const anyLive = allSessions.some(s => {
    const st = new Date(s.startsAt).getTime()
    const en = new Date(s.endsAt).getTime()
    return now >= st && now < en
  })

  const allSplits = round.stages.flatMap(s => s.sessions).flatMap(se => se.splits)
  const hasPublishedResults = allSplits.some(sp => sp.resultsPublishedAt)
  const hasUnpublishedResults = allSplits.some(sp =>
    sp.results && sp.results.length > 0 && !sp.resultsPublishedAt
  )

  if (now < regOpen) return 'Upcoming'
  if (now >= regOpen && now < regClose) return 'RegistrationOpen'
  if (anyLive) return 'InProgress'
  if (now >= lastEnd && lastEnd > 0) {
    if (hasPublishedResults && !hasUnpublishedResults) return 'ResultsPublished'
    return 'Completed'
  }
  if (now >= regClose && now < firstStart) return 'RegistrationClosed'
  return 'Upcoming'
}

export function getCompetitionStatus(comp: Competition): CompetitionStatus {
  if (comp.statusOverride) return comp.statusOverride
  if (comp.rounds.length === 0) return 'Draft'

  const statuses = comp.rounds.map(getRoundStatus)

  if (statuses.some(s => s === 'InProgress')) return 'InProgress'
  if (statuses.some(s => s === 'RegistrationOpen')) return 'RegistrationOpen'
  if (statuses.some(s => s === 'Cancelled') && statuses.every(s => s === 'Cancelled')) return 'Cancelled'
  if (statuses.every(s => s === 'ResultsPublished' || s === 'Completed')) return 'Completed'
  if (statuses.some(s => s === 'Completed' || s === 'ResultsPublished')) return 'InProgress'
  if (statuses.every(s => s === 'Upcoming' || s === 'RegistrationClosed')) return 'Upcoming'
  if (statuses.some(s => s === 'RegistrationClosed')) return 'RegistrationClosed'
  return 'Draft'
}
