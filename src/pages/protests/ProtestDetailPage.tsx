import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { protests } from '@/data/protests'
import { events } from '@/data/events'
import { drivers } from '@/data/drivers'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ArrowLeft, Gavel, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const PENALTY_OPTIONS = [
  { value: 'warning', label: 'Warning' },
  { value: 'timePenalty', label: 'Time Penalty' },
  { value: 'positionDrop', label: 'Position Drop' },
  { value: 'disqualifyRace', label: 'Disqualify from Race' },
  { value: 'disqualifyChampionship', label: 'Disqualify from Championship' },
  { value: 'raceBan', label: 'Race Ban' },
  { value: 'timeBan', label: 'Time Ban' },
]

export function ProtestDetailPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()
  const { id } = useParams()
  const [penaltyType, setPenaltyType] = useState('timePenalty')
  const [rulingReason, setRulingReason] = useState('')

  const protest = useMemo(() => protests.find(p => p.id === id), [id])
  if (!protest) return <div className="text-center py-12 text-gray-500">Protest not found</div>

  const event = events.find(e => e.id === protest.eventId)
  const reporter = drivers.find(d => d.id === protest.reporterId)
  const reported = drivers.find(d => d.id === protest.reportedId)

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/protests')}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('protest.protestDetail')}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={protest.status} label={t(`protest.status.${protest.status}`)} />
            <span className="text-sm text-gray-500">Protest #{protest.id}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">Protest Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Event:</span><span>{event ? (lang === 'zh' ? event.name_zh : event.name_en) : protest.eventId}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Type:</span><span className="capitalize">{protest.type}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Reporter:</span><span>{reporter?.nickname || protest.reporterId}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Reported:</span><span>{reported?.nickname || protest.reportedId}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Lap:</span><span>{protest.lapNumber || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Location:</span><span>{protest.location || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Submitted:</span><span>{formatDate(protest.createdAt, lang)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Deadline:</span><span>{formatDate(protest.deadline, lang)}</span></div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('protest.description')}</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{protest.description}</p>
          {protest.evidenceUrls.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-medium text-gray-500 mb-2">Evidence:</h4>
              {protest.evidenceUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline block">{url}</a>
              ))}
            </div>
          )}
        </Card>
      </div>

      {protest.resolution ? (
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">Ruling (Resolved)</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <StatusBadge status={protest.resolution.decision === 'violation' ? 'resolved' : 'dismissed'} label={protest.resolution.decision === 'violation' ? 'Violation Confirmed' : 'Dismissed'} />
              {protest.resolution.penalty && <span className="text-gray-600">Penalty: {protest.resolution.penalty}</span>}
            </div>
            <p className="text-gray-700">{protest.resolution.reason}</p>
          </div>
        </Card>
      ) : (
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('protest.ruling')}</h3>
          <div className="space-y-4">
            <Select label={t('protest.penaltyType')} options={PENALTY_OPTIONS} value={penaltyType} onChange={(e) => setPenaltyType(e.target.value)} />
            <Textarea label={t('protest.rulingReason')} value={rulingReason} onChange={(e) => setRulingReason(e.target.value)} placeholder="Explain the ruling decision..." />
            <div className="flex gap-2">
              <Button><Gavel className="w-4 h-4 mr-1" />Confirm Violation</Button>
              <Button variant="secondary"><XCircle className="w-4 h-4 mr-1" />Dismiss Protest</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
