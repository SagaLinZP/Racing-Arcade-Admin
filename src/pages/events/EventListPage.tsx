import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { events } from '@/data/events'
import { championships } from '@/data/championships'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable } from '@/components/ui/DataTable'
import type { SimEvent } from '@/data/events'
import { Plus, Search, Pencil, Eye, Copy } from 'lucide-react'
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

  const filtered = useMemo(() => {
    return events.filter(e => {
      if (search) {
        const q = search.toLowerCase()
        const name = lang === 'zh' ? e.name_zh : e.name_en
        if (!name.toLowerCase().includes(q) && !e.track.toLowerCase().includes(q)) return false
      }
      if (gameFilter && e.game !== gameFilter) return false
      if (statusFilter && e.status !== statusFilter) return false
      return true
    })
  }, [events, search, gameFilter, statusFilter, lang])

  const getName = (e: SimEvent) => lang === 'zh' ? e.name_zh : e.name_en

  const columns = [
    {
      key: 'name',
      header: t('event.eventName'),
      render: (e: SimEvent) => (
        <div>
          <div className="font-medium text-gray-900">{getName(e)}</div>
          {e.championshipId && (
            <div className="text-xs text-blue-600">
              {(() => {
                const ch = championships.find(c => c.id === e.championshipId)
                return ch ? (lang === 'zh' ? ch.name_zh : ch.name_en) : ''
              })()}
            </div>
          )}
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
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
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
            {filtered.length} events
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(e) => e.id}
        />
      </Card>
    </div>
  )
}
