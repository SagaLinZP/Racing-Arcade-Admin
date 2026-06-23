import { drivers } from '@/data/drivers'
import { teams } from '@/data/teams'
import { getRoundRegistrations, assignSplit } from '@/data/registrations'
import { updateCompetition, createDefaultSplit } from '@/data/competitions'
import type { Competition, Round, Stage, EntryListEntry } from '@/data/competitions'

function driverName(id: string): string {
  return drivers.find(d => d.id === id)?.nickname ?? id
}

function teamName(id?: string): string | undefined {
  return id ? teams.find(t => t.id === id)?.name : undefined
}

function roundRegistrationStages(round: Round): Stage[] {
  return round.stages.filter(s => (s.eligibilitySource ?? 'roundRegistration') === 'roundRegistration')
}

export interface SplitPlan {
  splitCount: number
  capacityPerSplit?: number
  totalCapacity?: number
  approvedCount: number
  minPerGroup: number
  perGroup: number
}

export function getSplitPlan(round: Round): SplitPlan {
  const stage = round.stages.find(s => s.enableMultiSplit) ?? round.stages[0]
  const splitCount = stage?.enableMultiSplit ? Math.max(1, stage.maxSplits ?? 1) : 1
  const capacityPerSplit = stage?.maxEntriesPerSplit
  const totalCapacity = capacityPerSplit ? capacityPerSplit * splitCount : undefined
  const approvedCount = getRoundRegistrations(round.id).filter(r => r.status === 'approved').length
  const minPerGroup = stage?.minEntries ?? 4
  const perGroup = splitCount > 0 ? Math.floor(approvedCount / splitCount) : approvedCount
  return { splitCount, capacityPerSplit, totalCapacity, approvedCount, minPerGroup, perGroup }
}

export type SplitWarning = 'over' | 'tooFew' | null

/** Warn when approved entries exceed total capacity, or an even split leaves groups too small. */
export function getSplitWarning(round: Round, overrideSplitCount?: number): SplitWarning {
  const plan = getSplitPlan(round)
  const splitCount = Math.max(1, overrideSplitCount ?? plan.splitCount)
  if (plan.capacityPerSplit && plan.approvedCount > plan.capacityPerSplit * splitCount) return 'over'
  if (splitCount > 1 && Math.floor(plan.approvedCount / splitCount) < plan.minPerGroup) return 'tooFew'
  return null
}

/** Evenly distribute approved registrations across `splitCount` groups (group sizes differ by ≤1). */
export function assignSplitsEvenly(
  competition: Competition,
  round: Round,
  splitCount: number,
  order: 'time' | 'random',
): void {
  const approved = getRoundRegistrations(round.id).filter(r => r.status === 'approved')
  const ordered = [...approved]
  if (order === 'random') {
    for (let i = ordered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[ordered[i], ordered[j]] = [ordered[j], ordered[i]]
    }
  } else {
    ordered.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
  }
  const k = Math.max(1, splitCount)
  const n = ordered.length
  const base = Math.floor(n / k)
  const rem = n % k
  let idx = 0
  for (let g = 1; g <= k; g++) {
    const size = base + (g <= rem ? 1 : 0)
    for (let j = 0; j < size; j++) assignSplit(ordered[idx++].id, k > 1 ? g : 1)
  }
  roundRegistrationStages(round).forEach(stage => {
    stage.enableMultiSplit = k > 1
    stage.maxSplits = k
  })
  updateCompetition(competition)
}

export function applyToEntryList(competition: Competition, round: Round): number {
  const approved = getRoundRegistrations(round.id).filter(r => r.status === 'approved')
  for (const stage of round.stages) {
    const sc = stage.enableMultiSplit ? Math.max(1, stage.maxSplits ?? 1) : 1
    while (stage.splits.length < sc) {
      stage.splits.push(createDefaultSplit(stage.id, stage.splits.length + 1))
    }
    stage.splits.forEach(split => {
      const list = approved.filter(r => (r.splitNumber ?? 1) === split.splitNumber)
      const entries: EntryListEntry[] = list.map((r, i) => ({
        id: `ele_${stage.id}_${split.splitNumber}_${r.driverId}`,
        driverId: r.driverId,
        driverName: driverName(r.driverId),
        teamName: teamName(r.teamId),
        raceNumber: r.preferredNumber ?? 100 + i,
        ballastKg: 0,
        restrictor: 0,
      }))
      split.entryList = entries
    })
  }
  round.registeredDriverIds = approved.map(r => r.driverId)
  round.currentRegistrations = approved.length
  updateCompetition(competition)
  return approved.length
}
