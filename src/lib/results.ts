import { competitions } from '@/data/competitions'
import type { Competition, Round, Stage } from '@/data/competitions'
import type { ScoringTableEntry } from './utils'

export interface StageContext {
  competition: Competition
  round: Round
  stage: Stage
}

export function findStageById(stageId: string): StageContext | null {
  for (const competition of competitions) {
    for (const round of competition.rounds) {
      for (const stage of round.stages) {
        if (stage.id === stageId) {
          return { competition, round, stage }
        }
      }
    }
  }
  return null
}

export function getPointsForPosition(
  scoringTable: ScoringTableEntry[] | undefined,
  position: number,
): number {
  if (!scoringTable || scoringTable.length === 0) return 0
  const entry = scoringTable.find(e => e.position === position)
  return entry?.points ?? 0
}

/** pending = 无成绩；showing = 公示中（可改/可申诉）；locked = 已锁定（冻结、计分） */
export type StageResultStatus = 'pending' | 'showing' | 'locked'

const LOCK_WINDOW_DEFAULT_HOURS = 24

/** 计划锁定时间（毫秒）：Stage.resultsLockAt 优先，否则 = Stage 结束 + 锁定窗口。 */
export function getStageLockAt(stage: Stage, comp?: Competition): number {
  if (stage.resultsLockAt) return new Date(stage.resultsLockAt).getTime()
  const windowH = comp?.resultLockWindowHours ?? LOCK_WINDOW_DEFAULT_HOURS
  return new Date(stage.endsAt).getTime() + windowH * 3_600_000
}

/** 锁定 = 任一 Split 有 resultsLockedAt（手动/提前锁定），或已到计划锁定时间（自动锁定）。 */
export function isStageLocked(stage: Stage, comp?: Competition): boolean {
  const hasResults = stage.splits.some(s => s.results && s.results.length > 0)
  if (!hasResults) return false
  if (stage.splits.some(s => s.resultsLockedAt)) return true
  return Date.now() >= getStageLockAt(stage, comp)
}

export function getStageResultStatus(stage: Stage, comp?: Competition): StageResultStatus {
  const hasResults = stage.splits.some(s => s.results && s.results.length > 0)
  if (!hasResults) return 'pending'
  return isStageLocked(stage, comp) ? 'locked' : 'showing'
}

export function getRaceSessionId(stage: Stage): string | undefined {
  return stage.sessions.find(s => s.type === 'race')?.id
}

export function getSessionResultStatus(stage: Stage, sessionId: string, comp?: Competition): StageResultStatus {
  const has = stage.splits.some(sp => (sp.results ?? []).some(r => r.sessionId === sessionId))
  if (!has) return 'pending'
  return isStageLocked(stage, comp) ? 'locked' : 'showing'
}

export function getSessionResultCount(stage: Stage, sessionId: string): number {
  let count = 0
  for (const sp of stage.splits) {
    count += (sp.results ?? []).filter(r => r.sessionId === sessionId).length
  }
  return count
}

export interface StandingResultEntry {
  stageId: string
  roundId: string
  position: number
  points: number
  bestLap?: string
}

export interface DriverStanding {
  driverId: string
  teamId?: string
  totalPoints: number
  wins: number
  podiums: number
  entries: number
  bestPosition: number
  results: StandingResultEntry[]
}

function collectResultsFromStages(stages: Stage[], comp: Competition | undefined, sessionId?: string): DriverStanding[] {
  const map = new Map<string, DriverStanding>()
  for (const stage of stages) {
    if (stage.awardsPoints === false) continue
    if (!isStageLocked(stage, comp)) continue // 仅已锁定成绩计入积分
    const targetSessionId = sessionId ?? getRaceSessionId(stage)
    for (const split of stage.splits) {
      if (!split.results) continue
      for (const r of split.results) {
        if (targetSessionId && r.sessionId !== targetSessionId) continue
        if (!map.has(r.driverId)) {
          map.set(r.driverId, {
            driverId: r.driverId,
            teamId: r.teamId,
            totalPoints: 0,
            wins: 0,
            podiums: 0,
            entries: 0,
            bestPosition: 999,
            results: [],
          })
        }
        const s = map.get(r.driverId)!
        s.totalPoints += r.points ?? 0
        if (r.position === 1) s.wins++
        if (r.position <= 3) s.podiums++
        s.entries++
        s.bestPosition = Math.min(s.bestPosition, r.position)
        s.results.push({ stageId: stage.id, roundId: stage.roundId, position: r.position, points: r.points ?? 0, bestLap: r.bestLap })
      }
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => b.totalPoints - a.totalPoints || a.bestPosition - b.bestPosition,
  )
}

export function calculateCompetitionStandings(competition: Competition, sessionId?: string): DriverStanding[] {
  const stages: Stage[] = []
  for (const round of competition.rounds) {
    stages.push(...round.stages)
  }
  return collectResultsFromStages(stages, competition, sessionId)
}

export function calculateRoundStandings(round: Round, comp?: Competition, sessionId?: string): DriverStanding[] {
  return collectResultsFromStages(round.stages, comp, sessionId)
}

export function calculateStageStandings(stage: Stage, comp?: Competition, sessionId?: string): DriverStanding[] {
  return collectResultsFromStages([stage], comp, sessionId)
}

export function getStageTimeState(stage: Stage): { started: boolean; ended: boolean } {
  const now = Date.now()
  return {
    started: now >= new Date(stage.startsAt).getTime(),
    ended: now >= new Date(stage.endsAt).getTime(),
  }
}

export interface TeamStanding {
  teamId: string
  totalPoints: number
  wins: number
  podiums: number
  entries: number
  drivers: string[]
}

export function calculateTeamStandings(competition: Competition, sessionId?: string): TeamStanding[] {
  const driverStandings = calculateCompetitionStandings(competition, sessionId)
  const map = new Map<string, TeamStanding>()
  for (const ds of driverStandings) {
    if (!ds.teamId) continue
    if (!map.has(ds.teamId)) {
      map.set(ds.teamId, { teamId: ds.teamId, totalPoints: 0, wins: 0, podiums: 0, entries: 0, drivers: [] })
    }
    const ts = map.get(ds.teamId)!
    ts.totalPoints += ds.totalPoints
    ts.wins += ds.wins
    ts.podiums += ds.podiums
    ts.entries += ds.entries
    if (!ts.drivers.includes(ds.driverId)) ts.drivers.push(ds.driverId)
  }
  return Array.from(map.values()).sort((a, b) => b.totalPoints - a.totalPoints)
}

export function getName(obj: { name_zh: string; name_en: string }, lang: string): string {
  return lang === 'zh' ? obj.name_zh : obj.name_en
}
