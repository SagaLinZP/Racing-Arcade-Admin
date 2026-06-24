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

/** 人工覆盖报名状态：提前结束 / 重开报名 / 撤销覆盖（恢复时间推导）。 */
export function setRegistrationOverride(competition: Competition, round: Round, override: Round['registrationOverride']): void {
  round.registrationOverride = override
  updateCompetition(competition)
}

export interface SplitPlan {
  /** 当前服务器(Split)数量 = 报名分站 Stage 的 splits 数 */
  splitCount: number
  approvedCount: number
  minPerGroup: number
  perGroup: number
}

/** 报名分组依据的 Stage（取资格来源为分站报名的第一个 Stage）。 */
function planningStage(round: Round): Stage | undefined {
  return roundRegistrationStages(round)[0] ?? round.stages[0]
}

export function getSplitPlan(round: Round, comp?: Competition): SplitPlan {
  const stage = planningStage(round)
  const splitCount = Math.max(1, stage?.splits.length ?? 1)
  const approvedCount = getRoundRegistrations(round.id).filter(r => r.status === 'approved').length
  const minPerGroup = comp?.minSplitEntries ?? stage?.minEntries ?? 10
  const perGroup = Math.floor(approvedCount / splitCount)
  return { splitCount, approvedCount, minPerGroup, perGroup }
}

export type SplitWarning = 'tooFew' | null

export function getSplitWarning(round: Round, comp?: Competition, overrideSplitCount?: number): SplitWarning {
  const plan = getSplitPlan(round, comp)
  const splitCount = Math.max(1, overrideSplitCount ?? plan.splitCount)
  if (splitCount > 1 && Math.floor(plan.approvedCount / splitCount) < plan.minPerGroup) return 'tooFew'
  return null
}

/** 把报名分站 Stage 调整为恰好 k 个 Split。新增的 Split 从 Split 1 克隆服务器配置，仅派生 serverName。 */
function ensureSplitCount(stage: Stage, k: number): void {
  const base = stage.splits[0]
  while (stage.splits.length < k) {
    const n = stage.splits.length + 1
    if (base) {
      const baseName = base.serverName?.trim() || 'Server'
      stage.splits.push({
        ...base,
        id: `${stage.id}_sp${n}_${Date.now()}`,
        splitNumber: n,
        serverName: `${baseName} #${n}`,
        entryList: undefined,
        results: undefined,
        resultsLockedAt: undefined,
      })
    } else {
      stage.splits.push(createDefaultSplit(stage.id, n))
    }
  }
  if (stage.splits.length > k) {
    stage.splits = stage.splits.slice(0, k).map((s, i) => ({ ...s, splitNumber: i + 1 }))
  }
}

/** 按 Stage 粒度分配分组：把已通过报名均分到该 Stage 的 k 个 Split，并直接写入各 Split 的 entryList。 */
export function assignStageSplits(
  competition: Competition,
  round: Round,
  stage: Stage,
  splitCount: number,
  order: 'time' | 'random',
): number {
  const approved = getRoundRegistrations(round.id).filter(r => r.status === 'approved')
  if (approved.length === 0) return 0
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
  ensureSplitCount(stage, k)
  const n = ordered.length
  const base = Math.floor(n / k)
  const rem = n % k
  let idx = 0
  stage.splits.forEach((split, si) => {
    const size = base + (si < rem ? 1 : 0)
    const chunk = ordered.slice(idx, idx + size)
    idx += size
    split.entryList = chunk.map((r, i) => ({
      id: `ele_${stage.id}_${split.splitNumber}_${r.driverId}`,
      driverId: r.driverId,
      driverName: driverName(r.driverId),
      teamName: teamName(r.teamId),
      raceNumber: r.preferredNumber ?? 100 + i,
      ballastKg: 0,
      restrictor: 0,
    }))
  })
  updateCompetition(competition)
  return approved.length
}

/** 报名截止后：把已通过报名均分到 k 个服务器（组间人数差 ≤1），并把各分站 Stage 调整为 k 个 Split。 */
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
    for (let j = 0; j < size; j++) assignSplit(ordered[idx++].id, g)
  }
  roundRegistrationStages(round).forEach(stage => ensureSplitCount(stage, k))
  updateCompetition(competition)
}

export function applyToEntryList(competition: Competition, round: Round): number {
  const approved = getRoundRegistrations(round.id).filter(r => r.status === 'approved')
  for (const stage of roundRegistrationStages(round)) {
    if (stage.splits.length === 0) stage.splits.push(createDefaultSplit(stage.id, 1))
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
