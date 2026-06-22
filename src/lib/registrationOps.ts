import { drivers } from '@/data/drivers'
import { teams } from '@/data/teams'
import { getRoundRegistrations, setRegistrationStatus, assignSplit } from '@/data/registrations'
import { updateCompetition, createDefaultSplit } from '@/data/competitions'
import type { Competition, Round, EntryListEntry } from '@/data/competitions'

function driverName(id: string): string {
  return drivers.find(d => d.id === id)?.nickname ?? id
}

function teamName(id?: string): string | undefined {
  return id ? teams.find(t => t.id === id)?.name : undefined
}

export function splitCountForRound(round: Round): number {
  const stage = round.stages.find(s => s.enableMultiSplit) ?? round.stages[0]
  return stage?.enableMultiSplit ? Math.max(1, stage.maxSplits ?? 1) : 1
}

export function approveAllPending(round: Round): number {
  const pending = getRoundRegistrations(round.id).filter(r => r.status === 'pending')
  pending.forEach(r => setRegistrationStatus(r.id, 'approved'))
  return pending.length
}

export function autoAssign(round: Round): void {
  const stage = round.stages.find(s => s.enableMultiSplit) ?? round.stages[0]
  const splitCount = splitCountForRound(round)
  const approved = getRoundRegistrations(round.id).filter(r => r.status === 'approved')
  const rule = stage?.splitAssignmentRule ?? ''
  const ordered = [...approved]
  if (/skill/i.test(rule)) {
    ordered.sort((a, b) => (drivers.find(d => d.id === b.driverId)?.totalPoints ?? 0) - (drivers.find(d => d.id === a.driverId)?.totalPoints ?? 0))
  } else if (/random/i.test(rule)) {
    for (let i = ordered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[ordered[i], ordered[j]] = [ordered[j], ordered[i]]
    }
  } else {
    ordered.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
  }
  const cap = stage?.maxEntriesPerSplit ?? (Math.ceil(ordered.length / splitCount) || 1)
  ordered.forEach((r, i) => assignSplit(r.id, Math.min(splitCount, Math.floor(i / cap) + 1)))
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
