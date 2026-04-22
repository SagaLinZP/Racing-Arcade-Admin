import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '@/hooks/useAppStore'
import { notifications } from '@/data/notifications'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { Send, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'registration', label: 'Registration' },
  { value: 'cancellation', label: 'Cancellation' },
  { value: 'results', label: 'Results' },
  { value: 'protest', label: 'Protest' },
  { value: 'system', label: 'System' },
]

export function NotificationPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const [typeFilter, setTypeFilter] = useState('')
  const [showSend, setShowSend] = useState(false)

  const filtered = typeFilter ? notifications.filter(n => n.type === typeFilter) : notifications

  const columns = [
    { key: 'type', header: t('notification.type'), render: (n: typeof notifications[0]) => <span className="text-xs px-2 py-0.5 bg-gray-100 rounded capitalize">{n.type}</span> },
    { key: 'title', header: 'Title', render: (n: typeof notifications[0]) => <span className="text-sm font-medium">{lang === 'zh' ? n.title_zh : n.title_en}</span> },
    { key: 'body', header: 'Content', render: (n: typeof notifications[0]) => <span className="text-xs text-gray-500 truncate max-w-xs block">{lang === 'zh' ? n.body_zh : n.body_en}</span> },
    { key: 'isRead', header: 'Status', render: (n: typeof notifications[0]) => n.isRead ? <span className="text-green-600 text-xs">Read</span> : <span className="text-blue-600 text-xs font-bold">Unread</span> },
    { key: 'date', header: t('common.date'), render: (n: typeof notifications[0]) => <span className="text-xs">{formatDate(n.createdAt, lang)}</span> },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('notification.title')}</h1>
        <Button onClick={() => setShowSend(true)}><Plus className="w-4 h-4 mr-1" />{t('notification.sendNotification')}</Button>
      </div>

      <Card>
        <div className="mb-4 pb-4 border-b">
          <div className="w-44">
            <Select options={TYPE_OPTIONS} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} />
          </div>
        </div>
        <DataTable columns={columns} data={filtered} keyExtractor={(n) => n.id} />
      </Card>

      <Modal isOpen={showSend} onClose={() => setShowSend(false)} title={t('notification.sendNotification')} size="lg">
        <div className="space-y-4">
          <Select label={t('notification.recipients')} options={[
            { value: 'all', label: 'All Users' },
            { value: 'registered', label: 'Registered Drivers' },
            { value: 'specific', label: 'Specific Users' },
          ]} />
          <Select label={t('notification.channel')} options={[
            { value: 'inApp', label: 'In-App Only' },
            { value: 'email', label: 'Email Only' },
            { value: 'both', label: 'In-App + Email' },
          ]} />
          <Input label="Title (English)" />
          <Input label="Title (Chinese)" />
          <Textarea label="Content (English)" rows={4} />
          <Textarea label="Content (Chinese)" rows={4} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowSend(false)}>{t('common.cancel')}</Button>
            <Button><Send className="w-4 h-4 mr-1" />{t('common.submit')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
