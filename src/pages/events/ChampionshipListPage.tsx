import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { championships } from '@/data/championships'
import { events } from '@/data/events'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable } from '@/components/ui/DataTable'
import { Plus, Pencil, Eye } from 'lucide-react'
import type { Championship } from '@/data/championships'

export function ChampionshipListPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()

  const getName = (ch: Championship) => lang === 'zh' ? ch.name_zh : ch.name_en

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
        return <span>{evts.length} events</span>
      },
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (ch: Championship) => <StatusBadge status={ch.status} label={ch.status} />,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (ch: Championship) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={(ev) => { ev.stopPropagation(); navigate(`/championships/${ch.id}/edit`) }}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm">
            <Eye className="w-3.5 h-3.5" />
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
        <DataTable
          columns={columns}
          data={championships}
          keyExtractor={(ch) => ch.id}
        />
      </Card>
    </div>
  )
}
