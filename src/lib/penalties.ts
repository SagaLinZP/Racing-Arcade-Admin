import type { Competition, Stage } from '@/data/competitions'
import { updateCompetition } from '@/data/competitions'
import { addAuditLog } from '@/data/admin'
import { getPointsForPosition } from './results'
import type { ScoringTableEntry } from './utils'

export type PenaltyKind = 'warning' | 'time' | 'position' | 'points' | 'dsq'

export type PenaltyAction =
  | { kind: 'warning' }
  | { kind: 'time'; seconds: number }
  | { kind: 'position'; positions: number }
  | { kind: 'points'; points: number }
  | { kind: 'dsq' }

export interface PenaltyChange {
  driverId: string
  field: string
  oldValue: string
  newValue: string
}

function parseTimeToSec(t?: string): number | undefined {
  if (!t) return undefined
  const parts = t.split(':')
  if (parts.length === 3) return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + parseFloat(parts[2])
  if (parts.length === 2) return Number(parts[0]) * 60 + parseFloat(parts[1])
  const n = parseFloat(t)
  return Number.isNaN(n) ? undefined : n
}

function secToDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = Math.floor(totalSeconds % 60)
  const ms = Math.round((totalSeconds % 1) * 1000)
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
    : `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
}

export function applyPenalty(
  stage: Stage,
  sessionId: string | undefined,
  driverId: string,
  action: PenaltyAction,
  scoringTable?: ScoringTableEntry[],
): PenaltyChange[] {
  const changes: PenaltyChange[] = []

  for (const split of stage.splits) {
    if (!split.results) continue
    const sessionResults = split.results.filter(r => !sessionId || r.sessionId === sessionId)
    const target = sessionResults.find(r => r.driverId === driverId)
    if (!target) continue

    if (action.kind === 'warning') {
      const old = target.penalty ?? ''
      target.penalty = old ? `${old}; Warning` : 'Warning'
      changes.push({ driverId, field: 'penalty', oldValue: old, newValue: target.penalty })
    } else if (action.kind === 'dsq') {
      changes.push({ driverId, field: 'status', oldValue: target.status, newValue: 'DSQ' })
      changes.push({ driverId, field: 'points', oldValue: String(target.points ?? 0), newValue: '0' })
      target.status = 'DSQ'
      target.points = 0
    } else if (action.kind === 'points') {
      const old = target.points ?? 0
      target.points = Math.max(0, old - action.points)
      changes.push({ driverId, field: 'points', oldValue: String(old), newValue: String(target.points) })
    } else if (action.kind === 'position') {
      const oldPos = target.position
      const newPos = oldPos + action.positions
      sessionResults.forEach(r => {
        if (r.driverId !== driverId && r.position > oldPos && r.position <= newPos) {
          r.position -= 1
        }
      })
      target.position = newPos
      const oldPenalty = target.penalty ?? ''
      target.penalty = oldPenalty ? `${oldPenalty}; +${action.positions} pos` : `+${action.positions} pos`
      if (scoringTable) {
        sessionResults.forEach(r => {
          if (r.status !== 'DSQ') r.points = getPointsForPosition(scoringTable, r.position)
        })
      }
      changes.push({ driverId, field: 'position', oldValue: String(oldPos), newValue: String(newPos) })
    } else if (action.kind === 'time') {
      const oldPos = target.position
      const adjusted = new Map<string, number>()
      sessionResults.forEach(r => {
        const base = parseTimeToSec(r.totalTime)
        if (base != null) adjusted.set(r.driverId, base + (r.driverId === driverId ? action.seconds : 0))
      })
      const finishers = sessionResults
        .filter(r => adjusted.has(r.driverId))
        .sort((a, b) => adjusted.get(a.driverId)! - adjusted.get(b.driverId)!)
      finishers.forEach((r, i) => {
        r.position = i + 1
      })
      const targetAdjusted = adjusted.get(driverId)
      if (targetAdjusted != null) target.totalTime = secToDuration(targetAdjusted)
      const leaderTime = finishers.length > 0 ? adjusted.get(finishers[0].driverId)! : undefined
      finishers.forEach(r => {
        const at = adjusted.get(r.driverId)!
        r.gapToLeader = r.position === 1 ? '-' : leaderTime != null ? `+${(at - leaderTime).toFixed(3)}` : r.gapToLeader
      })
      const oldPenalty = target.penalty ?? ''
      target.penalty = oldPenalty ? `${oldPenalty}; +${action.seconds}s` : `+${action.seconds}s`
      if (scoringTable) {
        finishers.forEach(r => {
          if (r.status !== 'DSQ') r.points = getPointsForPosition(scoringTable, r.position)
        })
      }
      changes.push({ driverId, field: 'position', oldValue: String(oldPos), newValue: String(target.position) })
      changes.push({ driverId, field: 'penalty', oldValue: oldPenalty, newValue: target.penalty })
    }
    break
  }

  return changes
}

export interface PenaltyApplication {
  stage: Stage
  competition: Competition
  sessionId?: string
  driverId: string
  action: PenaltyAction
  reason: string
  reviewedBy?: string
  protestId?: string
  scoringTable?: ScoringTableEntry[]
}

/** Apply a penalty, write one audit log per resulting change, and persist the competition. */
export function applyPenaltyWithAudit(app: PenaltyApplication): PenaltyChange[] {
  const changes = applyPenalty(app.stage, app.sessionId, app.driverId, app.action, app.scoringTable)
  if (changes.length === 0) return changes
  const now = new Date().toISOString()
  changes.forEach((ch, i) => {
    addAuditLog({
      id: `al_${app.stage.id}_${app.driverId}_${ch.field}_${Date.now()}_${i}`,
      competitionId: app.competition.id,
      stageId: app.stage.id,
      sessionId: app.sessionId,
      driverId: ch.driverId,
      field: ch.field,
      oldValue: ch.oldValue,
      newValue: ch.newValue,
      changedBy: app.reviewedBy ?? 'admin1',
      changedAt: now,
      reason: app.reason,
      protestId: app.protestId,
    })
  })
  updateCompetition(app.competition)
  return changes
}
