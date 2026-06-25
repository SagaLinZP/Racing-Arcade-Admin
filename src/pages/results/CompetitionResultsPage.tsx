import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { competitions } from '@/data/competitions'
import type { Stage, Competition } from '@/data/competitions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  getStageResultStatus,
  calculateCompetitionStandings,
  getStageTimeState,
  getName,
} from '@/lib/results'
import { useDataVersion } from '@/data/store'
import { ArrowLeft, ChevronRight, Trophy } from 'lucide-react'

export function CompetitionResultsPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()
  const { competitionId } = useParams<{ competitionId: string }>()
  useDataVersion()

  const comp = competitions.find(c => c.id === competitionId)

  if (!comp) {
    return (
      <div className="p-6">
        <p className="text-gray-500">{t('result.sessionNotFound')}</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/results')}>{t('common.back')}</Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
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
          return (
            <div key={round.id}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <h2 className="text-sm font-semibold text-gray-700">{getName(round, lang)}</h2>
              </div>
              <Card padding={false}>
                <div className="divide-y divide-gray-200">
                  {round.stages.map(stage => {
                    return (
                      <div
                        key={stage.id}
                        onClick={() => navigate(`/results/${stage.id}`)}
                        className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 truncate">{getName(stage, lang)}</span>
                            {stage.gameConfig?.track && (
                              <span className="text-xs text-gray-400 shrink-0">{stage.gameConfig.track}</span>
                            )}
                          </div>
                        </div>
                        <div className="min-h-[32px] flex items-center shrink-0">
                          <StageStatus stage={stage} comp={comp} t={t} />
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
