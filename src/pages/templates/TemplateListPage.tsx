import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { sessionTemplates } from '@/data/competitions'
import type { SessionTemplate } from '@/data/competitions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { ACC_TRACKS } from '@/pages/competitions/gameConfigOptions'

export function TemplateListPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<SessionTemplate[]>(() => [...sessionTemplates])
  const [filterGame, setFilterGame] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = filterGame ? templates.filter(tpl => tpl.game === filterGame) : templates

  const handleDelete = () => {
    if (!deleteId) return
    const idx = sessionTemplates.findIndex(tpl => tpl.id === deleteId)
    if (idx >= 0) sessionTemplates.splice(idx, 1)
    setTemplates(prev => prev.filter(tpl => tpl.id !== deleteId))
    setDeleteId(null)
  }

  const getTrackLabel = (tpl: SessionTemplate) => {
    if (tpl.game === 'ACC') {
      const found = ACC_TRACKS.find(tr => tr.value === tpl.gameConfig.track)
      return found?.label || tpl.gameConfig.track || '—'
    }
    return tpl.gameConfig.track || '—'
  }

  const columns = [
    {
      key: 'name',
      header: t('template.templateName'),
      render: (tpl: SessionTemplate) => (
        <div>
          <span className="font-medium">{lang === 'en' ? tpl.name_en : tpl.name_zh}</span>
          {(lang === 'en' ? tpl.description_en : tpl.description_zh) && (
            <span className="block text-xs text-gray-400 mt-0.5">{lang === 'en' ? tpl.description_en : tpl.description_zh}</span>
          )}
        </div>
      ),
    },
    {
      key: 'game',
      header: t('event.game'),
      render: (tpl: SessionTemplate) => <Badge variant="default">{tpl.game}</Badge>,
    },
    {
      key: 'sessionType',
      header: t('competition.sessionType'),
      render: (tpl: SessionTemplate) => t(`competition.sessionType${tpl.sessionType.charAt(0).toUpperCase() + tpl.sessionType.slice(1)}`),
    },
    {
      key: 'track',
      header: t('gameConfig.track'),
      render: (tpl: SessionTemplate) => getTrackLabel(tpl),
    },
    {
      key: 'carGroup',
      header: t('gameConfig.carGroup'),
      render: (tpl: SessionTemplate) => tpl.gameConfig.carGroup || tpl.gameConfig.cars || '—',
    },
    {
      key: 'createdAt',
      header: t('common.date'),
      render: (tpl: SessionTemplate) => <span className="text-sm text-gray-500">{formatDate(tpl.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (tpl: SessionTemplate) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/templates/${tpl.id}/edit`)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteId(tpl.id)}>
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.templates')}</h1>
        <Button onClick={() => navigate('/templates/create')}>
          <Plus className="w-4 h-4 mr-1" />{t('template.createTemplate')}
        </Button>
      </div>

      <Card padding={false}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <span className="text-sm text-gray-500">{t('event.game')}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setFilterGame('')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${!filterGame ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              {t('common.all')}
            </button>
            <button
              onClick={() => setFilterGame('ACC')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${filterGame === 'ACC' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              ACC
            </button>
            <button
              onClick={() => setFilterGame('AC')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${filterGame === 'AC' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              AC
            </button>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(tpl) => tpl.id}
          emptyMessage={t('template.noTemplates')}
        />
      </Card>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title={t('template.deleteTemplate')} size="sm">
        <p className="text-sm text-gray-600 mb-4">{t('template.deleteConfirm')}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={handleDelete}>{t('common.delete')}</Button>
        </div>
      </Modal>
    </div>
  )
}
