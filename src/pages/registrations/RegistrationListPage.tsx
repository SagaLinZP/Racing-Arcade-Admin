import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useApp } from '@/hooks/useAppStore'
import { useDataVersion } from '@/data/store'
import { competitions } from '@/data/competitions'
import type { Competition, Round } from '@/data/competitions'
import {
  getRoundRegistrations,
  setRegistrationStatus,
  type Registration,
  type RegistrationStatus,
} from '@/data/registrations'
import { approveAllPending, autoAssign, applyToEntryList } from '@/lib/registrationOps'
import { drivers } from '@/data/drivers'
import { teams } from '@/data/teams'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { Check, X, Clock, Users, CheckCheck, Shuffle, Upload } from 'lucide-react'

function statusVariant(s: RegistrationStatus): 'default' | 'info' | 'warning' | 'success' | 'danger' {
  switch (s) {
    case 'approved': return 'success'
    case 'pending': return 'warning'
    case 'waitlisted': return 'info'
    case 'rejected': return 'danger'
    default: return 'default'
  }
}

export function RegistrationListPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  useDataVersion()

  const [searchParams] = useSearchParams()
  const [competitionId, setCompetitionId] = useState(searchParams.get('competition') ?? competitions[0]?.id ?? '')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [flash, setFlash] = useState<string | null>(null)

  const comp = competitions.find(c => c.id === competitionId)

  const driverName = (id: string) => drivers.find(d => d.id === id)?.nickname ?? id
  const teamName = (id?: string) => (id ? teams.find(t => t.id === id)?.name : undefined)

  const compOptions = competitions.map(c => ({ value: c.id, label: lang === 'zh' ? c.name_zh : c.name_en }))
  const statusOptions = [
    { value: '', label: t('registration.statusAll') },
    { value: 'pending', label: t('registration.statusPending') },
    { value: 'approved', label: t('registration.statusApproved') },
    { value: 'waitlisted', label: t('registration.statusWaitlisted') },
    { value: 'rejected', label: t('registration.statusRejected') },
    { value: 'withdrawn', label: t('registration.statusWithdrawn') },
  ]

  const handleApplyToEntryList = (competition: Competition, round: Round) => {
    const count = applyToEntryList(competition, round)
    setFlash(t('registration.applied', { count }))
    window.setTimeout(() => setFlash(null), 3000)
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('registration.title')}</h1>
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-72">
            <Select label={t('registration.selectCompetition')} options={compOptions} value={competitionId} onChange={(e) => setCompetitionId(e.target.value)} />
          </div>
          <div className="w-44">
            <Select label={t('registration.status')} options={statusOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
          </div>
        </div>
      </Card>

      {flash && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">{flash}</div>
      )}

      {!comp && <Card><p className="text-sm text-gray-400 text-center py-8">{t('common.noData')}</p></Card>}

      {comp && comp.rounds.map(round => {
        const all = getRoundRegistrations(round.id)
        const rows = statusFilter ? all.filter(r => r.status === statusFilter) : all
        const counts = {
          approved: all.filter(r => r.status === 'approved').length,
          pending: all.filter(r => r.status === 'pending').length,
          waitlisted: all.filter(r => r.status === 'waitlisted').length,
        }
        return (
          <Card key={round.id} padding={false}>
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-800">{lang === 'zh' ? round.name_zh : round.name_en}</span>
                <span className="text-xs text-gray-400">
                  {t('registration.summary', counts)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button data-flow={comp.isDemo ? 'review' : undefined} variant="ghost" size="sm" onClick={() => approveAllPending(round)} disabled={counts.pending === 0}>
                  <CheckCheck className="w-3.5 h-3.5 mr-1" />{t('registration.approveAllPending')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => autoAssign(round)} disabled={counts.approved === 0}>
                  <Shuffle className="w-3.5 h-3.5 mr-1" />{t('registration.autoAssign')}
                </Button>
                <Button data-flow={comp.isDemo ? 'entryList' : undefined} variant="secondary" size="sm" onClick={() => handleApplyToEntryList(comp, round)} disabled={counts.approved === 0}>
                  <Upload className="w-3.5 h-3.5 mr-1" />{t('registration.applyToEntryList')}
                </Button>
              </div>
            </div>

            {rows.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">{t('registration.noRegistrations')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-14">{t('registration.raceNumber')}</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('registration.driver')}</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('registration.platformId')}</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('registration.team')}</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('registration.status')}</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16">{t('registration.split')}</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">{t('registration.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rows.map((r: Registration) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm font-mono text-gray-500">#{r.preferredNumber ?? '—'}</td>
                        <td className="px-3 py-2 text-sm font-medium text-gray-900">{driverName(r.driverId)}</td>
                        <td className="px-3 py-2 text-xs font-mono text-gray-400">{r.platformId}</td>
                        <td className="px-3 py-2 text-sm text-gray-500">{teamName(r.teamId) ?? '—'}</td>
                        <td className="px-3 py-2"><Badge variant={statusVariant(r.status)}>{t(`registration.status${r.status.charAt(0).toUpperCase() + r.status.slice(1)}`)}</Badge></td>
                        <td className="px-3 py-2 text-sm text-gray-600">{r.splitNumber ? `#${r.splitNumber}` : <span className="text-gray-300">{t('registration.unassigned')}</span>}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-1">
                            {r.status !== 'approved' && (
                              <button onClick={() => setRegistrationStatus(r.id, 'approved')} className="p-1 rounded text-green-600 hover:bg-green-50" title={t('registration.approve')}>
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            {r.status !== 'waitlisted' && (
                              <button onClick={() => setRegistrationStatus(r.id, 'waitlisted')} className="p-1 rounded text-blue-600 hover:bg-blue-50" title={t('registration.waitlist')}>
                                <Clock className="w-4 h-4" />
                              </button>
                            )}
                            {r.status !== 'rejected' && (
                              <button onClick={() => setRegistrationStatus(r.id, 'rejected')} className="p-1 rounded text-red-600 hover:bg-red-50" title={t('registration.reject')}>
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
