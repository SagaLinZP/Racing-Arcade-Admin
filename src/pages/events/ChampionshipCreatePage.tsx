import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { ArrowLeft, Save, Send, Plus, Trash2 } from 'lucide-react'

const GAME_OPTIONS = [
  { value: 'ACC', label: 'ACC PC' },
  { value: 'AC', label: 'AC PC' },
  { value: 'AC Evo', label: 'AC Evo PC' },
  { value: 'iRacing', label: 'iRacing PC' },
  { value: 'LMU', label: 'LMU PC' },
]

const CAR_CLASS_OPTIONS = [
  { value: 'GT3', label: 'GT3' },
  { value: 'GT4', label: 'GT4' },
  { value: 'Formula', label: 'Formula' },
]

export function ChampionshipCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [editLang, setEditLang] = useState<'en' | 'zh'>('en')
  const [subEvents, setSubEvents] = useState<Array<{ name: string; track: string }>>([])

  const addSubEvent = () => setSubEvents(prev => [...prev, { name: '', track: '' }])
  const removeSubEvent = (idx: number) => setSubEvents(prev => prev.filter((_, i) => i !== idx))

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/championships')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{t('championship.createChampionship')}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary"><Save className="w-4 h-4 mr-1" />{t('event.saveAsDraft')}</Button>
          <Button><Send className="w-4 h-4 mr-1" />{t('event.publishNow')}</Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Language:</span>
        <button className={`px-3 py-1 text-sm rounded ${editLang === 'en' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600'}`} onClick={() => setEditLang('en')}>English</button>
        <button className={`px-3 py-1 text-sm rounded ${editLang === 'zh' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600'}`} onClick={() => setEditLang('zh')}>中文</button>
      </div>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">Championship Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={`Championship Name (${editLang === 'en' ? 'EN' : '中文'})`} />
          <Select label="Game" options={GAME_OPTIONS} />
          <Select label="Car Class" options={CAR_CLASS_OPTIONS} />
          <Input label="Stream URL" />
          <div className="md:col-span-2"><Textarea label={`Description (${editLang === 'en' ? 'EN' : '中文'})`} /></div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">Race Format</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Practice Duration (min)" type="number" defaultValue={30} />
          <Input label="Qualifying Duration (min)" type="number" defaultValue={15} />
          <Input label="Race Duration" type="number" defaultValue={60} />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">Split & Scoring</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Max Entries Per Split" type="number" defaultValue={30} />
          <Input label="Max Splits" type="number" defaultValue={2} />
          <Input label="Min Entries" type="number" defaultValue={10} />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">Rules</h3>
        <div className="space-y-4">
          <Textarea label={`Rules (${editLang === 'en' ? 'EN' : '中文'})`} />
          <Textarea label={`Scoring Rules (${editLang === 'en' ? 'EN' : '中文'})`} />
          <Textarea label={`Progression Rules (${editLang === 'en' ? 'EN' : '中文'})`} />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4 pb-2 border-b">
          <h3 className="text-sm font-medium text-gray-700">{t('championship.subEvents')}</h3>
          <Button size="sm" variant="secondary" onClick={addSubEvent}>
            <Plus className="w-4 h-4 mr-1" />
            {t('championship.addSubEvent')}
          </Button>
        </div>
        {subEvents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No sub-events added yet. Click "Add Sub Event" to begin.</p>
        ) : (
          <div className="space-y-3">
            {subEvents.map((se, idx) => (
              <div key={idx} className="flex gap-3 items-end p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-500 pb-2">#{idx + 1}</span>
                <Input label="Event Name" className="flex-1" />
                <Input label="Track" className="flex-1" />
                <Input label="Event Start" type="datetime-local" className="flex-1" />
                <Button variant="ghost" size="sm" onClick={() => removeSubEvent(idx)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
