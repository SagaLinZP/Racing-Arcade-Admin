import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { events } from '@/data/events'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable } from '@/components/ui/DataTable'
import type { SimEvent } from '@/data/events'
import { Plus, Pencil, Eye, Copy, Ban, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const GAME_OPTIONS = [
  { value: '', label: 'All Games' },
  { value: 'ACC', label: 'ACC' },
  { value: 'AC', label: 'AC' },
  { value: 'AC Evo', label: 'AC Evo' },
  { value: 'iRacing', label: 'iRacing' },
  { value: 'LMU', label: 'LMU' },
  { value: 'rF2', label: 'rF2' },
  { value: 'ETS2', label: 'ETS2' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Upcoming', label: 'Upcoming' },
  { value: 'RegistrationOpen', label: 'Registration Open' },
  { value: 'RegistrationClosed', label: 'Registration Closed' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
]

export function EventListPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [gameFilter, setGameFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cancelTarget, setCancelTarget] = useState<SimEvent | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<SimEvent | null>(null)

  const standaloneEvents = useMemo(() => events.filter(e => !e.championshipId), [])
  const [visibleEvents, setVisibleEvents] = useState(standaloneEvents)

  const filtered = useMemo(() => {
    return visibleEvents.filter(e => {
      if (search) {
        const q = search.toLowerCase()
        const name = lang === 'zh' ? e.name_zh : e.name_en
        if (!name.toLowerCase().includes(q) && !e.track.toLowerCase().includes(q)) return false
      }
      if (gameFilter && e.game !== gameFilter) return false
      if (statusFilter && e.status !== statusFilter) return false
      return true
    })
  }, [visibleEvents, search, gameFilter, statusFilter, lang])

  const getName = (e: SimEvent) => lang === 'zh' ? e.name_zh : e.name_en

  const handleCancel = () => {
    if (cancelTarget) {
      cancelTarget.status = 'Cancelled'
      setCancelTarget(null)
      setCancelReason('')
    }
  }

  const handleDelete = () => {
    if (deleteTarget) {
      setVisibleEvents(prev => prev.filter(e => e.id !== deleteTarget.id))
      setDeleteTarget(null)
    }
  }

  const columns = [
    {
      key: 'name',
      header: t('event.eventName'),
      render: (e: SimEvent) => (
        <div>
          <div className="font-medium text-gray-900">{getName(e)}</div>
        </div>
      ),
    },
    { key: 'game', header: t('event.game'), render: (e: SimEvent) => <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 rounded">{e.game}</span> },
    { key: 'track', header: t('event.track'), render: (e: SimEvent) => `${e.track}${e.trackLayout ? ` (${e.trackLayout})` : ''}` },
    { key: 'carClass', header: t('event.carClass') },
    {
      key: 'status',
      header: t('common.status'),
      render: (e: SimEvent) => <StatusBadge status={e.status} label={t(`event.status.${e.status}`)} />,
    },
    {
      key: 'registrations',
      header: t('event.registrations'),
      render: (e: SimEvent) => {
        const max = e.enableMultiSplit && e.maxSplits ? e.maxEntriesPerSplit * e.maxSplits : e.maxEntriesPerSplit
        return <span>{e.currentRegistrations} / {max}</span>
      },
    },
    {
      key: 'eventStartTime',
      header: t('event.eventStartTime'),
      render: (e: SimEvent) => <span className="text-xs">{formatDate(e.eventStartTime, lang)}</span>,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (e: SimEvent) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={(ev) => { ev.stopPropagation(); navigate(`/events/${e.id}/edit`) }}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(ev) => { ev.stopPropagation(); navigate(`/results?eventId=${e.id}`) }}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(ev) => { ev.stopPropagation(); navigate(`/events/create?from=${e.id}`) }}>
            <Copy className="w-3.5 h-3.5" />
          </Button>
          {e.status !== 'Cancelled' && e.status !== 'Completed' && (
            <Button variant="ghost" size="sm" onClick={(ev) => { ev.stopPropagation(); setCancelTarget(e); setCancelReason('') }}>
              <Ban className="w-3.5 h-3.5 text-red-500" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={(ev) => { ev.stopPropagation(); setDeleteTarget(e) }}>
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('event.eventList')}</h1>
        <Button onClick={() => navigate('/events/create')}>
          <Plus className="w-4 h-4 mr-1" />
          {t('event.createEvent')}
        </Button>
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-gray-200">
          <div className="w-64">
            <Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="w-40">
            <Select options={GAME_OPTIONS} value={gameFilter} onChange={(e) => setGameFilter(e.target.value)} />
          </div>
          <div className="w-44">
            <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
          </div>
          <div className="text-sm text-gray-500 flex items-center">
            {filtered.length} {lang === 'zh' ? '个独立赛事' : 'standalone events'}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(e) => e.id}
          onRowClick={(e) => navigate(`/events/${e.id}/edit`)}
        />
      </Card>

      {cancelTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setCancelTarget(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={(ev) => ev.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('event.cancelEvent')}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {lang === 'zh' ? '确定取消赛事' : 'Cancel event'} 「{getName(cancelTarget)}」？
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('event.cancelReason')}</label>
              <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCancelTarget(null)}>{t('common.cancel')}</Button>
              <Button variant="primary" className="bg-red-600 hover:bg-red-700" onClick={handleCancel}>
                {t('event.cancelEvent')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={(ev) => ev.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('event.deleteEvent')}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('event.deleteEventConfirm')}
            </p>
            <p className="text-sm font-medium text-gray-800 mb-4">「{getName(deleteTarget)}」</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
              <Button variant="primary" className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
