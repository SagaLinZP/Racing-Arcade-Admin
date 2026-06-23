import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { useDataVersion } from '@/data/store'
import { competitions } from '@/data/competitions'
import { getRoundRegistrations } from '@/data/registrations'
import { getName } from '@/lib/results'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ChevronRight, UserCheck } from 'lucide-react'

export function RegistrationListPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()
  useDataVersion()

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t('registration.title')}</h1>

      <Card padding={false}>
        <div className="divide-y divide-gray-200">
          {competitions.map(comp => {
            const regs = comp.rounds.flatMap(r => getRoundRegistrations(r.id))
            const approved = regs.filter(r => r.status === 'approved').length
            const waitlisted = regs.filter(r => r.status === 'waitlisted').length
            return (
              <div
                key={comp.id}
                onClick={() => navigate(`/registrations/competition/${comp.id}`)}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <UserCheck className="w-4 h-4 text-gray-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 truncate">{getName(comp, lang)}</span>
                    <Badge variant="default">{comp.game}</Badge>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {t('registration.roundsCount', { count: comp.rounds.length })}
                    {' · '}
                    {t('registration.approvedCount', { count: approved })}
                    {waitlisted > 0 && (
                      <span> · {t('registration.waitlistedCount', { count: waitlisted })}</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
