import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { useDataVersion } from '@/data/store'
import { competitions, updateCompetition } from '@/data/competitions'
import { getSplitPlan } from '@/lib/registrationOps'
import { getName } from '@/lib/results'
import { getRoundStatus } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, ChevronRight, Users } from 'lucide-react'

export function CompetitionRegistrationsPage() {
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
        <p className="text-gray-500">{t('common.noData')}</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/registrations')}>{t('common.back')}</Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/registrations')}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{getName(comp, lang)}</h1>
              <Badge variant="default">{comp.game}</Badge>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{t('registration.roundsCount', { count: comp.rounds.length })}</div>
          </div>
        </div>
        <div className="w-40">
          <Input label={t('event.minSplitEntries')} type="number" min={1} value={String(comp.minSplitEntries ?? 10)} onChange={(e) => updateCompetition({ ...comp, minSplitEntries: Number(e.target.value) || 10 })} />
        </div>
      </div>

      <Card padding={false}>
        <div className="divide-y divide-gray-200">
          {comp.rounds.map(round => {
            const plan = getSplitPlan(round, comp)
            const status = getRoundStatus(round, comp)
            return (
              <div
                key={round.id}
                onClick={() => navigate(`/registrations/competition/${comp.id}/round/${round.id}`)}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <Users className="w-4 h-4 text-gray-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 truncate">{getName(round, lang)}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {t('registration.approvedCount', { count: plan.approvedCount })}
                    {' · '}
                    {t('registration.splitCount')}: {plan.splitCount}
                  </div>
                </div>
                <Badge variant="default">{t(`event.status.${status}`)}</Badge>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
