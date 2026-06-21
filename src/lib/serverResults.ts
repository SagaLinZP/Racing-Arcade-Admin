import { drivers } from '@/data/drivers'
import type { Stage, Round, Competition, SessionResult } from '@/data/competitions'
import { getRaceSessionId, getPointsForPosition } from './results'
import type { ScoringTableEntry } from './utils'

function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return h
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const rng = mulberry32(seed)
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function formatLap(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = (seconds % 60).toFixed(3).padStart(6, '0')
  return `${m}:${s}`
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = Math.floor(totalSeconds % 60)
  const ms = Math.floor((totalSeconds % 1) * 1000)
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
    : `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
}

export function canSyncStage(stage: Stage): boolean {
  const raceSessionId = getRaceSessionId(stage)
  if (!raceSessionId) return false
  return Date.now() >= new Date(stage.endsAt).getTime()
}

function estimateLaps(stage: Stage, raceSessionId: string): number {
  const session = stage.sessions.find(s => s.id === raceSessionId)
  if (!session) return 20
  if (session.raceDurationType === 'laps' && session.raceDuration) return session.raceDuration
  const minutes = session.raceDuration ?? 60
  return Math.max(1, Math.round((minutes * 60) / 100))
}

export function generateSplitResults(
  stage: Stage,
  splitNumber: number,
  driverIds: string[],
  raceSessionId: string,
  scoringTable?: ScoringTableEntry[],
): SessionResult[] {
  if (driverIds.length === 0) return []
  const seed = hashCode(`${stage.id}|sp${splitNumber}`)
  const rng = mulberry32(seed)
  const ordered = seededShuffle(driverIds, seed)
  const laps = estimateLaps(stage, raceSessionId)
  const baseLapSec = 99 + rng() * 3
  let cumulativeGap = 0

  return ordered.map((driverId, i) => {
    const position = i + 1
    const driver = drivers.find(d => d.id === driverId)
    const bestLapSec = baseLapSec + rng() * 3
    const isLast = i === ordered.length - 1
    const dnf = isLast && ordered.length > 3 && rng() < 0.18
    const lapDelta = rng() * 0.4
    cumulativeGap += dnf ? 0 : 0.4 + rng() * 1.8
    const leaderTotalSec = laps * baseLapSec
    const totalSec = leaderTotalSec + cumulativeGap + lapDelta
    return {
      position: dnf ? ordered.length : position,
      driverId,
      teamId: driver?.teamId,
      sessionId: raceSessionId,
      splitNumber,
      bestLap: formatLap(bestLapSec),
      totalTime: dnf ? undefined : formatDuration(totalSec),
      lapsCompleted: dnf ? laps - Math.floor(rng() * 4 + 1) : laps,
      gapToLeader: i === 0 ? '-' : dnf ? `+${laps - (laps - Math.floor(rng() * 4 + 1))} lap(s)` : `+${cumulativeGap.toFixed(3)}`,
      status: dnf ? 'DNF' : 'Finished',
      points: dnf ? 0 : getPointsForPosition(scoringTable, position),
    }
  })
}

export function syncStageResults(stage: Stage, round: Round, competition: Competition): number {
  const raceSessionId = getRaceSessionId(stage)
  if (!raceSessionId) return 0
  const scoringTable = competition.defaultRuleset.scoringTable
  let totalGenerated = 0
  for (const split of stage.splits) {
    const entryDrivers = (split.entryList ?? [])
      .map(e => e.driverId)
      .filter((d): d is string => !!d)
    const pool = entryDrivers.length > 0 ? entryDrivers : round.registeredDriverIds
    if (pool.length === 0) continue
    const generated = generateSplitResults(stage, split.splitNumber, pool, raceSessionId, scoringTable)
    const others = (split.results ?? []).filter(r => r.sessionId !== raceSessionId)
    split.results = [...others, ...generated]
    totalGenerated += generated.length
  }
  return totalGenerated
}
