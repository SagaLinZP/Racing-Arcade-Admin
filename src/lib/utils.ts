import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Competition, Round, CompetitionStatus, RoundStatus } from "@/data/competitions"
import { isStageLocked } from "./results"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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
    case 'ResultsLocked': return 'bg-emerald-100 text-emerald-700'
    case 'Archived': return 'bg-slate-200 text-slate-600'
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

export function getRoundStatus(round: Round, comp?: Competition): RoundStatus {
  const now = Date.now()
  const regOpen = new Date(round.registrationOpenAt).getTime()
  const regClose = new Date(round.registrationCloseAt).getTime()

  if (round.cancelledReason_zh || round.cancelledReason_en) return 'Cancelled'

  const allStages = round.stages
  const startAt = (s: typeof allStages[number]) => new Date(s.startsAt).getTime()
  const startedStages = allStages.filter(s => now >= startAt(s))
  const anyLive = allStages.some(s => now >= startAt(s) && now < new Date(s.endsAt).getTime())

  // 比赛/成绩阶段：跟随最新（已开赛）Stage 的状态（不受报名人工覆盖影响）
  if (anyLive) return 'InProgress'
  if (startedStages.length > 0) {
    const current = startedStages.reduce((a, b) => (startAt(b) >= startAt(a) ? b : a))
    // 还有更靠后、尚未开赛的 Stage → 站间，赛事仍在进行中
    const hasLaterNotStarted = allStages.some(s => startAt(s) > startAt(current))
    if (hasLaterNotStarted) return 'InProgress'
    return isStageLocked(current, comp) ? 'ResultsLocked' : 'Completed'
  }

  // 报名阶段：人工覆盖优先于时间
  const forced = round.registrationOverride
  if (forced === 'forceClosed') return 'RegistrationClosed'
  if (forced === 'forceOpen') return 'RegistrationOpen'
  const firstStart = allStages.length > 0 ? Math.min(...allStages.map(startAt)) : Infinity
  if (now < regOpen) return 'Upcoming'
  if (now >= regOpen && now < regClose) return 'RegistrationOpen'
  if (now >= regClose && now < firstStart) return 'RegistrationClosed'
  return 'Upcoming'
}

// Competition 状态 = 当前站（按顺序第一个未进入终态的 Round）的状态；全部终结取最后一站。
export function getCompetitionStatus(comp: Competition): CompetitionStatus {
  if (comp.statusOverride) return comp.statusOverride
  if (comp.rounds.length === 0) return 'Draft'

  const isTerminal = (s: RoundStatus) => s === 'Completed' || s === 'ResultsLocked' || s === 'Cancelled'
  const statuses = comp.rounds.map(r => getRoundStatus(r, comp))
  let idx = statuses.findIndex(s => !isTerminal(s))
  if (idx === -1) idx = statuses.length - 1
  const cur = statuses[idx]
  // Competition 层不单列 ResultsLocked，统一显示 Completed
  return (cur === 'ResultsLocked' ? 'Completed' : cur) as CompetitionStatus
}
