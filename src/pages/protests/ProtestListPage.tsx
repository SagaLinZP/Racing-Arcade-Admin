import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { protests } from '@/data/protests'
import { events } from '@/data/events'
import { drivers } from '@/data/drivers'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable } from '@/components/ui/DataTable'
import { Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
]

export function ProtestListPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => {
    if (!statusFilter) return protests
    return protests.filter(p => p.status === statusFilter)
  }, [statusFilter])

  const getDriver = (id: string) => drivers.find(d => d.id === id)?.nickname || id
  const getEvent = (id: string) => {
    const e = events.find(ev => ev.id === id)
    return e ? (lang === 'zh' ? e.name_zh : e.name_en) : id
  }

  const pendingCount = protests.filter(p => p.status === 'pending').length
  const reviewingCount = protests.filter(p => p.status === 'reviewing').length

  const columns = [
    { key: 'id', header: 'ID', render: (p: typeof protests[0]) => <span className="font-mono text-xs">{p.id}</span> },
    { key: 'event', header: 'Event', render: (p: typeof protests[0]) => <span className="text-sm">{getEvent(p.eventId)}</span> },
    { key: 'reporter', header: t('protest.reporter'), render: (p: typeof protests[0]) => getDriver(p.reporterId) },
    { key: 'reported', header: t('protest.reported'), render: (p: typeof protests[0]) => getDriver(p.reportedId) },
    { key: 'type', header: t('protest.eventType'), render: (p: typeof protests[0]) => <span className="capitalize">{p.type}</span> },
    { key: 'status', header: t('common.status'), render: (p: typeof protests[0]) => <StatusBadge status={p.status} label={t(`protest.status.${p.status}`)} /> },
    { key: 'date', header: t('common.date'), render: (p: typeof protests[0]) => <span className="text-xs">{formatDate(p.createdAt, lang)}</span> },
    {
      key: 'actions', header: t('common.actions'),
      render: (p: typeof protests[0]) => (
        <Button variant="ghost" size="sm" onClick={() => navigate(`/protests/${p.id}`)}>
          <Eye className="w-3.5 h-3.5" />
        </Button>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('protest.title')}</h1>
        <div className="flex gap-2 text-sm">
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">{pendingCount} Pending</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{reviewingCount} Reviewing</span>
        </div>
      </div>
      <Card>
        <div className="mb-4 pb-4 border-b">
          <div className="w-44">
            <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
          </div>
        </div>
        <DataTable columns={columns} data={filtered} keyExtractor={(p) => p.id} />
      </Card>
    </div>
  )
}
