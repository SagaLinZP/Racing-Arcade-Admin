import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { events } from '@/data/events'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable } from '@/components/ui/DataTable'
import { ClipboardList, Pencil } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export function ResultListPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const eventList = useMemo(() => {
    return events
      .filter(e => (e.results && e.results.length > 0) || e.status === 'Completed')
      .map(e => ({
        ...e,
        hasResults: !!(e.results && e.results.length > 0),
        name: lang === 'zh' ? e.name_zh : e.name_en,
      }))
  }, [lang])

  const filtered = useMemo(() => {
    if (!search) return eventList
    const q = search.toLowerCase()
    return eventList.filter(e => e.name.toLowerCase().includes(q) || e.track.toLowerCase().includes(q))
  }, [eventList, search])

  const columns = [
    { key: 'name', header: t('event.eventName'), render: (e: typeof filtered[0]) => <span className="font-medium">{e.name}</span> },
    { key: 'game', header: t('event.game'), render: (e: typeof filtered[0]) => <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">{e.game}</span> },
    { key: 'track', header: t('event.track') },
    { key: 'date', header: t('common.date'), render: (e: typeof filtered[0]) => formatDate(e.eventStartTime, lang) },
    {
      key: 'results',
      header: 'Results',
      render: (e: typeof filtered[0]) => (
        <StatusBadge status={e.hasResults ? 'resolved' : 'pending'} label={e.hasResults ? `${e.results!.length} entries` : 'Pending'} />
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (e: typeof filtered[0]) => (
        <Button variant="ghost" size="sm" onClick={() => navigate(`/results/${e.id}`)}>
          {e.hasResults ? <Pencil className="w-3.5 h-3.5" /> : <ClipboardList className="w-3.5 h-3.5" />}
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t('result.title')}</h1>
      <Card>
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="w-64">
            <Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <DataTable columns={columns} data={filtered} keyExtractor={(e) => e.id} />
      </Card>
    </div>
  )
}
