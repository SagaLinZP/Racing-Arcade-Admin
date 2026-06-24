import type { Competition, Stage } from '@/data/competitions'
import { updateCompetition } from '@/data/competitions'
import { startServer, getServerInstance } from '@/data/servers'

export function startStageServers(stage: Stage): number {
  stage.splits.forEach(sp => startServer(stage.id, sp, stage.gameConfig))
  return stage.splits.length
}

export function isStageServerRunning(stage: Stage): boolean {
  return stage.splits.some(sp => getServerInstance(sp.id)?.status === 'running')
}

export function stageHasEntryList(stage: Stage): boolean {
  return stage.splits.some(sp => (sp.entryList?.length ?? 0) > 0)
}

/** 锁定整个 Stage：该 Stage 所有 Split 同时写入 resultsLockedAt。 */
export function lockStageResults(stage: Stage, competition: Competition): boolean {
  const hasResults = stage.splits.some(sp => sp.results && sp.results.length > 0)
  if (!hasResults) return false
  const now = new Date().toISOString()
  stage.splits.forEach(sp => { sp.resultsLockedAt = now })
  updateCompetition(competition)
  return true
}

/** 撤销锁定（高门槛例外，仅在派生自动锁定窗口前有效）。 */
export function unlockStageResults(stage: Stage, competition: Competition): void {
  stage.splits.forEach(sp => { sp.resultsLockedAt = undefined })
  const windowH = competition.resultLockWindowHours ?? 24
  stage.resultsLockAt = new Date(Date.now() + windowH * 3_600_000).toISOString()
  updateCompetition(competition)
}
