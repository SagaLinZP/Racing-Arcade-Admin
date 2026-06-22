import type { Competition, Stage } from '@/data/competitions'
import { updateCompetition } from '@/data/competitions'
import { startServer, getServerInstance } from '@/data/servers'
import { getRaceSessionId } from './results'

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

export function publishStageResults(stage: Stage, competition: Competition): boolean {
  const raceId = getRaceSessionId(stage)
  const now = new Date().toISOString()
  let published = false
  for (const sp of stage.splits) {
    if (sp.results?.some(r => r.sessionId === raceId)) {
      sp.resultsPublishedAt = now
      published = true
    }
  }
  if (published) updateCompetition(competition)
  return published
}
