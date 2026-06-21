import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { competitions } from '@/data/competitions'
import { drivers } from '@/data/drivers'
import { teams } from '@/data/teams'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import {
  calculateCompetitionStandings,
  getName,
} from '@/lib/results'
import type { DriverStanding } from '@/lib/results'
import { Trophy, ChevronRight } from 'lucide-react'

export function ResultListPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()

  const [standingsCompId, setStandingsCompId] = useState<string | null>(null)

  const standingsData = useMemo(() => {
    if (!standingsCompId) return null
    const comp = competitions.find(c => c.id === standingsCompId)
    if (!comp) return null
    return { title: getName(comp, lang), standings: calculateCompetitionStandings(comp) }
  }, [standingsCompId, lang])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('result.title')}</h1>
      </div>

      <Card padding={false}>
        <div className="divide-y divide-gray-200">
          {competitions.map(comp => {
            const allStages = comp.rounds.flatMap(r => r.stages)
            const withResults = allStages.filter(s => s.splits.some(sp => sp.results && sp.results.length > 0)).length
            return (
              <div
                key={comp.id}
                onClick={() => navigate(`/results/competition/${comp.id}`)}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 truncate">{getName(comp, lang)}</span>
                    <Badge variant="default">{comp.game}</Badge>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {comp.rounds.length} {t('competition.rounds').toLowerCase()}
                    {' · '}
                    {allStages.length} {t('competition.stages').toLowerCase()}
                    {' · '}
                    {withResults}/{allStages.length} {t('result.synced').toLowerCase()}
                  </div>
                </div>
                <span
                  onClick={(e) => { e.stopPropagation(); setStandingsCompId(comp.id) }}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 cursor-pointer shrink-0"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  {t('result.viewStandings')}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </div>
            )
          })}
        </div>
      </Card>

      <Modal
        isOpen={!!standingsData}
        onClose={() => setStandingsCompId(null)}
        title={standingsData ? `${t('result.standings')} — ${standingsData.title}` : t('result.standings')}
        size="lg"
      >
        {standingsData && standingsData.standings.length > 0 ? (
          <StandingsTable standings={standingsData.standings} />
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">{t('result.noStandings')}</p>
        )}
      </Modal>
    </div>
  )
}

function StandingsTable({ standings }: { standings: DriverStanding[] }) {
  const { t } = useTranslation()
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{t('result.position')}</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{t('result.driver')}</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{t('result.team')}</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">{t('result.points')}</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">{t('result.wins')}</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">{t('result.podiums')}</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">{t('result.entriesCount')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {standings.map((s, i) => {
            const driver = drivers.find(d => d.id === s.driverId)
            const team = s.teamId ? teams.find(tt => tt.id === s.teamId) : undefined
            return (
              <tr key={s.driverId} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm font-bold text-gray-900">{i + 1}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{driver?.nickname ?? s.driverId}</td>
                <td className="px-4 py-2 text-sm text-gray-500">{team?.name ?? '—'}</td>
                <td className="px-4 py-2 text-sm font-bold text-right text-blue-600">{s.totalPoints}</td>
                <td className="px-4 py-2 text-sm text-right text-gray-600">{s.wins}</td>
                <td className="px-4 py-2 text-sm text-right text-gray-600">{s.podiums}</td>
                <td className="px-4 py-2 text-sm text-right text-gray-600">{s.entries}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
