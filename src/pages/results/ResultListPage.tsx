import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { useDataVersion } from '@/data/store'
import { competitions } from '@/data/competitions'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { calculateCompetitionStandings, getName } from '@/lib/results'
import { Trophy, ChevronRight } from 'lucide-react'

export function ResultListPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()
  useDataVersion()

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('result.title')}</h1>
      </div>

      <Card padding={false}>
        <div className="divide-y divide-gray-200">
          {competitions.map(comp => {
            const hasStandings = calculateCompetitionStandings(comp).length > 0
            return (
              <div
                key={comp.id}
                onClick={() => navigate(`/results/competition/${comp.id}`)}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-900 truncate block">{getName(comp, lang)}</span>
                  <div className="mt-0.5"><Badge variant="default">{comp.game}</Badge></div>
                </div>
                {hasStandings && (
                  <span
                    onClick={(e) => { e.stopPropagation(); navigate(`/results/competition/${comp.id}/standings`) }}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 cursor-pointer shrink-0"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    {t('result.viewStandings')}
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
}
