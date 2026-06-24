import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { competitions, updateCompetition } from '@/data/competitions'
import type { Stage, Competition } from '@/data/competitions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  getStageResultStatus,
  getStageLockAt,
  getSessionResultCount,
  getRaceSessionId,
  calculateRoundStandings,
  calculateCompetitionStandings,
  getStageTimeState,
  getName,
} from '@/lib/results'
import { formatDateTimeTz } from '@/lib/timezone'
import { canSyncStage, syncStageResults } from '@/lib/serverResults'
import { applyAdvancement, canAdvance } from '@/lib/advancement'
import { startStageServers, isStageServerRunning, lockStageResults } from '@/lib/stageOps'
import { applyToEntryList } from '@/lib/registrationOps'
import { getApprovedDriverIds } from '@/data/registrations'
import { addNotification } from '@/data/notifications'
import { useDataVersion } from '@/data/store'
import { ArrowLeft, RefreshCw, ChevronRight, Info, ArrowUpRight, Trophy, Play, Send } from 'lucide-react'
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
  const [advanceFlash, setAdvanceFlash] = useState<string | null>(null)
  useDataVersion()

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
      updateCompetition(comp)
      setSyncing(false)
      refresh()
    }, 500)
  }

  const handleStartServer = (stage: Stage) => {
    const round = comp.rounds.find(r => r.stages.some(s => s.id === stage.id))
    if (round) applyToEntryList(comp, round)
    startStageServers(stage)
  }

  const handleLock = (stage: Stage) => {
    const ok = lockStageResults(stage, comp)
    if (ok) {
      addNotification({
        id: `ntf_lock_${stage.id}`,
        type: 'results',
        title_zh: '成绩已锁定',
        title_en: 'Results Locked',
        body_zh: `${getName(comp, 'zh')} - ${getName(stage, 'zh')} 成绩已锁定，积分已发放。`,
        body_en: `${getName(comp, 'en')} - ${getName(stage, 'en')} results locked, points awarded.`,
        link: `/results/competition/${comp.id}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }
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
      if (count > 0) updateCompetition(comp)
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

      {advanceFlash && <div className="text-sm text-blue-700">{advanceFlash}</div>}

      {calculateCompetitionStandings(comp).length > 0 && (
        <button
          onClick={() => navigate(`/results/competition/${comp.id}/standings`)}
          className="flex items-center justify-between w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 hover:bg-amber-100 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <Trophy className="w-4 h-4" />{t('result.standingsTitle')}
          </span>
          <span className="flex items-center gap-1 text-xs text-amber-700">
            {t('result.viewStandings')}<ChevronRight className="w-4 h-4" />
          </span>
        </button>
      )}

      <div className="space-y-6">
        {comp.rounds.map(round => {
          const standings = calculateRoundStandings(round, comp)
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
                    const raceId = getRaceSessionId(stage)
                    const hasRace = stage.splits.some(sp => sp.results?.some(r => r.sessionId === raceId))
                    const syncable = canSyncStage(stage) && !hasRace
                    const sessionCounts = stage.sessions.map(s => ({
                      session: s,
                      count: getSessionResultCount(stage, s.id),
                    }))
                    const totalResults = sessionCounts.reduce((sum, sc) => sum + sc.count, 0)
                    const st = getStageResultStatus(stage, comp)
                    const ended = getStageTimeState(stage).ended
                    const cta = st === 'locked'
                      ? { label: t('result.ctaView'), variant: 'secondary' as const }
                      : st === 'showing'
                        ? { label: t('result.ctaContinue'), variant: 'primary' as const }
                        : ended
                          ? { label: t('result.ctaEnter'), variant: 'primary' as const }
                          : null
                    return (
                      <div
                        key={stage.id}
                        onClick={() => navigate(`/results/${stage.id}`)}
                        className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0">{stage.type}</span>
                            <span className="text-sm font-medium text-gray-900 truncate">{getName(stage, lang)}</span>
                            {stage.gameConfig?.track && (
                              <span className="text-xs text-gray-400 shrink-0">{stage.gameConfig.track}</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {totalResults > 0
                              ? sessionCounts.filter(sc => sc.count > 0).map(sc => `${getName(sc.session, lang)} ${sc.count}`).join(' · ')
                              : t('result.noResultsYet')}
                            {stage.splits.length > 1 && ` · ${stage.splits.length} ${t('result.serversLabel')}`}
                          </div>
                        </div>
                        <StageStatus stage={stage} comp={comp} t={t} />
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {comp.isDemo && stage.type === 'race_day' && getApprovedDriverIds(round.id).length > 0 && !isStageServerRunning(stage) && (
                            <Button data-flow="server" variant="primary" size="sm" onClick={() => handleStartServer(stage)}>
                              <Play className="w-3.5 h-3.5 mr-1" />{t('gameConfig.startServer')}
                            </Button>
                          )}
                          {syncable && (
                            <Button data-flow={comp.isDemo ? 'results' : undefined} variant={comp.isDemo ? 'primary' : 'ghost'} size="sm" disabled={syncing} onClick={() => syncOne(stage.id)} title={t('result.syncFromServer')}>
                              <RefreshCw className={cn('w-4 h-4', comp.isDemo && 'mr-1', syncing && 'animate-spin')} />{comp.isDemo && t('result.syncFromServer')}
                            </Button>
                          )}
                          {getStageResultStatus(stage, comp) === 'showing' && (
                            <Button data-flow={comp.isDemo ? 'publish' : undefined} variant="primary" size="sm" title={t('result.autoLockAt', { time: formatDateTimeTz(new Date(getStageLockAt(stage, comp)).toISOString(), comp.timezone) })} onClick={() => handleLock(stage)}>
                              <Send className="w-3.5 h-3.5 mr-1" />{t('result.lockResults')}
                            </Button>
                          )}
                          {canAdvance(round, stage, comp) && (
                            <Button data-flow={comp.isDemo ? 'advance' : undefined} variant={comp.isDemo ? 'primary' : 'ghost'} size="sm" onClick={() => { const n = applyAdvancement(comp, round, stage); setAdvanceFlash(t('result.advanceDone', { count: n })) }} title={t('result.generateAdvancers')}>
                              <ArrowUpRight className={cn('w-4 h-4', comp.isDemo && 'mr-1')} />{comp.isDemo && t('result.generateAdvancers')}
                            </Button>
                          )}
                          {cta && (
                            <Button variant={cta.variant} size="sm" onClick={() => navigate(`/results/${stage.id}`)}>
                              {cta.label}
                            </Button>
                          )}
                        </div>
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

function StageStatus({ stage, comp, t }: { stage: Stage; comp: Competition; t: (k: string) => string }) {
  const st = getStageResultStatus(stage, comp)
  const { started, ended } = getStageTimeState(stage)
  let key: string
  let variant: 'default' | 'info' | 'warning' | 'success'
  if (st === 'locked') { key = 'locked'; variant = 'success' }
  else if (st === 'showing') { key = 'showing'; variant = 'info' }
  else if (!started) { key = 'notStarted'; variant = 'default' }
  else if (!ended) { key = 'live'; variant = 'warning' }
  else { key = 'awaitingResults'; variant = 'warning' }
  return <Badge variant={variant}>{t(`result.stageState.${key}`)}</Badge>
}
