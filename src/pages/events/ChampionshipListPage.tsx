import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { championships } from '@/data/championships'
import { events } from '@/data/events'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable } from '@/components/ui/DataTable'
import { Plus, Pencil, Eye, Ban, Trash2 } from 'lucide-react'
import type { Championship } from '@/data/championships'

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

export function ChampionshipListPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [gameFilter, setGameFilter] = useState('')
  const [cancelTarget, setCancelTarget] = useState<Championship | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Championship | null>(null)
  const [visibleChampionships, setVisibleChampionships] = useState(championships)

  const getName = (ch: Championship) => lang === 'zh' ? ch.name_zh : ch.name_en

  const filtered = useMemo(() => {
    return visibleChampionships.filter(ch => {
      if (search) {
        const q = search.toLowerCase()
        const name = getName(ch).toLowerCase()
        if (!name.includes(q)) return false
      }
      if (gameFilter && ch.game !== gameFilter) return false
      return true
    })
  }, [search, gameFilter, lang])

  const handleCancelChampionship = () => {
    if (cancelTarget) {
      cancelTarget.status = 'completed'
      cancelTarget.eventIds.forEach(eid => {
        const evt = events.find(e => e.id === eid)
        if (evt && evt.status !== 'Completed') {
          evt.status = 'Cancelled'
        }
      })
      setCancelTarget(null)
      setCancelReason('')
    }
  }

  const handleDeleteChampionship = () => {
    if (deleteTarget) {
      setVisibleChampionships(prev => prev.filter(ch => ch.id !== deleteTarget.id))
      setDeleteTarget(null)
    }
  }

  const columns = [
    {
      key: 'name',
      header: t('championship.championshipName'),
      render: (ch: Championship) => <span className="font-medium">{getName(ch)}</span>,
    },
    { key: 'game', header: t('event.game'), render: (ch: Championship) => <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 rounded">{ch.game}</span> },
    { key: 'carClass', header: t('event.carClass') },
    {
      key: 'regions',
      header: t('common.regions'),
      render: (ch: Championship) => ch.regions.join(', '),
    },
    {
      key: 'events',
      header: t('championship.subEvents'),
      render: (ch: Championship) => {
        const evts = events.filter(e => ch.eventIds.includes(e.id))
        return <span>{evts.length} {lang === 'zh' ? '个子赛事' : 'events'}</span>
      },
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (ch: Championship) => <StatusBadge status={ch.status} label={t(`championship.status.${ch.status}`)} />,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (ch: Championship) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={(ev) => { ev.stopPropagation(); navigate(`/championships/${ch.id}/edit`) }}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(ev) => { ev.stopPropagation(); }}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
          {ch.status !== 'completed' && (
            <Button variant="ghost" size="sm" onClick={(ev) => { ev.stopPropagation(); setCancelTarget(ch); setCancelReason('') }}>
              <Ban className="w-3.5 h-3.5 text-red-500" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={(ev) => { ev.stopPropagation(); setDeleteTarget(ch) }}>
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('championship.championshipList')}</h1>
        <Button onClick={() => navigate('/championships/create')}>
          <Plus className="w-4 h-4 mr-1" />
          {t('championship.createChampionship')}
        </Button>
      </div>

      <Card padding={false}>
        <div className="flex flex-wrap gap-3 px-4 pt-4 pb-4 border-b border-gray-200">
          <div className="w-64">
            <Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="w-40">
            <Select options={GAME_OPTIONS} value={gameFilter} onChange={(e) => setGameFilter(e.target.value)} />
          </div>
          <div className="text-sm text-gray-500 flex items-center">
            {filtered.length} {lang === 'zh' ? '个锦标赛' : 'championships'}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(ch) => ch.id}
          onRowClick={(ch) => navigate(`/championships/${ch.id}/edit`)}
        />
      </Card>

      {cancelTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setCancelTarget(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={(ev) => ev.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('championship.cancelChampionship')}</h3>
            <p className="text-sm text-gray-600 mb-4">{t('championship.cancelChampionshipConfirm')}</p>
            <p className="text-sm font-medium text-gray-800 mb-4">
              「{getName(cancelTarget)}」 — {cancelTarget.eventIds.length} {lang === 'zh' ? '个子赛事' : 'sub-events'}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('championship.cancelChampionshipReason')}</label>
              <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCancelTarget(null)}>{t('common.cancel')}</Button>
              <Button variant="primary" className="bg-red-600 hover:bg-red-700" onClick={handleCancelChampionship}>
                {t('championship.cancelChampionship')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={(ev) => ev.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('championship.deleteChampionship')}</h3>
            <p className="text-sm text-gray-600 mb-4">{t('championship.deleteChampionshipConfirm')}</p>
            <p className="text-sm font-medium text-gray-800 mb-4">
              「{getName(deleteTarget)}」 — {deleteTarget.eventIds.length} {lang === 'zh' ? '个子赛事' : 'sub-events'}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
              <Button variant="primary" className="bg-red-600 hover:bg-red-700" onClick={handleDeleteChampionship}>
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
