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

export type StageResultStatus = 'pending' | 'entered' | 'partial' | 'published'

export function getStageResultStatus(stage: Stage): StageResultStatus {
  const splits = stage.splits
  if (splits.length === 0) return 'pending'
  const hasAnyResults = splits.some(s => s.results && s.results.length > 0)
  if (!hasAnyResults) return 'pending'
  const allPublished = splits.every(s => !s.results || s.results.length === 0 || s.resultsPublishedAt)
  const anyPublished = splits.some(s => s.resultsPublishedAt)
  if (allPublished) return 'published'
  if (anyPublished) return 'partial'
  return 'entered'
}

export function getRaceSessionId(stage: Stage): string | undefined {
  return stage.sessions.find(s => s.type === 'race')?.id
}

export function getSessionResultStatus(stage: Stage, sessionId: string): StageResultStatus {
  const splits = stage.splits
  if (splits.length === 0) return 'pending'
  let hasAnyResults = false
  let relevantSplits = 0
  let publishedRelevant = 0
  for (const sp of splits) {
    const sessionResults = (sp.results ?? []).filter(r => r.sessionId === sessionId)
    if (sessionResults.length > 0) {
      hasAnyResults = true
      relevantSplits++
      if (sp.resultsPublishedAt) publishedRelevant++
    }
  }
  if (!hasAnyResults) return 'pending'
  if (relevantSplits > 0 && publishedRelevant === relevantSplits) return 'published'
  if (publishedRelevant > 0) return 'partial'
  return 'entered'
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

function collectResultsFromStages(stages: Stage[], sessionId?: string): DriverStanding[] {
  const map = new Map<string, DriverStanding>()
  for (const stage of stages) {
    if (stage.awardsPoints === false) continue
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
  return collectResultsFromStages(stages, sessionId)
}

export function calculateRoundStandings(round: Round, sessionId?: string): DriverStanding[] {
  return collectResultsFromStages(round.stages, sessionId)
}

export function calculateStageStandings(stage: Stage, sessionId?: string): DriverStanding[] {
  return collectResultsFromStages([stage], sessionId)
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
