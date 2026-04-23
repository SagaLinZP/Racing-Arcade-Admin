import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { ArrowLeft, Save, Send, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
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

const REGION_OPTIONS = [
  { value: 'CN', label: 'China (CN)' },
  { value: 'AP', label: 'Asia Pacific (AP)' },
  { value: 'AM', label: 'Americas (AM)' },
  { value: 'EU', label: 'Europe & Africa (EU)' },
]

const SPLIT_RULE_OPTIONS = [
  { value: 'By Skill', label: '按实力 / By Skill' },
  { value: 'Random', label: '随机 / Random' },
  { value: 'Manual', label: '手动 / Manual' },
  { value: 'First Come First Served', label: '先到先得 / First Come First Served' },
]

interface SubEventDraft {
  name_en: string
  name_zh: string
  description_en: string
  description_zh: string
  track: string
  trackLayout: string
  coverImage: string
  registrationOpenAt: string
  registrationCloseAt: string
  eventStartTime: string
  serverInfo: string
  serverPassword: string
  serverJoinLink: string
  streamUrl: string
  vodUrl: string
  resources_en: string
  resources_zh: string
}

const emptySubEvent = (): SubEventDraft => ({
  name_en: '', name_zh: '',
  description_en: '', description_zh: '',
  track: '', trackLayout: '', coverImage: '',
  registrationOpenAt: '', registrationCloseAt: '', eventStartTime: '',
  serverInfo: '', serverPassword: '', serverJoinLink: '',
  streamUrl: '', vodUrl: '',
  resources_en: '', resources_zh: '',
})

export function ChampionshipCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [editLang, setEditLang] = useState<'en' | 'zh'>('en')
  const [subEvents, setSubEvents] = useState<SubEventDraft[]>([])
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [scoringRows, setScoringRows] = useState([{ position: 1, points: 25, note_en: '', note_zh: '' }])

  const addSubEvent = () => {
    const next = [...subEvents, emptySubEvent()]
    setSubEvents(next)
    setExpandedIdx(next.length - 1)
  }
  const removeSubEvent = (idx: number) => {
    setSubEvents(prev => prev.filter((_, i) => i !== idx))
    if (expandedIdx === idx) setExpandedIdx(null)
    else if (expandedIdx !== null && expandedIdx > idx) setExpandedIdx(expandedIdx - 1)
  }
  const updateSubEvent = (idx: number, field: string, value: string) => {
    setSubEvents(prev => prev.map((se, i) => i === idx ? { ...se, [field]: value } : se))
  }

  const addScoringRow = () => {
    setScoringRows(prev => [...prev, { position: prev.length + 1, points: 0, note_en: '', note_zh: '' }])
  }
  const removeScoringRow = (idx: number) => {
    setScoringRows(prev => prev.filter((_, i) => i !== idx).map((row, i) => ({ ...row, position: i + 1 })))
  }
  const updateScoringRow = (idx: number, field: string, value: string | number) => {
    setScoringRows(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row))
  }

  return (
    <>
      <div className="sticky top-0 z-10 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/championships')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">{t('championship.createChampionship')}</h1>
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
              <Button variant="secondary"><Save className="w-4 h-4 mr-1" />{t('event.saveAsDraft')}</Button>
              <Button><Send className="w-4 h-4 mr-1" />{t('event.publishNow')}</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('championship.tabInfo')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={`${t('championship.championshipName')} (${editLang === 'en' ? 'EN' : '中文'})`} />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('event.coverImage')}</label>
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              <span className="text-xs text-gray-400">或</span>
              <Input className="flex-1" placeholder="粘贴图片链接..." />
            </div>
          </div>
          <Input label={t('event.carList')} placeholder={t('event.carListPlaceholder')} />
          <Select label={t('event.game')} options={GAME_OPTIONS} />
          <Input label={t('event.carClass')} />
          <Input label={t('event.streamUrl')} />
          <div className="md:col-span-2"><Textarea label={`${t('common.description')} (${editLang === 'en' ? 'EN' : '中文'})`} /></div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('common.regions')}</h3>
        <div className="flex flex-wrap gap-3">
          {REGION_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300" />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionRaceFormat')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label={t('event.practiceDuration')} type="number" defaultValue={30} />
          <Input label={t('event.qualifyingDuration')} type="number" defaultValue={15} />
          <div className="grid grid-cols-2 gap-2">
            <Input label={t('event.raceDuration')} type="number" defaultValue={60} />
            <Select label={t('event.raceDurationType')} options={[{ value: 'time', label: t('event.timeBased') }, { value: 'laps', label: t('event.lapsBased') }]} />
          </div>
          <Input label={t('event.weather')} />
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-gray-300" />
              <span className="text-sm text-gray-700">{t('event.hasPitstop')}</span>
            </label>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionSplitConfig')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label={t('event.maxEntriesPerSplit')} type="number" defaultValue={30} />
          <Input label={t('event.maxSplits')} type="number" defaultValue={2} />
          <Input label={t('event.minEntries')} type="number" defaultValue={10} />
          <Select label={t('event.splitAssignmentRule')} options={SPLIT_RULE_OPTIONS} />
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300" />
              <span className="text-sm text-gray-700">{t('event.enableMultiSplit')}</span>
            </label>
          </div>
          <Input label={t('event.cancelRegistrationDeadlineOffset')} type="number" />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionScoringTable')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2 pr-3 font-medium w-24">{t('event.position')}</th>
                <th className="py-2 pr-3 font-medium w-24">{t('event.points')}</th>
                <th className="py-2 pr-3 font-medium">{t('event.noteEn')}</th>
                <th className="py-2 pr-3 font-medium">{t('event.noteZh')}</th>
                <th className="py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {scoringRows.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      value={row.position}
                      readOnly
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      value={row.points}
                      onChange={(e) => updateScoringRow(idx, 'points', Number(e.target.value))}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      value={row.note_en}
                      onChange={(e) => updateScoringRow(idx, 'note_en', e.target.value)}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      value={row.note_zh}
                      onChange={(e) => updateScoringRow(idx, 'note_zh', e.target.value)}
                    />
                  </td>
                  <td className="py-2">
                    <Button variant="ghost" size="sm" onClick={() => removeScoringRow(idx)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <Button variant="secondary" size="sm" onClick={addScoringRow}>
            <Plus className="w-4 h-4 mr-1" />
            {t('event.addScoringRow')}
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionRules')}</h3>
        <div className="space-y-4">
          <Textarea label={`${t('event.accessRequirements')} (${editLang === 'en' ? 'EN' : '中文'})`} />
          <Textarea label={`${t('event.rules')} (${editLang === 'en' ? 'EN' : '中文'})`} />
          <Textarea label={`${t('event.scoringRules')} (${editLang === 'en' ? 'EN' : '中文'})`} />
          <Textarea label={`${t('championship.progressionRules')} (${editLang === 'en' ? 'EN' : '中文'})`} />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.resources')}</h3>
        <Textarea label={`Resources (${editLang === 'en' ? 'EN' : '中文'})`} />
      </Card>

      <Card padding={false}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-sm font-medium text-gray-700">{t('championship.subEvents')} ({subEvents.length})</h3>
            <p className="text-xs text-gray-400 mt-0.5">{t('event.subEventsInherited')}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={addSubEvent}>
            <Plus className="w-4 h-4 mr-1" />
            {t('championship.addSubEvent')}
          </Button>
        </div>

        <div className="divide-y divide-gray-100">
          {subEvents.map((se, idx) => {
            const isExpanded = expandedIdx === idx
            return (
              <div key={idx}>
                <div
                  className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                >
                  <span className="text-sm font-medium text-gray-400 w-6 shrink-0">#{idx + 1}</span>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {se.name_en || se.name_zh || `Sub Event ${idx + 1}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {se.track || 'No track set'}{se.trackLayout ? ` (${se.trackLayout})` : ''}
                      {se.eventStartTime ? ` · ${se.eventStartTime}` : ''}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeSubEvent(idx) }}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-4 pl-16">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input label={`${t('event.eventName')} (${editLang === 'en' ? 'EN' : '中文'})`} value={editLang === 'en' ? se.name_en : se.name_zh} onChange={(e) => updateSubEvent(idx, editLang === 'en' ? 'name_en' : 'name_zh', e.target.value)} />
                        <div />
                        <div className="md:col-span-2">
                          <Textarea label={`${t('common.description')} (${editLang === 'en' ? 'EN' : '中文'})`} value={editLang === 'en' ? se.description_en : se.description_zh} onChange={(e) => updateSubEvent(idx, editLang === 'en' ? 'description_en' : 'description_zh', e.target.value)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input label={t('event.track')} value={se.track} onChange={(e) => updateSubEvent(idx, 'track', e.target.value)} />
                        <Input label={t('event.trackLayout')} value={se.trackLayout} onChange={(e) => updateSubEvent(idx, 'trackLayout', e.target.value)} />
                        <Input label={t('event.coverImage')} value={se.coverImage} onChange={(e) => updateSubEvent(idx, 'coverImage', e.target.value)} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input label={t('event.registrationOpenAt')} type="datetime-local" value={se.registrationOpenAt} onChange={(e) => updateSubEvent(idx, 'registrationOpenAt', e.target.value)} />
                        <Input label={t('event.registrationCloseAt')} type="datetime-local" value={se.registrationCloseAt} onChange={(e) => updateSubEvent(idx, 'registrationCloseAt', e.target.value)} />
                        <div />
                        <Input label={t('event.eventStartTime')} type="datetime-local" value={se.eventStartTime} onChange={(e) => updateSubEvent(idx, 'eventStartTime', e.target.value)} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input label={t('event.serverInfo')} value={se.serverInfo} onChange={(e) => updateSubEvent(idx, 'serverInfo', e.target.value)} />
                        <Input label={t('event.serverPassword')} value={se.serverPassword} onChange={(e) => updateSubEvent(idx, 'serverPassword', e.target.value)} />
                        <Input label={t('event.serverJoinLink')} value={se.serverJoinLink} onChange={(e) => updateSubEvent(idx, 'serverJoinLink', e.target.value)} />
                        <Input label={t('event.streamUrl')} value={se.streamUrl} onChange={(e) => updateSubEvent(idx, 'streamUrl', e.target.value)} />
                        <Input label={t('event.vodUrl')} value={se.vodUrl} onChange={(e) => updateSubEvent(idx, 'vodUrl', e.target.value)} />
                      </div>

                      <Textarea label={`${t('event.resources')} (${editLang === 'en' ? 'EN' : '中文'})`} value={editLang === 'en' ? se.resources_en : se.resources_zh} onChange={(e) => updateSubEvent(idx, editLang === 'en' ? 'resources_en' : 'resources_zh', e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {subEvents.length === 0 && (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-gray-400 mb-3">{t('event.noSubEvents')}</p>
              <Button variant="secondary" size="sm" onClick={addSubEvent}>
                <Plus className="w-4 h-4 mr-1" />
                {t('event.addSubEventBtn')}
              </Button>
            </div>
          )}
        </div>
      </Card>
      </div>
    </>
  )
}
