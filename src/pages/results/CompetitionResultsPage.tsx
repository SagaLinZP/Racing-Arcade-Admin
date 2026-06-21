import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { competitions } from '@/data/competitions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  getStageResultStatus,
  getSessionResultCount,
  getRaceSessionId,
  calculateRoundStandings,
  getName,
} from '@/lib/results'
import { canSyncStage, syncStageResults } from '@/lib/serverResults'
import { ArrowLeft, RefreshCw, ChevronRight, Pencil, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CompetitionResultsPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()
  const { competitionId } = useParams<{ competitionId: string }>()
  const [refreshKey, setRefreshKey] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncCount, setLastSyncCount] = useState<number | null>(null)

  const comp = competitions.find(c => c.id === competitionId)
  void refreshKey

  if (!comp) {
    return (
      <div className="p-6">
        <p className="text-gray-500">{t('result.sessionNotFound')}</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/results')}>{t('common.back')}</Button>
      </div>
    )
  }

  const refresh = () => setRefreshKey(k => k + 1)

  const syncOne = (stageId: string) => {
    if (syncing) return
    setSyncing(true)
    setTimeout(() => {
      for (const round of comp.rounds) {
        const stage = round.stages.find(s => s.id === stageId)
        if (stage) {
          syncStageResults(stage, round, comp)
          break
        }
      }
      setSyncing(false)
      refresh()
    }, 500)
  }

  const syncAll = () => {
    if (syncing) return
    setSyncing(true)
    setTimeout(() => {
      let count = 0
      for (const round of comp.rounds) {
        for (const stage of round.stages) {
          if (canSyncStage(stage)) {
            const raceId = getRaceSessionId(stage)
            const has = stage.splits.some(sp => sp.results?.some(r => r.sessionId === raceId))
            if (!has) {
              syncStageResults(stage, round, comp)
              count++
            }
          }
        }
      }
      setSyncing(false)
      refresh()
      setLastSyncCount(count)
    }, 700)
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/results')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{getName(comp, lang)}</h1>
              <Badge variant="default">{comp.game}</Badge>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {comp.rounds.length} {t('competition.rounds').toLowerCase()}
            </div>
          </div>
        </div>
        <Button variant="secondary" onClick={syncAll} disabled={syncing}>
          <RefreshCw className={cn('w-4 h-4 mr-1', syncing && 'animate-spin')} />
          {t('result.syncAll')}
        </Button>
      </div>

      <div className="flex items-start gap-2 rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{t('result.syncHint')}</span>
      </div>

      {lastSyncCount !== null && (
        <div className="text-sm text-green-700">
          {lastSyncCount > 0
            ? t('result.syncDoneCount', { count: lastSyncCount })
            : t('result.syncDoneNone')}
        </div>
      )}

      <div className="space-y-6">
        {comp.rounds.map(round => {
          const standings = calculateRoundStandings(round)
          return (
            <div key={round.id}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <h2 className="text-sm font-semibold text-gray-700">{getName(round, lang)}</h2>
                <span className="text-xs text-gray-400">
                  {round.stages.length} {t('competition.stages').toLowerCase()}
                </span>
                {standings.length > 0 && (
                  <span className="text-xs text-gray-400">
                    · {standings.length} {t('result.entries').toLowerCase()}
                  </span>
                )}
              </div>
              <Card padding={false}>
                <div className="divide-y divide-gray-200">
                  {round.stages.map(stage => {
                    const status = getStageResultStatus(stage)
                    const raceId = getRaceSessionId(stage)
                    const hasRace = stage.splits.some(sp => sp.results?.some(r => r.sessionId === raceId))
                    const syncable = canSyncStage(stage) && !hasRace
                    const sessionCounts = stage.sessions.map(s => ({
                      session: s,
                      count: getSessionResultCount(stage, s.id),
                    }))
                    const totalResults = sessionCounts.reduce((sum, sc) => sum + sc.count, 0)
                    return (
                      <div
                        key={stage.id}
                        onClick={() => navigate(`/results/${stage.id}`)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-400 uppercase">{stage.type}</span>
                            <span className="text-sm font-medium text-gray-900 truncate">{getName(stage, lang)}</span>
                            {stage.gameConfig?.track && (
                              <Badge variant="default" className="text-xs">{stage.gameConfig.track}</Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {stage.sessions.length} {t('competition.sessions').toLowerCase()}
                            {' · '}
                            {stage.splits.length} {t('result.split').toLowerCase()}(s)
                            {totalResults > 0 && (
                              <>
                                {' · '}
                                {sessionCounts.filter(sc => sc.count > 0).map(sc =>
                                  `${getName(sc.session, lang)}:${sc.count}`,
                                ).join(' / ')}
                              </>
                            )}
                          </div>
                        </div>
                        <StatusPill status={status} t={t} />
                        {syncable && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={syncing}
                            onClick={(e) => { e.stopPropagation(); syncOne(stage.id) }}
                          >
                            <RefreshCw className={cn('w-3.5 h-3.5 mr-1', syncing && 'animate-spin')} />
                            {t('result.syncFromServer')}
                          </Button>
                        )}
                        {hasRace && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                            <Pencil className="w-3.5 h-3.5" />
                            {t('common.edit')}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatusPill({ status, t }: { status: string; t: (k: string) => string }) {
  const map: Record<string, { variant: 'default' | 'info' | 'warning' | 'success'; label: string }> = {
    pending: { variant: 'default', label: t('result.statusPending') },
    entered: { variant: 'warning', label: t('result.statusEntered') },
    partial: { variant: 'info', label: t('result.statusPartial') },
    published: { variant: 'success', label: t('result.statusPublished') },
  }
  const cfg = map[status] || map.pending
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}
