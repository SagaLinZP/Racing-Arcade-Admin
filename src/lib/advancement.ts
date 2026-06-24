import type { Competition, Round, Stage, AdvancementRule, EntryListEntry } from '@/data/competitions'
import { createDefaultSplit, updateCompetition } from '@/data/competitions'
import { getRaceSessionId, isStageLocked } from './results'
import { drivers } from '@/data/drivers'

interface StageStanding {
  driverId: string
  position: number
  points: number
  bestLapMs?: number
}

function parseLapMs(lap?: string): number | undefined {
  if (!lap) return undefined
  const parts = lap.split(':')
  if (parts.length === 2) return (Number(parts[0]) * 60 + parseFloat(parts[1])) * 1000
  const n = parseFloat(lap)
  return Number.isNaN(n) ? undefined : n * 1000
}

export function getStageStandings(stage: Stage): StageStanding[] {
  const raceId = getRaceSessionId(stage)
  const rows: StageStanding[] = []
  for (const split of stage.splits) {
    for (const r of split.results ?? []) {
      if (raceId && r.sessionId !== raceId) continue
      if (r.status === 'DSQ' || r.status === 'DNS') continue
      rows.push({ driverId: r.driverId, position: r.position, points: r.points ?? 0, bestLapMs: parseLapMs(r.bestLap) })
    }
  }
  return rows.sort((a, b) => a.position - b.position)
}

export function computeAdvancers(prevStage: Stage, rule: AdvancementRule): string[] {
  const standings = getStageStandings(prevStage)
  if (standings.length === 0) return []
  switch (rule.metric) {
    case 'position':
      return standings.slice(0, rule.limit ?? standings.length).map(s => s.driverId)
    case 'points':
      return [...standings].sort((a, b) => b.points - a.points).slice(0, rule.limit ?? standings.length).map(s => s.driverId)
    case 'lapTime': {
      const withLap = standings.filter(s => s.bestLapMs != null).sort((a, b) => a.bestLapMs! - b.bestLapMs!)
      if (withLap.length === 0) return []
      const fastest = withLap[0].bestLapMs!
      const cutoff = fastest * (rule.lapTimeMultiplier ?? 1.05)
      return withLap.filter(s => s.bestLapMs! <= cutoff).map(s => s.driverId)
    }
    default:
      return standings.map(s => s.driverId)
  }
}

export function applyAdvancement(competition: Competition, round: Round, targetStage: Stage): number {
  const idx = round.stages.findIndex(s => s.id === targetStage.id)
  if (idx <= 0) return 0
  const prevStage = round.stages[idx - 1]
  const rule = targetStage.advancementRule ?? { metric: 'position' as const }
  const advancers = computeAdvancers(prevStage, rule)
  if (advancers.length === 0) return 0

  if (targetStage.splits.length === 0) {
    targetStage.splits.push(createDefaultSplit(targetStage.id, 1))
  }
  const splitCount = Math.max(1, targetStage.splits.length)
  const cap = Math.ceil(advancers.length / splitCount) || 1
  targetStage.splits.forEach((split, si) => {
    const chunk = advancers.slice(si * cap, (si + 1) * cap)
    const entries: EntryListEntry[] = chunk.map((driverId, i) => ({
      id: `ele_adv_${targetStage.id}_${split.splitNumber}_${driverId}`,
      driverId,
      driverName: drivers.find(d => d.id === driverId)?.nickname ?? driverId,
      raceNumber: 100 + si * cap + i,
      ballastKg: 0,
      restrictor: 0,
    }))
    split.entryList = entries
  })
  updateCompetition(competition)
  return advancers.length
}

export function canAdvance(round: Round, targetStage: Stage, comp?: Competition): boolean {
  if (targetStage.eligibilitySource !== 'previousStageResult') return false
  const idx = round.stages.findIndex(s => s.id === targetStage.id)
  if (idx <= 0) return false
  const prevStage = round.stages[idx - 1]
  // 晋级以上一 Stage 的已锁定成绩为依据
  if (!isStageLocked(prevStage, comp)) return false
  return getStageStandings(prevStage).length > 0
}
