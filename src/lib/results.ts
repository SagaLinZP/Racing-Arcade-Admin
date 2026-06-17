import { competitions } from '@/data/competitions'
import type { Competition, Round, Stage, Session } from '@/data/competitions'
import type { ScoringTableEntry } from './utils'

export interface SessionContext {
  competition: Competition
  round: Round
  stage: Stage
  session: Session
}

export function findSessionById(sessionId: string): SessionContext | null {
  for (const competition of competitions) {
    for (const round of competition.rounds) {
      for (const stage of round.stages) {
        for (const session of stage.sessions) {
          if (session.id === sessionId) {
            return { competition, round, stage, session }
          }
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

export type SessionResultStatus = 'pending' | 'entered' | 'partial' | 'published'

export function getSessionResultStatus(session: Session): SessionResultStatus {
  const splits = session.splits
  if (splits.length === 0) return 'pending'
  const hasAnyResults = splits.some(s => s.results && s.results.length > 0)
  if (!hasAnyResults) return 'pending'
  const allPublished = splits.every(s => !s.results || s.results.length === 0 || s.resultsPublishedAt)
  const anyPublished = splits.some(s => s.resultsPublishedAt)
  if (allPublished) return 'published'
  if (anyPublished) return 'partial'
  return 'entered'
}

export interface DriverStanding {
  driverId: string
  teamId?: string
  totalPoints: number
  wins: number
  podiums: number
  entries: number
  bestPosition: number
  results: { sessionId: string; position: number; points: number }[]
}

function collectResultsFromSessions(sessions: Session[]): DriverStanding[] {
  const map = new Map<string, DriverStanding>()
  for (const session of sessions) {
    for (const split of session.splits) {
      if (!split.results) continue
      for (const r of split.results) {
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
        s.results.push({ sessionId: session.id, position: r.position, points: r.points ?? 0 })
      }
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => b.totalPoints - a.totalPoints || a.bestPosition - b.bestPosition,
  )
}

export function calculateCompetitionStandings(competition: Competition): DriverStanding[] {
  const sessions: Session[] = []
  for (const round of competition.rounds) {
    for (const stage of round.stages) {
      sessions.push(...stage.sessions)
    }
  }
  return collectResultsFromSessions(sessions)
}

export function calculateRoundStandings(round: Round): DriverStanding[] {
  const sessions: Session[] = []
  for (const stage of round.stages) {
    sessions.push(...stage.sessions)
  }
  return collectResultsFromSessions(sessions)
}

export function calculateStageStandings(stage: Stage): DriverStanding[] {
  return collectResultsFromSessions(stage.sessions)
}

export function getName(obj: { name_zh: string; name_en: string }, lang: string): string {
  return lang === 'zh' ? obj.name_zh : obj.name_en
}
