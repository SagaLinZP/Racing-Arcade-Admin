import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { events } from '@/data/events'
import { championships } from '@/data/championships'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ArrowLeft, Save, Send, XCircle, Plus, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'

const GAME_OPTIONS = [
  { value: 'ACC', label: 'ACC PC' },
  { value: 'AC', label: 'AC PC' },
  { value: 'AC Evo', label: 'AC Evo PC' },
  { value: 'iRacing', label: 'iRacing PC' },
  { value: 'LMU', label: 'LMU PC' },
  { value: 'rF2', label: 'rF2 PC' },
  { value: 'ETS2', label: 'ETS2 PC' },
]

const SPLIT_RULE_OPTIONS = [
  { value: 'By Skill', label: '按实力 / By Skill' },
  { value: 'Random', label: '随机 / Random' },
  { value: 'Manual', label: '手动 / Manual' },
  { value: 'First Come First Served', label: '先到先得 / First Come First Served' },
]

const REGION_OPTIONS = [
  { value: 'CN', label: 'China (CN)' },
  { value: 'AP', label: 'Asia Pacific (AP)' },
  { value: 'AM', label: 'Americas (AM)' },
  { value: 'EU', label: 'Europe & Africa (EU)' },
]

export function EventEditPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()
  const { id } = useParams()
  const [editLang, setEditLang] = useState<'en' | 'zh'>('en')
  const [showCancel, setShowCancel] = useState(false)
  const [cancelReason_en, setCancelReason_en] = useState('')
  const [cancelReason_zh, setCancelReason_zh] = useState('')

  const event = useMemo(() => events.find(e => e.id === id), [id])

  if (!event) {
    return <div className="text-center py-12 text-gray-500">Event not found</div>
  }

  if (event.championshipId) {
    const ch = championships.find(c => c.id === event.championshipId)
    if (ch) {
      return <Navigate to={`/championships/${ch.id}/edit`} replace />
    }
  }

  const getName = () => lang === 'zh' ? event.name_zh : event.name_en

  const [scoringRows, setScoringRows] = useState(
    event.scoringTable?.length
      ? event.scoringTable
      : [{ position: 1, points: 25, note_en: '', note_zh: '' }]
  )

  const addScoringRow = () => {
    setScoringRows(prev => [...prev, { position: prev.length + 1, points: 0, note_en: '', note_zh: '' }])
  }

  const removeScoringRow = (index: number) => {
    setScoringRows(prev => prev.filter((_, i) => i !== index).map((r, i) => ({ ...r, position: i + 1 })))
  }

  const updateScoringRow = (index: number, field: string, value: string | number) => {
    setScoringRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
  }

  return (
    <>
      <div className="sticky top-0 z-10 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 pt-5 pb-3">
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
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{t('common.language')}:</span>
                <button
                  className={cn('px-2.5 py-1 text-xs rounded', editLang === 'en' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                  onClick={() => setEditLang('en')}
                >EN</button>
                <button
                  className={cn('px-2.5 py-1 text-xs rounded', editLang === 'zh' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                  onClick={() => setEditLang('zh')}
                >中文</button>
              </div>
              <div className="w-px h-6 bg-gray-200" />
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
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-3">{t('event.sectionEventSummary')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">ID:</span> <span className="font-mono">{event.id}</span></div>
          <div><span className="text-gray-500">{t('event.game')}:</span> {event.game}</div>
          <div><span className="text-gray-500">{t('event.track')}:</span> {event.track}</div>
          <div><span className="text-gray-500">{t('event.registrations')}:</span> {event.currentRegistrations}</div>
        </div>
      </Card>

      <Card key={editLang}>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionBasicInfo')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={`${t('event.eventName')} (${editLang === 'en' ? 'English' : '中文'})`}
            defaultValue={editLang === 'en' ? event.name_en : event.name_zh}
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('event.coverImage')}</label>
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              <span className="text-xs text-gray-400">或</span>
              <Input className="flex-1" placeholder="粘贴图片链接..." defaultValue={event.coverImage} />
            </div>
            {event.coverImage && <img src={event.coverImage} alt="cover" className="mt-2 h-20 w-auto rounded border" />}
          </div>
          <div className="md:col-span-2">
            <Textarea
              label={`${t('common.description')} (${editLang === 'en' ? 'English' : '中文'})`}
              defaultValue={editLang === 'en' ? event.description_en : event.description_zh}
            />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionGameTrack')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select label={t('event.game')} options={GAME_OPTIONS} defaultValue={event.game} />
          <Input label={t('event.track')} defaultValue={event.track} />
          <Input label={t('event.trackLayout')} defaultValue={event.trackLayout ?? ''} />
          <Input label={t('event.carClass')} defaultValue={event.carClass} />
          <Input label={t('event.weather')} defaultValue={event.weather ?? 'Clear'} />
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked={event.hasPitstop} className="rounded border-gray-300" />
              <span className="text-sm text-gray-700">{t('event.hasPitstop')}</span>
            </label>
          </div>
          <div className="md:col-span-3">
            <Input label={t('event.carList')} defaultValue={event.carList?.join(', ') ?? ''} />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('common.regions')}</h3>
        <div className="flex flex-wrap gap-3">
          {REGION_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={event.regions.includes(opt.value as 'CN' | 'AP' | 'AM' | 'EU')}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionRaceFormat')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label={t('event.practiceDuration')} type="number" defaultValue={event.practiceDuration ?? 30} />
          <Input label={t('event.qualifyingDuration')} type="number" defaultValue={event.qualifyingDuration ?? 15} />
          <div className="grid grid-cols-2 gap-2">
            <Input label={t('event.raceDuration')} type="number" defaultValue={event.raceDuration} />
            <Select
              label={t('event.raceDurationType')}
              options={[{ value: 'time', label: t('event.timeBased') }, { value: 'laps', label: t('event.lapsBased') }]}
              defaultValue={event.raceDurationType}
            />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionSplitConfig')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked={event.enableMultiSplit} className="rounded border-gray-300" />
            <span className="text-sm text-gray-700">{t('event.enableMultiSplit')}</span>
          </label>
          <div />
          <Input label={t('event.maxEntriesPerSplit')} type="number" defaultValue={event.maxEntriesPerSplit} />
          <Input label={t('event.maxSplits')} type="number" defaultValue={event.maxSplits ?? 2} />
          <Select label={t('event.splitAssignmentRule')} options={SPLIT_RULE_OPTIONS} defaultValue={event.splitAssignmentRule ?? 'By Skill'} />
          <Input label={t('event.minEntries')} type="number" defaultValue={event.minEntries ?? 10} />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionSchedule')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={t('event.registrationOpenAt')} type="datetime-local" defaultValue={event.registrationOpenAt} />
          <Input label={t('event.registrationCloseAt')} type="datetime-local" defaultValue={event.registrationCloseAt} />
          <Input label={t('event.cancelRegistrationDeadline')} type="datetime-local" defaultValue={event.cancelRegistrationDeadline ?? ''} />
          <Input label={t('event.eventStartTime')} type="datetime-local" defaultValue={event.eventStartTime} />
        </div>
      </Card>

      <Card key={`rules-${editLang}`}>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionRulesAccess')}</h3>
        <div className="space-y-4">
          <Textarea
            label={`${t('event.accessRequirements')} (${editLang === 'en' ? 'English' : '中文'})`}
            defaultValue={editLang === 'en' ? event.accessRequirements_en : event.accessRequirements_zh}
          />
          <Textarea
            label={`${t('event.rules')} (${editLang === 'en' ? 'English' : '中文'})`}
            defaultValue={editLang === 'en' ? event.rules_en : event.rules_zh}
          />
          <Textarea
            label={`${t('event.scoringRules')} (${editLang === 'en' ? 'English' : '中文'})`}
            defaultValue={editLang === 'en' ? event.scoringRules_en : event.scoringRules_zh}
          />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.scoringTable')}</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
            <div className="col-span-2">{t('event.position')}</div>
            <div className="col-span-2">{t('event.points')}</div>
            <div className="col-span-3">{t('event.noteEn')}</div>
            <div className="col-span-3">{t('event.noteZh')}</div>
            <div className="col-span-2" />
          </div>
          {scoringRows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-2">
                <Input
                  type="number"
                  value={row.position}
                  onChange={(e) => updateScoringRow(idx, 'position', Number(e.target.value))}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  value={row.points}
                  onChange={(e) => updateScoringRow(idx, 'points', Number(e.target.value))}
                />
              </div>
              <div className="col-span-3">
                <Input
                  value={row.note_en ?? ''}
                  onChange={(e) => updateScoringRow(idx, 'note_en', e.target.value)}
                />
              </div>
              <div className="col-span-3">
                <Input
                  value={row.note_zh ?? ''}
                  onChange={(e) => updateScoringRow(idx, 'note_zh', e.target.value)}
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => removeScoringRow(idx)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={addScoringRow}>
            <Plus className="w-4 h-4 mr-1" />
            {t('event.addRow')}
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionServerStreaming')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={t('event.serverInfo')} defaultValue={event.serverInfo ?? ''} />
          <Input label={t('event.serverPassword')} defaultValue={event.serverPassword ?? ''} />
          <Input label={t('event.serverJoinLink')} defaultValue={event.serverJoinLink ?? ''} />
          <Input label={t('event.streamUrl')} defaultValue={event.streamUrl ?? ''} />
          <Input label={t('event.vodUrl')} defaultValue={event.vodUrl ?? ''} />
        </div>
      </Card>

      <Card key={`resources-${editLang}`}>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.resources')}</h3>
        <Textarea
          label={`${t('event.resources')} (${editLang === 'en' ? 'English' : '中文'})`}
          defaultValue={editLang === 'en' ? event.resources_en : event.resources_zh}
          placeholder="Download links, installation instructions..."
        />
      </Card>

      <Card key={`conditions-${editLang}`}>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.conditions')}</h3>
        <Textarea
          label={`${t('event.conditions')} (${editLang === 'en' ? 'English' : '中文'})`}
          defaultValue={editLang === 'en' ? event.conditions_en : event.conditions_zh}
        />
      </Card>

      <Modal isOpen={showCancel} onClose={() => setShowCancel(false)} title={t('event.cancelEvent')} size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Are you sure you want to cancel this event? This will notify all {event.currentRegistrations} registered drivers.</p>
          <Textarea
            label={`${t('event.cancelReason')} (English)`}
            value={cancelReason_en}
            onChange={(e) => setCancelReason_en(e.target.value)}
            placeholder="Reason for cancellation..."
          />
          <Textarea
            label={`${t('event.cancelReason')} (中文)`}
            value={cancelReason_zh}
            onChange={(e) => setCancelReason_zh(e.target.value)}
            placeholder="取消原因..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowCancel(false)}>{t('common.cancel')}</Button>
            <Button variant="danger">{t('event.cancelEvent')}</Button>
          </div>
        </div>
      </Modal>
      </div>
    </>
  )
}
