import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
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
import {
  applyToEntryList,
  assignSplitsEvenly,
  getSplitPlan,
  getSplitWarning,
  setRegistrationOverride,
} from '@/lib/registrationOps'
import { getName } from '@/lib/results'
import { isEntryListLocked } from '@/lib/guards'
import { getRoundStatus } from '@/lib/utils'
import { drivers } from '@/data/drivers'
import { teams } from '@/data/teams'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ArrowLeft, Check, X, Clock, Users, CheckCheck, Shuffle, Upload, AlertTriangle } from 'lucide-react'

function statusVariant(s: RegistrationStatus): 'default' | 'info' | 'warning' | 'success' | 'danger' {
  switch (s) {
    case 'approved': return 'success'
    case 'waitlisted': return 'info'
    case 'rejected': return 'danger'
    default: return 'default'
  }
}

export function CompetitionRegistrationsPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()
  const { competitionId } = useParams<{ competitionId: string }>()
  useDataVersion()
  const [flash, setFlash] = useState<string | null>(null)

  const comp = competitions.find(c => c.id === competitionId)
  if (!comp) {
    return (
      <div className="p-6">
        <p className="text-gray-500">{t('common.noData')}</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/registrations')}>{t('common.back')}</Button>
      </div>
    )
  }

  const showFlash = (msg: string) => {
    setFlash(msg)
    window.setTimeout(() => setFlash(null), 3000)
  }

  return (
    <div className="p-6 space-y-4">
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

      {flash && <div className="rounded-md bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">{flash}</div>}

      {comp.rounds.map(round => (
        <RoundRegistrationCard key={round.id} competition={comp} round={round} onFlash={showFlash} />
      ))}
    </div>
  )
}

function RoundRegistrationCard({ competition, round, onFlash }: { competition: Competition; round: Round; onFlash: (m: string) => void }) {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language

  const plan = getSplitPlan(round)
  const defaultStage = round.stages.find(s => (s.eligibilitySource ?? 'roundRegistration') === 'roundRegistration') ?? round.stages[0]
  const [splitCount, setSplitCount] = useState(plan.splitCount)
  const [order, setOrder] = useState<'time' | 'random'>(defaultStage?.splitAssignmentRule === 'random' ? 'random' : 'time')

  const roundStatus = getRoundStatus(round, competition)
  const driverName = (id: string) => drivers.find(d => d.id === id)?.nickname ?? id
  const teamName = (id?: string) => (id ? teams.find(tm => tm.id === id)?.name : undefined)

  const all = getRoundRegistrations(round.id)
  const counts = {
    approved: all.filter(r => r.status === 'approved').length,
    waitlisted: all.filter(r => r.status === 'waitlisted').length,
  }
  const approvedRegs = all.filter(r => r.status === 'approved')
  const warning = getSplitWarning(round, splitCount)
  const perGroup = Math.floor(counts.approved / Math.max(1, splitCount))
  const minEntries = defaultStage?.minEntries ?? plan.minPerGroup
  const belowMinEntries = roundStatus === 'RegistrationClosed' && counts.approved < minEntries
  const entryLocked = isEntryListLocked(round)

  const distribution = Array.from({ length: Math.max(1, splitCount) }, (_, i) => ({
    splitNumber: i + 1,
    count: approvedRegs.filter(r => (r.splitNumber ?? 1) === i + 1).length,
  }))
  const unassigned = approvedRegs.filter(r => !r.splitNumber).length

  const orderOptions = [
    { value: 'time', label: t('registration.orderTime') },
    { value: 'random', label: t('registration.orderRandom') },
  ]

  const handleAssign = () => {
    assignSplitsEvenly(competition, round, splitCount, order)
    onFlash(t('registration.assignedEvenly', { count: counts.approved, splits: Math.max(1, splitCount) }))
  }

  const handleApply = () => {
    const count = applyToEntryList(competition, round)
    onFlash(t('registration.applied', { count }))
  }

  return (
    <Card padding={false}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2" data-flow={competition.isDemo ? 'review' : undefined}>
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-800">{getName(round, lang)}</span>
          <span className="text-xs text-gray-400">{t('registration.summary', counts)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-green-600">
            <CheckCheck className="w-3.5 h-3.5" />{t('registration.autoApproved')}
          </span>
          {round.registrationOverride ? (
            <Button variant="ghost" size="sm" onClick={() => setRegistrationOverride(competition, round, undefined)}>
              {t('registration.clearOverride')}
            </Button>
          ) : roundStatus === 'RegistrationOpen' ? (
            <Button variant="ghost" size="sm" onClick={() => setRegistrationOverride(competition, round, 'forceClosed')}>
              <Clock className="w-3.5 h-3.5 mr-1" />{t('registration.closeEarly')}
            </Button>
          ) : roundStatus === 'RegistrationClosed' ? (
            <Button variant="ghost" size="sm" onClick={() => setRegistrationOverride(competition, round, 'forceOpen')}>
              <Clock className="w-3.5 h-3.5 mr-1" />{t('registration.reopen')}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Split assignment panel */}
      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/60 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">{t('registration.splitPlanTitle')}</span>
          <span className="text-xs text-gray-400">{t('registration.splitPlanHint')}</span>
        </div>

        {belowMinEntries && (
          <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{t('registration.belowMinEntries', { approved: counts.approved, min: minEntries })}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <Stat label={t('registration.approvedLabel')} value={String(counts.approved)} />
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">{t('registration.splitCount')}</label>
            <Input type="number" min={1} value={String(splitCount)} onChange={(e) => setSplitCount(Math.max(1, Number(e.target.value) || 1))} />
          </div>
          <Stat label={t('registration.perGroupLabel')} value={String(perGroup)} />
        </div>

        {warning === 'tooFew' && (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{t('registration.warnTooFew', { perGroup, min: plan.minPerGroup })}</span>
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-48">
            <Select label={t('registration.assignOrder')} options={orderOptions} value={order} onChange={(e) => setOrder(e.target.value as 'time' | 'random')} />
          </div>
          <Button variant="secondary" size="sm" onClick={handleAssign} disabled={counts.approved === 0 || entryLocked}>
            <Shuffle className="w-3.5 h-3.5 mr-1" />{t('registration.assignEvenly')}
          </Button>
          <Button data-flow={competition.isDemo ? 'entryList' : undefined} variant="primary" size="sm" onClick={handleApply} disabled={counts.approved === 0 || entryLocked}>
            <Upload className="w-3.5 h-3.5 mr-1" />{t('registration.applyToEntryList')}
          </Button>
        </div>
        {entryLocked && <p className="text-xs text-gray-400">{t('registration.entryLockedHint')}</p>}

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-400">{t('registration.splitDistribution')}:</span>
          {distribution.map(d => (
            <span key={d.splitNumber} className="inline-flex items-center gap-1 rounded bg-white border border-gray-200 px-2 py-0.5 text-gray-600">
              {t('registration.splitColumn', { n: d.splitNumber })}<span className="font-semibold text-gray-900">{d.count}</span>
            </span>
          ))}
          {unassigned > 0 && <span className="text-amber-600">{t('registration.unassignedCount', { count: unassigned })}</span>}
        </div>
      </div>

      {/* Registration table */}
      {all.length === 0 ? (
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
              {all.map((r: Registration) => (
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
                        <button onClick={() => setRegistrationStatus(r.id, 'approved')} className="p-1 rounded text-green-600 hover:bg-green-50" title={t('registration.approve')}><Check className="w-4 h-4" /></button>
                      )}
                      {r.status !== 'waitlisted' && (
                        <button onClick={() => setRegistrationStatus(r.id, 'waitlisted')} className="p-1 rounded text-blue-600 hover:bg-blue-50" title={t('registration.waitlist')}><Clock className="w-4 h-4" /></button>
                      )}
                      {r.status !== 'rejected' && (
                        <button onClick={() => setRegistrationStatus(r.id, 'rejected')} className="p-1 rounded text-red-600 hover:bg-red-50" title={t('registration.reject')}><X className="w-4 h-4" /></button>
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
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-gray-500 mb-1">{label}</div>
      <div className="h-9 flex items-center text-sm font-semibold text-gray-900">{value}</div>
    </div>
  )
}
