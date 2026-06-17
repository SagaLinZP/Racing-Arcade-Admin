import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useManagedOptions } from '@/hooks/useManagedOptions'
import { useApp } from '@/hooks/useAppStore'

interface FormState {
  name_en: string
  name_zh: string
  description_en: string
  description_zh: string
  game: string
  carClass: string
  carList: string
  regions: string[]
  accessRequirements_en: string
  accessRequirements_zh: string
  resources_en: string
  resources_zh: string
  scoringNote_en: string
  scoringNote_zh: string
  streamUrl: string
  coverImage: string
}

const emptyForm = (): FormState => ({
  name_en: '', name_zh: '',
  description_en: '', description_zh: '',
  game: 'ACC', carClass: '', carList: '',
  regions: ['CN'],
  accessRequirements_en: '', accessRequirements_zh: '',
  resources_en: '', resources_zh: '',
  scoringNote_en: '', scoringNote_zh: '',
  streamUrl: '',
  coverImage: '',
})

export function CompetitionCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state } = useApp()
  const lang = state.language
  const carClassOptions = useManagedOptions('carClass', lang)
  const gameOptions = useManagedOptions('game', lang)
  const regionOptions = useManagedOptions('region', lang)
  const [editLang, setEditLang] = useState<'en' | 'zh'>('en')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [scoringRows, setScoringRows] = useState([{ position: 1, points: 25, note_en: '', note_zh: '' }])

  const update = (field: keyof FormState, value: string | number | boolean | string[]) => {
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

  const addScoringRow = () => {
    setScoringRows(prev => [...prev, { position: prev.length + 1, points: 0, note_en: '', note_zh: '' }])
  }
  const removeScoringRow = (idx: number) => {
    setScoringRows(prev => prev.filter((_, i) => i !== idx).map((row, i) => ({ ...row, position: i + 1 })))
  }
  const updateScoringRow = (idx: number, field: string, value: string | number) => {
    setScoringRows(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row))
  }

  const handleSave = () => {
    navigate('/competitions')
  }

  return (
    <>
      <div className="sticky top-0 z-10 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/competitions')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">{t('competition.createCompetition')}</h1>
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
              <Button variant="secondary" onClick={handleSave}>
                <Save className="w-4 h-4 mr-1" />
                {t('event.saveAsDraft')}
              </Button>
              <Button onClick={handleSave}>
                {t('event.publishNow')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionBasicInfo')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={`${t('competition.competitionName')} (${editLang === 'en' ? 'EN' : '中文'})`}
              value={editLang === 'en' ? form.name_en : form.name_zh}
              onChange={(e) => update(editLang === 'en' ? 'name_en' : 'name_zh', e.target.value)}
            />
            <Select label={t('event.game')} options={gameOptions} value={form.game} onChange={(e) => update('game', e.target.value)} />
            <Select label={t('event.carClass')} options={carClassOptions.length > 0 ? carClassOptions : [{ value: '', label: '' }]} value={form.carClass} onChange={(e) => update('carClass', e.target.value)} />
            <Input label={t('event.carList')} placeholder={t('event.carListPlaceholder')} value={form.carList} onChange={(e) => update('carList', e.target.value)} />
            <Input label={t('event.streamUrl')} value={form.streamUrl} onChange={(e) => update('streamUrl', e.target.value)} />
            <div className="md:col-span-2 max-w-sm">
              <ImageUpload label={t('event.coverImage')} value={form.coverImage} onChange={(v) => update('coverImage', v)} />
            </div>
            <div className="md:col-span-2">
              <Textarea
                label={`${t('common.description')} (${editLang === 'en' ? 'EN' : '中文'})`}
                value={editLang === 'en' ? form.description_en : form.description_zh}
                onChange={(e) => update(editLang === 'en' ? 'description_en' : 'description_zh', e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('common.regions')}</h3>
          <div className="flex flex-wrap gap-3">
            {regionOptions.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={form.regions.includes(opt.value)}
                  onChange={() => toggleRegion(opt.value)}
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
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
                  <th className="py-2 pr-3 font-medium">{t('event.note')} ({editLang === 'en' ? 'EN' : '中文'})</th>
                  <th className="py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {scoringRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-2 pr-3">
                      <input type="number" className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" value={row.position} readOnly />
                    </td>
                    <td className="py-2 pr-3">
                      <input type="number" className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" value={row.points} onChange={(e) => updateScoringRow(idx, 'points', Number(e.target.value))} />
                    </td>
                    <td className="py-2 pr-3">
                      <input type="text" className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" value={editLang === 'en' ? row.note_en : row.note_zh} onChange={(e) => updateScoringRow(idx, editLang === 'en' ? 'note_en' : 'note_zh', e.target.value)} />
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
            <Textarea
              label={`${t('event.scoringNote')} (${editLang === 'en' ? 'EN' : '中文'})`}
              value={editLang === 'en' ? form.scoringNote_en : form.scoringNote_zh}
              onChange={(e) => update(editLang === 'en' ? 'scoringNote_en' : 'scoringNote_zh', e.target.value)}
            />
          </div>
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={addScoringRow}>
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
              value={editLang === 'en' ? form.accessRequirements_en : form.accessRequirements_zh}
              onChange={(e) => update(editLang === 'en' ? 'accessRequirements_en' : 'accessRequirements_zh', e.target.value)}
            />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.resources')}</h3>
          <Textarea
            label={`Resources (${editLang === 'en' ? 'EN' : '中文'})`}
            value={editLang === 'en' ? form.resources_en : form.resources_zh}
            onChange={(e) => update(editLang === 'en' ? 'resources_en' : 'resources_zh', e.target.value)}
          />
        </Card>
      </div>
    </>
  )
}
