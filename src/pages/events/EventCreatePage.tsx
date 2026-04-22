import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { eventTemplates } from '@/data/admin'
import { ArrowLeft, Save, Send } from 'lucide-react'
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

const CAR_CLASS_OPTIONS = [
  { value: 'GT3', label: 'GT3' },
  { value: 'GT4', label: 'GT4' },
  { value: 'Formula', label: 'Formula' },
  { value: 'Porsche Cup', label: 'Porsche Cup' },
  { value: 'LMP2', label: 'LMP2' },
]

const REGION_OPTIONS = [
  { value: 'CN', label: 'China (CN)' },
  { value: 'AP', label: 'Asia Pacific (AP)' },
  { value: 'AM', label: 'Americas (AM)' },
  { value: 'EU', label: 'Europe & Africa (EU)' },
]

const WEATHER_OPTIONS = [
  { value: 'Clear', label: 'Clear' },
  { value: 'Overcast', label: 'Overcast' },
  { value: 'Dynamic', label: 'Dynamic' },
]

const SPLIT_RULE_OPTIONS = [
  { value: 'By Skill', label: 'By Skill' },
  { value: 'Random', label: 'Random' },
  { value: 'Manual', label: 'Manual' },
  { value: 'First Come First Served', label: 'First Come First Served' },
]

export function EventCreatePage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()
  const [editLang, setEditLang] = useState<'en' | 'zh'>('en')

  const [form, setForm] = useState({
    name_en: '', name_zh: '',
    description_en: '', description_zh: '',
    game: 'ACC', track: '', trackLayout: '',
    carClass: 'GT3',
    regions: ['CN'] as string[],
    weather: 'Clear', hasPitstop: true,
    practiceDuration: 30, qualifyingDuration: 15, raceDuration: 60,
    raceDurationType: 'time' as 'time' | 'laps',
    maxEntriesPerSplit: 30, maxSplits: 2, enableMultiSplit: true,
    splitAssignmentRule: 'By Skill',
    minEntries: 10,
    registrationOpenAt: '', registrationCloseAt: '',
    cancelRegistrationDeadline: '',
    eventStartTime: '',
    accessRequirements_en: '', accessRequirements_zh: '',
    rules_en: '', rules_zh: '',
    serverInfo: '', serverPassword: '', serverJoinLink: '',
    streamUrl: '', vodUrl: '',
    scoringRules_en: '', scoringRules_zh: '',
    resources_en: '', resources_zh: '',
  })

  const updateForm = (field: string, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const toggleRegion = (region: string) => {
    setForm(prev => ({
      ...prev,
      regions: prev.regions.includes(region)
        ? prev.regions.filter(r => r !== region)
        : [...prev.regions, region],
    }))
  }

  const handleTemplate = (tplId: string) => {
    const tpl = eventTemplates.find(t => t.id === tplId)
    if (tpl) {
      setForm(prev => ({
        ...prev,
        game: tpl.game,
        carClass: tpl.carClass,
        raceDuration: tpl.raceDuration,
        raceDurationType: tpl.raceDurationType,
        maxEntriesPerSplit: tpl.maxEntriesPerSplit,
        enableMultiSplit: tpl.enableMultiSplit,
        hasPitstop: tpl.hasPitstop,
      }))
    }
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
              <h1 className="text-2xl font-bold text-gray-900">{t('event.createEvent')}</h1>
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
              <Button variant="secondary" onClick={() => navigate('/events')}>
                <Save className="w-4 h-4 mr-1" />
                {t('event.saveAsDraft')}
              </Button>
              <Button>
                <Send className="w-4 h-4 mr-1" />
                {t('event.publishNow')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-2">{t('event.createFrom')}</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm">{t('event.blankEvent')}</Button>
          {eventTemplates.map(tpl => (
            <Button key={tpl.id} variant="secondary" size="sm" onClick={() => handleTemplate(tpl.id)}>
              {tpl.name}
            </Button>
          ))}
        </div>
      </Card>

      {/* Basic Info */}
      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionBasicInfo')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={`${t('event.eventName')} (${editLang === 'en' ? 'English' : '中文'})`}
            value={editLang === 'en' ? form.name_en : form.name_zh}
            onChange={(e) => updateForm(editLang === 'en' ? 'name_en' : 'name_zh', e.target.value)}
          />
          <div />
          <div className="md:col-span-2">
            <Textarea
              label={`${t('common.description')} (${editLang === 'en' ? 'English' : '中文'})`}
              value={editLang === 'en' ? form.description_en : form.description_zh}
              onChange={(e) => updateForm(editLang === 'en' ? 'description_en' : 'description_zh', e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Game & Track */}
      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionGameTrack')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select label={t('event.game')} options={GAME_OPTIONS} value={form.game} onChange={(e) => updateForm('game', e.target.value)} />
          <Input label={t('event.track')} value={form.track} onChange={(e) => updateForm('track', e.target.value)} />
          <Input label={t('event.trackLayout')} value={form.trackLayout} onChange={(e) => updateForm('trackLayout', e.target.value)} />
          <Select label={t('event.carClass')} options={CAR_CLASS_OPTIONS} value={form.carClass} onChange={(e) => updateForm('carClass', e.target.value)} />
          <Select label={t('event.weather')} options={WEATHER_OPTIONS} value={form.weather} onChange={(e) => updateForm('weather', e.target.value)} />
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.hasPitstop} onChange={(e) => updateForm('hasPitstop', e.target.checked)} className="rounded border-gray-300" />
              <span className="text-sm text-gray-700">{t('event.hasPitstop')}</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Regions */}
      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('common.regions')}</h3>
        <div className="flex flex-wrap gap-3">
          {REGION_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.regions.includes(opt.value)} onChange={() => toggleRegion(opt.value)} className="rounded border-gray-300" />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Race Format */}
      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionRaceFormat')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label={t('event.practiceDuration')} type="number" value={form.practiceDuration} onChange={(e) => updateForm('practiceDuration', Number(e.target.value))} />
          <Input label={t('event.qualifyingDuration')} type="number" value={form.qualifyingDuration} onChange={(e) => updateForm('qualifyingDuration', Number(e.target.value))} />
          <div className="grid grid-cols-2 gap-2">
            <Input label={t('event.raceDuration')} type="number" value={form.raceDuration} onChange={(e) => updateForm('raceDuration', Number(e.target.value))} />
            <Select label={t('event.raceDurationType')} options={[{ value: 'time', label: 'Minutes' }, { value: 'laps', label: 'Laps' }]} value={form.raceDurationType} onChange={(e) => updateForm('raceDurationType', e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Split Configuration */}
      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionSplitConfig')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.enableMultiSplit} onChange={(e) => updateForm('enableMultiSplit', e.target.checked)} className="rounded border-gray-300" />
            <span className="text-sm text-gray-700">{t('event.enableMultiSplit')}</span>
          </label>
          <div />
          <Input label={t('event.maxEntriesPerSplit')} type="number" value={form.maxEntriesPerSplit} onChange={(e) => updateForm('maxEntriesPerSplit', Number(e.target.value))} />
          <Input label={t('event.maxSplits')} type="number" value={form.maxSplits} onChange={(e) => updateForm('maxSplits', Number(e.target.value))} />
          <Select label={t('event.splitAssignmentRule')} options={SPLIT_RULE_OPTIONS} value={form.splitAssignmentRule} onChange={(e) => updateForm('splitAssignmentRule', e.target.value)} />
          <Input label={t('event.minEntries')} type="number" value={form.minEntries} onChange={(e) => updateForm('minEntries', Number(e.target.value))} />
        </div>
      </Card>

      {/* Schedule */}
      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionSchedule')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={t('event.registrationOpenAt')} type="datetime-local" value={form.registrationOpenAt} onChange={(e) => updateForm('registrationOpenAt', e.target.value)} />
          <Input label={t('event.registrationCloseAt')} type="datetime-local" value={form.registrationCloseAt} onChange={(e) => updateForm('registrationCloseAt', e.target.value)} />
          <Input label={t('event.cancelRegistrationDeadline')} type="datetime-local" value={form.cancelRegistrationDeadline} onChange={(e) => updateForm('cancelRegistrationDeadline', e.target.value)} />
          <Input label={t('event.eventStartTime')} type="datetime-local" value={form.eventStartTime} onChange={(e) => updateForm('eventStartTime', e.target.value)} />
        </div>
      </Card>

      {/* Rules & Access */}
      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionRulesAccess')}</h3>
        <div className="space-y-4">
          <Textarea
            label={`${t('event.accessRequirements')} (${editLang === 'en' ? 'English' : '中文'})`}
            value={editLang === 'en' ? form.accessRequirements_en : form.accessRequirements_zh}
            onChange={(e) => updateForm(editLang === 'en' ? 'accessRequirements_en' : 'accessRequirements_zh', e.target.value)}
          />
          <Textarea
            label={`${t('event.rules')} (${editLang === 'en' ? 'English' : '中文'})`}
            value={editLang === 'en' ? form.rules_en : form.rules_zh}
            onChange={(e) => updateForm(editLang === 'en' ? 'rules_en' : 'rules_zh', e.target.value)}
          />
          <Textarea
            label={`${t('event.scoringRules')} (${editLang === 'en' ? 'English' : '中文'})`}
            value={editLang === 'en' ? form.scoringRules_en : form.scoringRules_zh}
            onChange={(e) => updateForm(editLang === 'en' ? 'scoringRules_en' : 'scoringRules_zh', e.target.value)}
          />
        </div>
      </Card>

      {/* Server & Streaming */}
      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionServerStreaming')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={t('event.serverInfo')} value={form.serverInfo} onChange={(e) => updateForm('serverInfo', e.target.value)} />
          <Input label={t('event.serverPassword')} value={form.serverPassword} onChange={(e) => updateForm('serverPassword', e.target.value)} />
          <Input label={t('event.serverJoinLink')} value={form.serverJoinLink} onChange={(e) => updateForm('serverJoinLink', e.target.value)} />
          <Input label={t('event.streamUrl')} value={form.streamUrl} onChange={(e) => updateForm('streamUrl', e.target.value)} />
          <Input label={t('event.vodUrl')} value={form.vodUrl} onChange={(e) => updateForm('vodUrl', e.target.value)} />
        </div>
      </Card>

      {/* Resources */}
      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.resources')}</h3>
        <Textarea
          label={`${t('event.resources')} (${editLang === 'en' ? 'English' : '中文'})`}
          value={editLang === 'en' ? form.resources_en : form.resources_zh}
          onChange={(e) => updateForm(editLang === 'en' ? 'resources_en' : 'resources_zh', e.target.value)}
          placeholder="Download links, installation instructions..."
        />
      </Card>
      </div>
    </>
  )
}
