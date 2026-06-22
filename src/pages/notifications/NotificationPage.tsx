import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '@/hooks/useAppStore'
import { useManagedOptions } from '@/hooks/useManagedOptions'
import { useDataVersion } from '@/data/store'
import { notifications, addNotification, type Notification } from '@/data/notifications'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { Send, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export function NotificationPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  useDataVersion()
  const typeOptions = useManagedOptions('notificationType', lang, t('common.allTypes'))
  const typeOptionsNoAll = useManagedOptions('notificationType', lang)
  const recipientOptions = useManagedOptions('notificationRecipient', lang)
  const channelOptions = useManagedOptions('notificationChannel', lang)
  const [typeFilter, setTypeFilter] = useState('')
  const [showSend, setShowSend] = useState(false)
  const [sendEditLang, setSendEditLang] = useState<'en' | 'zh'>('en')
  const [sendType, setSendType] = useState('system')
  const [titleEn, setTitleEn] = useState('')
  const [titleZh, setTitleZh] = useState('')
  const [bodyEn, setBodyEn] = useState('')
  const [bodyZh, setBodyZh] = useState('')

  const filtered = typeFilter ? notifications.filter(n => n.type === typeFilter) : notifications

  const handleSend = () => {
    addNotification({
      id: `ntf_m_${notifications.length + 1}`,
      type: sendType as Notification['type'],
      title_zh: titleZh || titleEn,
      title_en: titleEn || titleZh,
      body_zh: bodyZh || bodyEn,
      body_en: bodyEn || bodyZh,
      link: '',
      isRead: false,
      createdAt: new Date().toISOString(),
    })
    setShowSend(false)
    setTitleEn('')
    setTitleZh('')
    setBodyEn('')
    setBodyZh('')
  }

  const columns = [
    { key: 'type', header: t('notification.type'), render: (n: typeof notifications[0]) => <span className="text-xs px-2 py-0.5 bg-gray-100 rounded capitalize">{n.type}</span> },
    { key: 'title', header: t('notification.titleField'), render: (n: typeof notifications[0]) => <span className="text-sm font-medium">{lang === 'zh' ? n.title_zh : n.title_en}</span> },
    { key: 'body', header: t('notification.content'), render: (n: typeof notifications[0]) => <span className="text-xs text-gray-500 truncate max-w-xs block">{lang === 'zh' ? n.body_zh : n.body_en}</span> },
    { key: 'isRead', header: t('common.status'), render: (n: typeof notifications[0]) => n.isRead ? <span className="text-green-600 text-xs">{t('notification.read')}</span> : <span className="text-blue-600 text-xs font-bold">{t('notification.unread')}</span> },
    { key: 'date', header: t('common.date'), render: (n: typeof notifications[0]) => <span className="text-xs">{formatDate(n.createdAt, lang)}</span> },
  ]

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('notification.title')}</h1>
        <Button onClick={() => setShowSend(true)}><Plus className="w-4 h-4 mr-1" />{t('notification.sendNotification')}</Button>
      </div>

      <Card>
        <div className="mb-4 pb-4 border-b">
          <div className="w-44">
            <Select options={typeOptions} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} />
          </div>
        </div>
        <DataTable columns={columns} data={filtered} keyExtractor={(n) => n.id} />
      </Card>

      <Modal isOpen={showSend} onClose={() => setShowSend(false)} title={t('notification.sendNotification')} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select label={t('notification.type')} options={typeOptionsNoAll} value={sendType} onChange={(e) => setSendType(e.target.value)} />
            <Select label={t('notification.recipients')} options={recipientOptions} />
            <Select label={t('notification.channel')} options={channelOptions} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{t('common.language')}:</span>
            <button
              className={`px-2.5 py-1 text-xs rounded ${sendEditLang === 'en' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setSendEditLang('en')}
            >EN</button>
            <button
              className={`px-2.5 py-1 text-xs rounded ${sendEditLang === 'zh' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setSendEditLang('zh')}
            >中文</button>
          </div>
          <Input
            label={`${t('notification.titleField')} (${sendEditLang === 'en' ? 'EN' : '中文'})`}
            value={sendEditLang === 'en' ? titleEn : titleZh}
            onChange={(e) => (sendEditLang === 'en' ? setTitleEn(e.target.value) : setTitleZh(e.target.value))}
          />
          <Textarea
            label={`${t('common.description')} (${sendEditLang === 'en' ? 'EN' : '中文'})`}
            rows={4}
            value={sendEditLang === 'en' ? bodyEn : bodyZh}
            onChange={(e) => (sendEditLang === 'en' ? setBodyEn(e.target.value) : setBodyZh(e.target.value))}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowSend(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSend} disabled={!titleEn && !titleZh}><Send className="w-4 h-4 mr-1" />{t('common.submit')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
