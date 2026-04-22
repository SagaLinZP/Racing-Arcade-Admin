import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { events } from '@/data/events'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ArrowLeft, Save, Send, XCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

const GAME_OPTIONS = [
  { value: 'ACC', label: 'ACC PC' },
  { value: 'AC', label: 'AC PC' },
  { value: 'AC Evo', label: 'AC Evo PC' },
  { value: 'iRacing', label: 'iRacing PC' },
  { value: 'LMU', label: 'LMU PC' },
  { value: 'rF2', label: 'rF2 PC' },
  { value: 'ETS2', label: 'ETS2 PC' },
]

const CAR_CLASS_OPTIONS = [
  { value: 'GT3', label: 'GT3' },
  { value: 'GT4', label: 'GT4' },
  { value: 'Formula', label: 'Formula' },
  { value: 'Porsche Cup', label: 'Porsche Cup' },
  { value: 'LMP2', label: 'LMP2' },
]

const WEATHER_OPTIONS = [
  { value: 'Clear', label: 'Clear' },
  { value: 'Overcast', label: 'Overcast' },
  { value: 'Dynamic', label: 'Dynamic' },
]

export function EventEditPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()
  const { id } = useParams()
  const [editLang, setEditLang] = useState<'en' | 'zh'>('en')
  const [showCancel, setShowCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const event = useMemo(() => events.find(e => e.id === id), [id])

  if (!event) {
    return <div className="text-center py-12 text-gray-500">Event not found</div>
  }

  const getName = () => lang === 'zh' ? event.name_zh : event.name_en

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/events')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('event.editEvent')}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={event.status} label={t(`event.status.${event.status}`)} />
              <span className="text-sm text-gray-500">{getName()}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {event.status !== 'Cancelled' && (
            <Button variant="danger" size="sm" onClick={() => setShowCancel(true)}>
              <XCircle className="w-4 h-4 mr-1" />
              {t('event.cancelEvent')}
            </Button>
          )}
          <Button variant="secondary">
            <Save className="w-4 h-4 mr-1" />
            {t('common.save')}
          </Button>
        </div>
      </div>

      {/* Language toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">{t('common.language')}:</span>
        <button className={`px-3 py-1 text-sm rounded ${editLang === 'en' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600'}`} onClick={() => setEditLang('en')}>English</button>
        <button className={`px-3 py-1 text-sm rounded ${editLang === 'zh' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600'}`} onClick={() => setEditLang('zh')}>中文</button>
      </div>

      {/* Event Info (read-only summary) */}
      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Event Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">ID:</span> <span className="font-mono">{event.id}</span></div>
          <div><span className="text-gray-500">Game:</span> {event.game}</div>
          <div><span className="text-gray-500">Track:</span> {event.track}</div>
          <div><span className="text-gray-500">Registrations:</span> {event.currentRegistrations}</div>
        </div>
      </Card>

      {/* Editable sections - same structure as create page but pre-filled */}
      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={`Event Name (${editLang === 'en' ? 'English' : '中文'})`} defaultValue={editLang === 'en' ? event.name_en : event.name_zh} />
          <div />
          <div className="md:col-span-2">
            <Textarea label={`Description (${editLang === 'en' ? 'English' : '中文'})`} defaultValue={editLang === 'en' ? event.description_en : event.description_zh} />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">Server & Streaming</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Server Info" defaultValue={event.serverInfo} />
          <Input label="Server Password" defaultValue={event.serverPassword} />
          <Input label="Server Join Link" defaultValue={event.serverJoinLink} />
          <Input label="Stream URL" defaultValue={event.streamUrl} />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">Rules & Resources</h3>
        <div className="space-y-4">
          <Input label="Access Requirements" defaultValue={event.accessRequirements} />
          <Textarea label={`Rules (${editLang === 'en' ? 'English' : '中文'})`} defaultValue={editLang === 'en' ? event.rules_en : event.rules_zh} />
          <Textarea label={`Scoring Rules (${editLang === 'en' ? 'English' : '中文'})`} defaultValue={editLang === 'en' ? event.scoringRules_en : event.scoringRules_zh} />
          <Textarea label={`Resources (${editLang === 'en' ? 'English' : '中文'})`} defaultValue={editLang === 'en' ? event.resources_en : event.resources_zh} />
        </div>
      </Card>

      {/* Cancel Event Modal */}
      <Modal isOpen={showCancel} onClose={() => setShowCancel(false)} title={t('event.cancelEvent')} size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Are you sure you want to cancel this event? This will notify all {event.currentRegistrations} registered drivers.</p>
          <Textarea label="Cancel Reason (English)" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason for cancellation..." />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowCancel(false)}>{t('common.cancel')}</Button>
            <Button variant="danger">{t('event.cancelEvent')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
