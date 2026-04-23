import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { championships } from '@/data/championships'
import { events as allEvents } from '@/data/events'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { ArrowLeft, Save, Send, Plus, ChevronDown, ChevronRight, GripVertical, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
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

type TabKey = 'info' | 'events'

export function ChampionshipEditPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()
  const { id } = useParams()
  const [tab, setTab] = useState<TabKey>('info')
  const [editLang, setEditLang] = useState<'en' | 'zh'>('en')
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [showCancelEvent, setShowCancelEvent] = useState<string | null>(null)
  const [cancelReason_en, setCancelReason_en] = useState('')
  const [cancelReason_zh, setCancelReason_zh] = useState('')

  const ch = useMemo(() => championships.find(c => c.id === id), [id])
  const chEvents = useMemo(() => ch ? allEvents.filter(e => ch.eventIds.includes(e.id)) : [], [ch])

  const [scoringRows, setScoringRows] = useState(
    ch?.scoringTable?.length
      ? ch.scoringTable
      : [{ position: 1, points: 25, note_en: '', note_zh: '' }]
  )

  if (!ch) return <div className="text-center py-12 text-gray-500">Championship not found</div>

  const getName = (e: { name_zh: string; name_en: string }) => lang === 'zh' ? e.name_zh : e.name_en

  const tabs: Array<{ key: TabKey; label: string; count?: number }> = [
    { key: 'info', label: t('championship.tabInfo') },
    { key: 'events', label: t('championship.tabEvents'), count: chEvents.length },
  ]

  return (
    <>
      <div className="sticky top-0 z-10 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 pt-5 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/championships')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('championship.editChampionship')}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={ch.status} label={ch.status} />
                  <span className="text-sm text-gray-500">{getName(ch)}</span>
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
              <Button variant="secondary"><Save className="w-4 h-4 mr-1" />{t('common.save')}</Button>
              <Button><Send className="w-4 h-4 mr-1" />{t('event.publishNow')}</Button>
            </div>
          </div>

          <div className="flex gap-6">
            {tabs.map(tb => (
              <button
                key={tb.key}
                className={cn(
                  'pb-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                  tab === tb.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                )}
                onClick={() => setTab(tb.key)}
              >
                {tb.label}
                {tb.count !== undefined && (
                  <span className={cn('ml-1.5 text-xs', tab === tb.key ? 'text-blue-500' : 'text-gray-400')}>
                    ({tb.count})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'info' && (
        <div className="max-w-5xl mx-auto p-6 space-y-6" key={editLang}>
          <Card>
            <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('championship.tabInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label={`${t('championship.championshipName')} (${editLang === 'en' ? 'EN' : '中文'})`} defaultValue={editLang === 'en' ? ch.name_en : ch.name_zh} />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('event.coverImage')}</label>
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  <span className="text-xs text-gray-400">或</span>
                  <Input className="flex-1" placeholder="粘贴图片链接..." defaultValue={ch.coverImage} />
                </div>
                {ch.coverImage && <img src={ch.coverImage} alt="cover" className="mt-2 h-20 w-auto rounded border" />}
              </div>
              <div className="md:col-span-2">
                <Textarea label={`${t('common.description')} (${editLang === 'en' ? 'EN' : '中文'})`} defaultValue={editLang === 'en' ? ch.description_en : ch.description_zh} />
              </div>
              <Select label={t('event.game')} options={GAME_OPTIONS} defaultValue={ch.game} />
              <Input label={t('event.carClass')} value={ch.carClass} />
              <Input label={t('event.streamUrl')} defaultValue={ch.streamUrl} />
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('common.regions')}</h3>
            <div className="flex flex-wrap gap-6">
              {REGION_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={ch.regions.includes(opt.value as 'CN' | 'AP' | 'AM' | 'EU')}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionRaceFormat')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label={t('event.weather')} value={ch.weather} />
              <div className="flex items-end gap-2 pb-0.5">
                <label className="flex items-center gap-2 cursor-pointer mb-0.5">
                  <input
                    type="checkbox"
                    defaultChecked={ch.hasPitstop}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{t('event.hasPitstop')}</span>
                </label>
              </div>
              <div />
              <Input label={t('event.practiceDuration')} type="number" defaultValue={ch.practiceDuration} />
              <Input label={t('event.qualifyingDuration')} type="number" defaultValue={ch.qualifyingDuration} />
              <div className="grid grid-cols-2 gap-2">
                <Input label={t('event.raceDuration')} type="number" defaultValue={ch.raceDuration} />
                <Select label={t('event.raceDurationType')} options={[{ value: 'time', label: t('event.timeBased') }, { value: 'laps', label: t('event.lapsBased') }]} defaultValue={ch.raceDurationType} />
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionSplitConfig')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={ch.enableMultiSplit}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{t('event.enableMultiSplit')}</span>
                </label>
              </div>
              <div />
              <Input label={t('event.maxEntriesPerSplit')} type="number" defaultValue={ch.maxEntriesPerSplit} />
              <Input label={t('event.maxSplits')} type="number" defaultValue={ch.maxSplits} />
              <Select label={t('event.splitAssignmentRule')} options={SPLIT_RULE_OPTIONS} defaultValue={ch.splitAssignmentRule} />
              <Input label={t('event.minEntries')} type="number" defaultValue={ch.minEntries} />
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionScoringTable')}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">{t('event.position')}</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">{t('event.points')}</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">{t('event.note')} (EN)</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">{t('event.note')} (中文)</th>
                    <th className="px-3 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {scoringRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-1.5">
                        <Input
                          type="number"
                          defaultValue={row.position}
                          className="w-20"
                          onChange={(e) => {
                            const next = [...scoringRows]
                            next[idx] = { ...next[idx], position: Number(e.target.value) }
                            setScoringRows(next)
                          }}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <Input
                          type="number"
                          defaultValue={row.points}
                          className="w-20"
                          onChange={(e) => {
                            const next = [...scoringRows]
                            next[idx] = { ...next[idx], points: Number(e.target.value) }
                            setScoringRows(next)
                          }}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <Input
                          defaultValue={row.note_en || ''}
                          onChange={(e) => {
                            const next = [...scoringRows]
                            next[idx] = { ...next[idx], note_en: e.target.value }
                            setScoringRows(next)
                          }}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <Input
                          defaultValue={row.note_zh || ''}
                          onChange={(e) => {
                            const next = [...scoringRows]
                            next[idx] = { ...next[idx], note_zh: e.target.value }
                            setScoringRows(next)
                          }}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        {scoringRows.length > 1 && (
                          <button
                            className="text-red-500 hover:text-red-700 text-xs"
                            onClick={() => setScoringRows(scoringRows.filter((_, i) => i !== idx))}
                          >
                            {t('event.removeRow')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setScoringRows([...scoringRows, { position: scoringRows.length + 1, points: 0, note_en: '', note_zh: '' }])}
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('event.addRow')}
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionRules')}</h3>
            <div className="space-y-4">
              <Textarea
                label={`${t('event.accessRequirements')} (${editLang === 'en' ? 'EN' : '中文'})`}
                defaultValue={editLang === 'en' ? ch.accessRequirements_en : ch.accessRequirements_zh}
              />
              <Textarea label={`${t('event.rules')} (${editLang === 'en' ? 'EN' : '中文'})`} defaultValue={editLang === 'en' ? ch.rules_en : ch.rules_zh} />
              <Textarea label={`${t('event.scoringRules')} (${editLang === 'en' ? 'EN' : '中文'})`} defaultValue={editLang === 'en' ? ch.scoringRules_en : ch.scoringRules_zh} />
              <Textarea label={`${t('championship.progressionRules')} (${editLang === 'en' ? 'EN' : '中文'})`} defaultValue={editLang === 'en' ? ch.progressionRules_en : ch.progressionRules_zh} />
              <Input label={t('event.cancelRegistrationDeadlineOffset')} defaultValue={ch.cancelRegistrationDeadlineOffset} />
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.resources')}</h3>
            <Textarea label={`${t('event.resources')} (${editLang === 'en' ? 'EN' : '中文'})`} defaultValue={editLang === 'en' ? ch.resources_en : ch.resources_zh} />
          </Card>
        </div>
      )}

      {tab === 'events' && (
        <div className="max-w-5xl mx-auto p-6 space-y-4">
          <Card padding={false}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="text-sm font-medium text-gray-700">{chEvents.length} {t('championship.subEvents')}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{t('event.subEventsInherited')}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary">
                  <Plus className="w-4 h-4 mr-1" />
                  {t('event.addSubEventBtn')}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/results?championshipId=${ch.id}`)}>
                  {t('result.title')}
                </Button>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {chEvents.map((e, i) => {
                const isExpanded = expandedEventId === e.id
                return (
                  <div key={e.id}>
                    <div
                      className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedEventId(isExpanded ? null : e.id)}
                    >
                      <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                      <span className="text-sm font-medium text-gray-400 w-6 shrink-0">#{i + 1}</span>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{getName(e)}</div>
                        <div className="text-xs text-gray-500">{e.track}{e.trackLayout ? ` (${e.trackLayout})` : ''} · {formatDate(e.eventStartTime, lang)}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-500">{e.currentRegistrations} {t('event.registered')}</span>
                        <StatusBadge status={e.status} label={t(`event.status.${e.status}`)} />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-6 pb-4 pl-16" key={`expanded-${editLang}`}>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-700">{t('event.sectionEventDetails')}</h4>
                            <div className="flex gap-1">
                              {e.status !== 'Cancelled' && e.status !== 'Completed' && (
                                <Button variant="danger" size="sm" onClick={() => { setShowCancelEvent(e.id); setCancelReason_en(''); setCancelReason_zh('') }}>
                                  <XCircle className="w-3.5 h-3.5 mr-1" />
                                  Cancel
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/results/${e.id}`)}>
                                {t('event.resultsBtn')}
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input label={`${t('event.eventName')} (${editLang === 'en' ? 'EN' : '中文'})`} defaultValue={editLang === 'en' ? e.name_en : e.name_zh} />
                            <div />
                            <div className="md:col-span-2">
                              <Textarea label={`${t('common.description')} (${editLang === 'en' ? 'EN' : '中文'})`} defaultValue={editLang === 'en' ? e.description_en : e.description_zh} />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Input label={t('event.track')} defaultValue={e.track} />
                            <Input label={t('event.trackLayout')} defaultValue={e.trackLayout} />
                            <Input label={t('event.coverImage')} defaultValue={e.coverImage} />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input label={t('event.registrationOpenAt')} type="datetime-local" defaultValue={e.registrationOpenAt ? e.registrationOpenAt.slice(0, 16) : ''} />
                            <Input label={t('event.registrationCloseAt')} type="datetime-local" defaultValue={e.registrationCloseAt ? e.registrationCloseAt.slice(0, 16) : ''} />
                            <Input label={t('event.cancelRegistrationDeadline')} type="datetime-local" defaultValue={e.cancelRegistrationDeadline ? e.cancelRegistrationDeadline.slice(0, 16) : ''} />
                            <Input label={t('event.eventStartTime')} type="datetime-local" defaultValue={e.eventStartTime ? e.eventStartTime.slice(0, 16) : ''} />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input label={t('event.serverInfo')} defaultValue={e.serverInfo} />
                            <Input label={t('event.serverPassword')} defaultValue={e.serverPassword} />
                            <Input label={t('event.serverJoinLink')} defaultValue={e.serverJoinLink} />
                            <Input label={t('event.streamUrl')} defaultValue={e.streamUrl} />
                            <Input label={t('event.vodUrl')} defaultValue={e.vodUrl} />
                          </div>

                          <Textarea label={`${t('event.resources')} (${editLang === 'en' ? 'EN' : '中文'})`} defaultValue={editLang === 'en' ? e.resources_en : e.resources_zh} />

                          {e.cancelledReason_en && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <p className="text-sm font-medium text-red-700">{t('event.cancellationReason')}</p>
                              <p className="text-sm text-red-600 mt-1">{editLang === 'en' ? e.cancelledReason_en : e.cancelledReason_zh}</p>
                            </div>
                          )}

                          {e.results && e.results.length > 0 && (
                            <div>
                              <h5 className="text-xs font-medium text-gray-500 uppercase mb-2">{t('event.results')} ({e.results.length} {t('event.results').toLowerCase()})</h5>
                              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200 text-xs">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-2 py-2 text-left font-medium text-gray-500">P</th>
                                      <th className="px-2 py-2 text-left font-medium text-gray-500">Driver</th>
                                      <th className="px-2 py-2 text-left font-medium text-gray-500">Time</th>
                                      <th className="px-2 py-2 text-left font-medium text-gray-500">Best Lap</th>
                                      <th className="px-2 py-2 text-left font-medium text-gray-500">Status</th>
                                      <th className="px-2 py-2 text-left font-medium text-gray-500">Pts</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {e.results.slice(0, 5).map(r => (
                                      <tr key={r.driverId}>
                                        <td className="px-2 py-1.5">{r.position}</td>
                                        <td className="px-2 py-1.5 font-medium">{r.driverId}</td>
                                        <td className="px-2 py-1.5">{r.totalTime || '-'}</td>
                                        <td className="px-2 py-1.5">{r.bestLap || '-'}</td>
                                        <td className="px-2 py-1.5">{r.status}</td>
                                        <td className="px-2 py-1.5">{r.points}</td>
                                      </tr>
                                    ))}
                                    {e.results.length > 5 && (
                                      <tr><td colSpan={6} className="px-2 py-1.5 text-center text-gray-400">+{e.results.length - 5} {t('event.moreEntries')} — <button className="text-blue-600" onClick={() => navigate(`/results/${e.id}`)}>{t('event.viewAll')}</button></td></tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {chEvents.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-400 text-sm">{t('event.noSubEvents')}</div>
              )}
            </div>
          </Card>
        </div>
      )}

      <Modal isOpen={!!showCancelEvent} onClose={() => setShowCancelEvent(null)} title={t('event.cancelSubEvent')} size="md">
        {showCancelEvent && (() => {
          const evt = chEvents.find(e => e.id === showCancelEvent)
          if (!evt) return null
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{t('event.cancelSubEventQuestion')} <span className="font-medium">{getName(evt)}</span>. {t('event.cancelSubEventNotify')} ({evt.currentRegistrations} {t('event.registered')})</p>
              <Textarea label={t('event.cancelReasonEn')} value={cancelReason_en} onChange={(e) => setCancelReason_en(e.target.value)} placeholder="Reason for cancellation (English)..." />
              <Textarea label={t('event.cancelReasonZh')} value={cancelReason_zh} onChange={(e) => setCancelReason_zh(e.target.value)} placeholder="取消原因（中文）..." />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowCancelEvent(null)}>{t('common.cancel')}</Button>
                <Button variant="danger">{t('event.confirmCancelSubEvent')}</Button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </>
  )
}
