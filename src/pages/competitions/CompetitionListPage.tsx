import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { useManagedOptions } from '@/hooks/useManagedOptions'
import { competitions as initialCompetitions } from '@/data/competitions'
import type { Competition } from '@/data/competitions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { Plus, Pencil, Ban, Trash2 } from 'lucide-react'
import { getCompetitionStatus } from '@/lib/utils'

export function CompetitionListPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()
  const gameOptions = useManagedOptions('game', lang, t('common.allGames'))
  const statusOptions = [
    { value: '', label: t('common.allStatuses') },
    { value: 'Draft', label: t('event.status.Draft') },
    { value: 'Upcoming', label: t('event.status.Upcoming') },
    { value: 'RegistrationOpen', label: t('event.status.RegistrationOpen') },
    { value: 'RegistrationClosed', label: t('event.status.RegistrationClosed') },
    { value: 'InProgress', label: t('event.status.InProgress') },
    { value: 'Completed', label: t('event.status.Completed') },
    { value: 'Cancelled', label: t('event.status.Cancelled') },
  ]
  const [search, setSearch] = useState('')
  const [gameFilter, setGameFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cancelTarget, setCancelTarget] = useState<Competition | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Competition | null>(null)
  const [visibleCompetitions, setVisibleCompetitions] = useState(initialCompetitions)

  const getName = (c: Competition) => lang === 'zh' ? c.name_zh : c.name_en

  const filtered = useMemo(() => {
    return visibleCompetitions.filter(c => {
      const name = (lang === 'zh' ? c.name_zh : c.name_en).toLowerCase()
      const matchesSearch = !search || name.includes(search.toLowerCase())
      const matchesGame = !gameFilter || c.game === gameFilter
      const matchesStatus = !statusFilter || getCompetitionStatus(c) === statusFilter
      return matchesSearch && matchesGame && matchesStatus
    })
  }, [visibleCompetitions, search, gameFilter, statusFilter, lang])

  const columns = [
    {
      key: 'name',
      header: t('competition.competitionName'),
      render: (c: Competition) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 shrink-0" />
          <div>
            <div className="font-medium text-gray-900">{getName(c)}</div>
            <div className="text-xs text-gray-500">{c.game} · {c.carClass}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'rounds',
      header: t('competition.rounds'),
      render: (c: Competition) => (
        <span className="text-sm text-gray-600">{c.rounds.length}</span>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (c: Competition) => {
        const status = getCompetitionStatus(c)
        return <StatusBadge status={status} label={t(`event.status.${status}`)} />
      },
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (c: Competition) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/competitions/${c.id}/edit`)}>
            <Pencil className="w-4 h-4" />
          </Button>
          {getCompetitionStatus(c) !== 'Cancelled' && (
            <Button variant="ghost" size="sm" onClick={() => { setCancelTarget(c); setCancelReason('') }}>
              <Ban className="w-4 h-4 text-orange-500" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(c)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  const confirmCancel = () => {
    if (!cancelTarget) return
    setVisibleCompetitions(prev => prev.map(c =>
      c.id === cancelTarget.id
        ? { ...c, statusOverride: 'Cancelled' as const, cancelledReason_zh: cancelReason, cancelledReason_en: cancelReason }
        : c
    ))
    setCancelTarget(null)
    setCancelReason('')
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setVisibleCompetitions(prev => prev.filter(c => c.id !== deleteTarget.id))
    setDeleteTarget(null)
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

      <Card>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="w-64">
            <Input
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select options={gameOptions} value={gameFilter} onChange={(e) => setGameFilter(e.target.value)} />
          </div>
          <div className="w-44">
            <Select options={statusOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(c) => c.id}
          onRowClick={(c) => navigate(`/competitions/${c.id}/edit`)}
          emptyMessage={t('common.noData')}
        />
      </Card>

      <Modal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title={t('competition.cancelCompetition')}
      >
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

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('competition.deleteCompetition')}
      >
        <p className="text-sm text-gray-600">{t('competition.deleteCompetitionConfirm')}</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={confirmDelete}>{t('common.delete')}</Button>
        </div>
      </Modal>
    </div>
  )
}
