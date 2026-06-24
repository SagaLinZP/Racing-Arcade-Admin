import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { useManagedOptions } from '@/hooks/useManagedOptions'
import { useDataVersion } from '@/data/store'
import { competitions, updateCompetition, deleteCompetition } from '@/data/competitions'
import type { Competition } from '@/data/competitions'
import { addNotification } from '@/data/notifications'
import { getStageResultStatus } from '@/lib/results'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { Plus, Pencil, Ban, Trash2, Clock, Archive, ArchiveRestore } from 'lucide-react'
import { cn, getCompetitionStatus } from '@/lib/utils'
import { canCancelCompetition, canDeleteCompetition, canArchiveCompetition } from '@/lib/guards'
import { formatDateTz } from '@/lib/timezone'

function coverStyle(c: Competition): React.CSSProperties {
  if (c.coverImage) return { backgroundImage: `url(${c.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  const n = parseInt(c.id.replace(/\D/g, ''), 10) || 0
  const h1 = (n * 47) % 360
  const h2 = (n * 47 + 40) % 360
  return { background: `linear-gradient(135deg, hsl(${h1} 45% 32%), hsl(${h2} 45% 24%))` }
}

function needsResults(c: Competition): boolean {
  return c.rounds.some(r => r.stages.some(s => {
    const st = getStageResultStatus(s, c)
    if (st === 'showing') return true
    if (st === 'pending' && Date.now() >= new Date(s.endsAt).getTime()) return true
    return false
  }))
}

export function CompetitionListPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()
  useDataVersion()
  const gameOptions = useManagedOptions('game', lang, t('common.allGames'))
  const statusOptions = [
    { value: '', label: t('common.allStatuses') },
    { value: 'Draft', label: t('event.status.Draft') },
    { value: 'Upcoming', label: t('event.status.Upcoming') },
    { value: 'RegistrationOpen', label: t('event.status.RegistrationOpen') },
    { value: 'RegistrationClosed', label: t('event.status.RegistrationClosed') },
    { value: 'InProgress', label: t('event.status.InProgress') },
    { value: 'Completed', label: t('event.status.Completed') },
    { value: 'Archived', label: t('event.status.Archived') },
    { value: 'Cancelled', label: t('event.status.Cancelled') },
  ]
  const [search, setSearch] = useState('')
  const [gameFilter, setGameFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cancelTarget, setCancelTarget] = useState<Competition | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Competition | null>(null)

  const getName = (c: Competition) => lang === 'zh' ? c.name_zh : c.name_en

  const filtered = competitions.filter(c => {
    const name = (lang === 'zh' ? c.name_zh : c.name_en).toLowerCase()
    const matchesSearch = !search || name.includes(search.toLowerCase())
    const matchesGame = !gameFilter || c.game === gameFilter
    const matchesStatus = !statusFilter || getCompetitionStatus(c) === statusFilter
    return matchesSearch && matchesGame && matchesStatus
  })

  interface PrimaryAction { label: string; to: string; variant: 'primary' | 'secondary'; badge?: number }
  const primaryAction = (c: Competition): PrimaryAction | null => {
    const status = getCompetitionStatus(c)
    if (status === 'Cancelled') return null
    if (status === 'Archived') return { label: t('competition.ctaViewResults'), to: `/results/competition/${c.id}`, variant: 'secondary' }
    if (status === 'Draft') return { label: t('competition.ctaContinueEdit'), to: `/competitions/${c.id}/edit`, variant: 'secondary' }
    if (status === 'RegistrationOpen') return { label: t('competition.ctaRegistrations'), to: `/registrations/competition/${c.id}`, variant: 'primary' }
    if (status === 'RegistrationClosed' || status === 'InProgress') return { label: t('competition.ctaManageEvent'), to: `/results/competition/${c.id}`, variant: 'primary' }
    if (status === 'Completed') return needsResults(c)
      ? { label: t('competition.ctaEnterResults'), to: `/results/competition/${c.id}`, variant: 'primary' }
      : { label: t('competition.ctaViewResults'), to: `/results/competition/${c.id}`, variant: 'secondary' }
    return { label: t('common.edit'), to: `/competitions/${c.id}/edit`, variant: 'secondary' }
  }

  const roundName = (r: Competition['rounds'][number]) => lang === 'zh' ? r.name_zh : r.name_en
  const stageName = (s: Competition['rounds'][number]['stages'][number]) => lang === 'zh' ? s.name_zh : s.name_en

  const milestone = (c: Competition): { label: string; date: string; context: string } | null => {
    const status = getCompetitionStatus(c)
    if (status === 'RegistrationOpen') {
      const cand = c.rounds
        .map(r => ({ ts: new Date(r.registrationCloseAt).getTime(), round: r }))
        .filter(x => x.ts > Date.now())
        .sort((a, b) => a.ts - b.ts)[0]
      if (cand) return { label: t('competition.regDeadline'), date: new Date(cand.ts).toISOString(), context: roundName(cand.round) }
    }
    if (status === 'Upcoming' || status === 'RegistrationClosed' || status === 'InProgress') {
      const cand = c.rounds
        .flatMap(r => r.stages.map(s => ({ ts: new Date(s.startsAt).getTime(), round: r, stage: s })))
        .filter(x => x.ts > Date.now())
        .sort((a, b) => a.ts - b.ts)[0]
      if (cand) return { label: t('competition.startsLabel'), date: new Date(cand.ts).toISOString(), context: `${roundName(cand.round)} · ${stageName(cand.stage)}` }
    }
    return null
  }

  const confirmCancel = () => {
    if (!cancelTarget) return
    updateCompetition({ ...cancelTarget, statusOverride: 'Cancelled' as const, cancelledReason_zh: cancelReason, cancelledReason_en: cancelReason })
    addNotification({
      id: `ntf_cancel_${cancelTarget.id}`,
      type: 'cancellation',
      title_zh: '赛事取消通知',
      title_en: 'Event Cancelled',
      body_zh: `${cancelTarget.name_zh} 已取消${cancelReason ? '：' + cancelReason : ''}`,
      body_en: `${cancelTarget.name_en} has been cancelled${cancelReason ? ': ' + cancelReason : ''}`,
      link: `/competitions/${cancelTarget.id}/edit`,
      isRead: false,
      createdAt: new Date().toISOString(),
    })
    setCancelTarget(null)
    setCancelReason('')
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteCompetition(deleteTarget.id)
    setDeleteTarget(null)
  }

  const toggleArchive = (c: Competition) => {
    const archived = c.statusOverride === 'Archived'
    updateCompetition({ ...c, statusOverride: archived ? undefined : ('Archived' as const) })
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('competition.title')}</h1>
        <Button onClick={() => navigate('/competitions/create')}>
          <Plus className="w-4 h-4 mr-1" />
          {t('competition.createCompetition')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-64">
            <Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="w-40">
            <Select options={gameOptions} value={gameFilter} onChange={(e) => setGameFilter(e.target.value)} />
          </div>
          <div className="w-44">
            <Select options={statusOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Competition cards */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <Card><p className="text-sm text-gray-400 text-center py-8">{t('common.noData')}</p></Card>
        )}
        {filtered.map(c => {
          const status = getCompetitionStatus(c)
          const action = primaryAction(c)
          const ms = milestone(c)
          return (
            <div
              key={c.id}
              onClick={() => navigate(`/competitions/${c.id}/edit`)}
              className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 hover:border-gray-300 hover:shadow-sm cursor-pointer transition-all"
            >
              <div className="w-12 h-12 rounded-lg shrink-0" style={coverStyle(c)} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{getName(c)}</div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">
                  {c.game} · {c.carClass} · {c.rounds.length} {t('competition.rounds').toLowerCase()}
                </div>
                {ms && (
                  <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 truncate">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span className="truncate">{ms.label} {formatDateTz(ms.date, c.timezone)} · {ms.context}</span>
                  </div>
                )}
              </div>
              {/* Status — fixed-width slot keeps badges vertically aligned across rows */}
              <div className="w-40 shrink-0 flex justify-start">
                <StatusBadge status={status} label={t(`event.status.${status}`)} />
              </div>
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                {/* Primary CTA — fixed-width slot keeps trailing icons aligned */}
                <div className="w-36 flex justify-end">
                  {action && (
                    <Button variant={action.variant} size="sm" onClick={() => navigate(action.to)}>
                      {action.label}
                      {action.badge ? <Badge variant="danger" className="ml-1.5">{action.badge}</Badge> : null}
                    </Button>
                  )}
                </div>
                {/* Fixed-function icons — always rendered; greyed (disabled) when N/A */}
                <Button variant="ghost" size="sm" onClick={() => navigate(`/competitions/${c.id}/edit`)} title={t('common.edit')}>
                  <Pencil className="w-4 h-4" />
                </Button>
                {(() => {
                  const archived = c.statusOverride === 'Archived'
                  const canArchive = canArchiveCompetition(c)
                  return (
                    <Button variant="ghost" size="sm" disabled={!canArchive} onClick={() => toggleArchive(c)} title={archived ? t('competition.unarchiveCompetition') : t('competition.archiveCompetition')}>
                      {archived
                        ? <ArchiveRestore className={cn('w-4 h-4', canArchive ? 'text-slate-600' : 'text-gray-300')} />
                        : <Archive className={cn('w-4 h-4', canArchive ? 'text-slate-500' : 'text-gray-300')} />}
                    </Button>
                  )
                })()}
                <Button variant="ghost" size="sm" disabled={!canCancelCompetition(c)} onClick={() => { setCancelTarget(c); setCancelReason('') }} title={t('competition.cancelCompetition')}>
                  <Ban className={cn('w-4 h-4', canCancelCompetition(c) ? 'text-orange-500' : 'text-gray-300')} />
                </Button>
                <Button variant="ghost" size="sm" disabled={!canDeleteCompetition(c)} onClick={() => setDeleteTarget(c)} title={t('competition.deleteCompetition')}>
                  <Trash2 className={cn('w-4 h-4', canDeleteCompetition(c) ? 'text-red-500' : 'text-gray-300')} />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <Modal isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)} title={t('competition.cancelCompetition')}>
        <p className="text-sm text-gray-600 mb-4">{t('competition.cancelCompetitionConfirm')}</p>
        <textarea
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={3}
          placeholder={t('competition.cancelCompetitionReason')}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setCancelTarget(null)}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={confirmCancel}>{t('common.confirm')}</Button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t('competition.deleteCompetition')}>
        <p className="text-sm text-gray-600">{t('competition.deleteCompetitionConfirm')}</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={confirmDelete}>{t('common.delete')}</Button>
        </div>
      </Modal>
    </div>
  )
}
