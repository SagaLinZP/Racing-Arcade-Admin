import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { useDataVersion } from '@/data/store'
import { competitions, updateCompetition, type Stage } from '@/data/competitions'
import {
  getRoundRegistrations,
  setRegistrationStatus,
  type Registration,
  type RegistrationStatus,
} from '@/data/registrations'
import {
  assignStageSplits,
  setRegistrationOverride,
} from '@/lib/registrationOps'
import { getName } from '@/lib/results'
import { isEntryListLocked } from '@/lib/guards'
import { getRoundStatus } from '@/lib/utils'
import { formatDateTimeTz } from '@/lib/timezone'
import { drivers } from '@/data/drivers'
import { teams } from '@/data/teams'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ArrowLeft, Check, X, Clock, Shuffle, Settings, AlertTriangle } from 'lucide-react'

function statusVariant(s: RegistrationStatus): 'default' | 'info' | 'warning' | 'success' | 'danger' {
  switch (s) {
    case 'approved': return 'success'
    case 'waitlisted': return 'info'
    case 'rejected': return 'danger'
    default: return 'default'
  }
}

export function RoundRegistrationsPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()
  const { competitionId, roundId } = useParams<{ competitionId: string; roundId: string }>()
  useDataVersion()

  const comp = competitions.find(c => c.id === competitionId)
  const round = comp?.rounds.find(r => r.id === roundId)
  const [flash, setFlash] = useState<string | null>(null)
  const [stageSplitCounts, setStageSplitCounts] = useState<Record<string, number>>({})
  const [stageOrders, setStageOrders] = useState<Record<string, 'time' | 'random'>>({})

  if (!comp || !round) {
    return (
      <div className="p-6">
        <p className="text-gray-500">{t('common.noData')}</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/registrations')}>{t('common.back')}</Button>
      </div>
    )
  }

  const showFlash = (msg: string) => { setFlash(msg); window.setTimeout(() => setFlash(null), 3000) }
  const roundStatus = getRoundStatus(round, comp)
  const driverName = (id: string) => drivers.find(d => d.id === id)?.nickname ?? id
  const teamName = (id?: string) => (id ? teams.find(tm => tm.id === id)?.name : undefined)

  const all = getRoundRegistrations(round.id)
  const counts = { approved: all.filter(r => r.status === 'approved').length, waitlisted: all.filter(r => r.status === 'waitlisted').length }
  const minEntries = comp.minSplitEntries ?? 10
  const belowMinEntries = roundStatus === 'RegistrationClosed' && counts.approved < minEntries
  const entryLocked = isEntryListLocked(round)

  const orderOptions = [
    { value: 'time', label: t('registration.orderTime') },
    { value: 'random', label: t('registration.orderRandom') },
  ]

  const handleStageAssign = (stage: Stage) => {
    const sc = stageSplitCounts[stage.id] ?? stage.splits.length ?? 1
    const ord = stageOrders[stage.id] ?? (stage.splitAssignmentRule === 'random' ? 'random' : 'time')
    assignStageSplits(comp, round, stage, sc, ord)
    showFlash(t('registration.assignedEvenly', { count: counts.approved, splits: sc }))
  }

  const stageEntries = (stage: Stage) =>
    (stage.splits ?? []).reduce((sum, sp) => sum + (sp.entryList?.length ?? 0), 0)

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(`/registrations/competition/${comp.id}`)}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{getName(round, lang)}</h1>
              <Badge variant="default">{getName(comp, lang)}</Badge>
            </div>
          </div>
        </div>
        <div className="w-40">
          <Input label={t('event.minSplitEntries')} type="number" min={1} value={String(comp.minSplitEntries ?? 10)} onChange={(e) => updateCompetition({ ...comp, minSplitEntries: Number(e.target.value) || 10 })} />
        </div>
      </div>

      {flash && <div className="rounded-md bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">{flash}</div>}

      {belowMinEntries && (
        <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-2.5 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{t('registration.belowMinEntries', { approved: counts.approved, min: minEntries })}</span>
        </div>
      )}

      {/* Round registration table */}
      <Card padding={false}>
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-gray-200" data-flow={comp.isDemo ? 'review' : undefined}>
          <span className="text-sm font-semibold text-gray-700">{t('registration.roundRegistrationsTitle')}</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{t('registration.summary', counts)}</span>
            <div className="flex items-center gap-2">
              {round.registrationOverride ? (
                <Button variant="ghost" size="sm" onClick={() => setRegistrationOverride(comp, round, undefined)}>{t('registration.clearOverride')}</Button>
              ) : roundStatus === 'RegistrationOpen' ? (
                <Button variant="ghost" size="sm" onClick={() => setRegistrationOverride(comp, round, 'forceClosed')}><Clock className="w-3.5 h-3.5 mr-1" />{t('registration.closeEarly')}</Button>
              ) : roundStatus === 'RegistrationClosed' ? (
                <Button variant="ghost" size="sm" onClick={() => setRegistrationOverride(comp, round, 'forceOpen')}><Clock className="w-3.5 h-3.5 mr-1" />{t('registration.reopen')}</Button>
              ) : null}
            </div>
          </div>
        </div>
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
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('registration.submittedAt')}</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('registration.status')}</th>
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
                    <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">{formatDateTimeTz(r.submittedAt, comp.timezone, false)}</td>
                    <td className="px-3 py-2"><Badge variant={statusVariant(r.status)}>{t(`registration.status${r.status.charAt(0).toUpperCase() + r.status.slice(1)}`)}</Badge></td>
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

      {/* Per-stage entry lists */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">{t('registration.stageSplitTitle')}</span>
          <span className="text-xs text-gray-400">{t('registration.splitPlanHint')}</span>
        </div>
        {round.stages.map(stage => {
          const isRegStage = (stage.eligibilitySource ?? 'roundRegistration') === 'roundRegistration'
          const sc = isRegStage ? (stageSplitCounts[stage.id] ?? stage.splits.length ?? 1) : 1
          const hasEntries = (stage.splits ?? []).some(sp => sp.entryList?.length)
          if (!isRegStage) {
            return (
              <Card key={stage.id} padding={false}>
                <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-200">
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-800">{getName(stage, lang)}</span>
                  <span className="text-xs text-gray-400">
                    {stage.eligibilitySource === 'previousStageResult' ? t('registration.entryFromAdvancement') : t('registration.entryFromManualInvite')}
                  </span>
                </div>
                {hasEntries ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-12">#</th>
                          <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">{t('registration.driver')}</th>
                          <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">{t('registration.team')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(stage.splits ?? []).filter(sp => sp.entryList?.length).flatMap(split =>
                          (split.entryList ?? []).map(e => (
                            <tr key={e.id} className="hover:bg-gray-50">
                              <td className="px-3 py-1.5 text-xs font-mono text-gray-400">#{e.raceNumber}</td>
                              <td className="px-3 py-1.5 text-sm font-medium text-gray-900">{e.driverName || '—'}</td>
                              <td className="px-3 py-1.5 text-sm text-gray-500">{e.teamName || '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-5 py-2.5 text-xs text-gray-300">{t('registration.noEntryListYet')}</div>
                )}
              </Card>
            )
          }
          const ord = stageOrders[stage.id] ?? (stage.splitAssignmentRule === 'random' ? 'random' : 'time')
          const perGroup = Math.floor(counts.approved / Math.max(1, sc))
          const tooFew = sc > 1 && perGroup < minEntries
          const distribution = (stage.splits ?? []).map(sp => ({ n: sp.splitNumber, count: sp.entryList?.length ?? 0 }))
          return (
            <Card key={stage.id} padding={false}>
              <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-200">
                <Settings className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-800">{getName(stage, lang)}</span>
                <Badge variant="default" className="text-xs">{stage.type}</Badge>
                <span className="text-xs text-gray-400">{stageEntries(stage)} {t('result.entries').toLowerCase()}</span>
              </div>
              <div className="px-5 py-3 bg-gray-50/60 space-y-2">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="w-24">
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">{t('registration.splitCount')}</label>
                    <Input type="number" min={1} value={String(sc)} onChange={(e) => setStageSplitCounts(prev => ({ ...prev, [stage.id]: Math.max(1, Number(e.target.value) || 1) }))} />
                  </div>
                  <div className="w-40">
                    <Select label={t('registration.assignOrder')} options={orderOptions} value={ord} onChange={(e) => setStageOrders(prev => ({ ...prev, [stage.id]: e.target.value as 'time' | 'random' }))} />
                  </div>
                  <Button data-flow={comp.isDemo ? 'entryList' : undefined} variant="primary" size="sm" onClick={() => handleStageAssign(stage)} disabled={counts.approved === 0 || entryLocked}>
                    <Shuffle className="w-3.5 h-3.5 mr-1" />{t('registration.assignAndApply')}
                  </Button>
                </div>
                {tooFew && (
                  <p className="text-xs text-amber-600">{t('registration.warnTooFew', { perGroup, min: minEntries })}</p>
                )}
                {sc > 1 && distribution.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-gray-400">{t('registration.splitDistribution')}:</span>
                    {distribution.map(d => (
                      <span key={d.n} className="inline-flex items-center gap-1 rounded bg-white border border-gray-200 px-2 py-0.5 text-gray-600">
                        {t('registration.splitColumn', { n: d.n })}<span className="font-semibold text-gray-900">{d.count}</span>
                      </span>
                    ))}
                  </div>
                )}
                {entryLocked && <p className="text-xs text-gray-400">{t('registration.entryLockedHint')}</p>}
              </div>
              {hasEntries && (
                <div className="overflow-x-auto border-t border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-12">#</th>
                        <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">{t('registration.driver')}</th>
                        <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">{t('registration.team')}</th>
                        {sc > 1 && <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-14">{t('registration.split')}</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(stage.splits ?? []).filter(sp => sp.entryList?.length).flatMap(split =>
                        (split.entryList ?? []).map(e => (
                          <tr key={e.id} className="hover:bg-gray-50">
                            <td className="px-3 py-1.5 text-xs font-mono text-gray-400">#{e.raceNumber}</td>
                            <td className="px-3 py-1.5 text-sm font-medium text-gray-900">{e.driverName || '—'}</td>
                            <td className="px-3 py-1.5 text-sm text-gray-500">{e.teamName || '—'}</td>
                            {sc > 1 && <td className="px-3 py-1.5 text-sm text-gray-500">{split.splitNumber}</td>}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
