import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { eventTemplates } from '@/data/admin'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'

export function TemplateListPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const columns = [
    { key: 'name', header: 'Template Name', render: (tpl: typeof eventTemplates[0]) => <span className="font-medium">{tpl.name}</span> },
    { key: 'description', header: t('common.description'), render: (tpl: typeof eventTemplates[0]) => <span className="text-sm text-gray-500">{tpl.description}</span> },
    { key: 'game', header: t('event.game'), render: (tpl: typeof eventTemplates[0]) => <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 rounded">{tpl.game}</span> },
    { key: 'carClass', header: t('event.carClass') },
    { key: 'duration', header: t('event.raceDuration'), render: (tpl: typeof eventTemplates[0]) => `${tpl.raceDuration}${tpl.raceDurationType === 'time' ? ' min' : ' laps'}` },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (tpl: typeof eventTemplates[0]) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/events/create?template=${tpl.id}`)}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm"><Pencil className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteId(tpl.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.templates')}</h1>
        <Button><Plus className="w-4 h-4 mr-1" />Create Template</Button>
      </div>

      <Card padding={false}>
        <DataTable columns={columns} data={eventTemplates} keyExtractor={(tpl) => tpl.id} />
      </Card>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Template" size="sm">
        <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete this template? This action cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => setDeleteId(null)}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
