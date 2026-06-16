import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Globe } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { sessionTemplates, createDefaultTemplate, createDefaultGameConfig } from '@/data/competitions'
import type { SessionTemplate, SessionGameConfig, GamePlatform, SessionType } from '@/data/competitions'
import { GameConfigEditor } from '@/pages/competitions/GameConfigEditor'
import { SESSION_TYPE_OPTIONS_T } from '@/pages/competitions/gameConfigOptions'

export function TemplateEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id

  const existing = isEdit ? sessionTemplates.find(tpl => tpl.id === id) : undefined

  const [editLang, setEditLang] = useState<'en' | 'zh'>('en')
  const [form, setForm] = useState<SessionTemplate>(() => {
    if (existing) return { ...existing, gameConfig: { ...existing.gameConfig } }
    return createDefaultTemplate('ACC')
  })

  const setMeta = <K extends keyof SessionTemplate>(key: K, value: SessionTemplate[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const setGC = (key: keyof SessionGameConfig, value: string | number | boolean) =>
    setForm(prev => ({ ...prev, gameConfig: { ...prev.gameConfig, [key]: value } }))

  const handleGameChange = (newGame: GamePlatform) => {
    setForm(prev => ({
      ...prev,
      game: newGame,
      gameConfig: createDefaultGameConfig(newGame),
    }))
  }

  const handleSave = () => {
    const now = new Date().toISOString()
    if (isEdit) {
      const idx = sessionTemplates.findIndex(tpl => tpl.id === id)
      if (idx >= 0) {
        sessionTemplates[idx] = { ...form, updatedAt: now }
      }
    } else {
      sessionTemplates.push({ ...form, createdAt: now, updatedAt: now })
    }
    navigate('/templates')
  }

  return (
    <>
      <div className="sticky top-0 w-full bg-white border-b border-gray-200 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/templates')}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t('common.back')}
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              {isEdit ? t('template.editTemplate') : t('template.createTemplate')}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditLang(prev => prev === 'en' ? 'zh' : 'en')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <Globe className="w-4 h-4" />
              {editLang === 'en' ? 'EN' : '中文'}
            </button>
            <Button variant="primary" onClick={handleSave}>{t('common.save')}</Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('template.templateInfo')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label={`${t('template.templateName')} (${editLang === 'en' ? 'EN' : '中文'})`}
              value={editLang === 'en' ? form.name_en : form.name_zh}
              onChange={(e) => setMeta(editLang === 'en' ? 'name_en' : 'name_zh', e.target.value)}
            />
            <Input
              label={`${t('common.description')} (${editLang === 'en' ? 'EN' : '中文'})`}
              value={editLang === 'en' ? (form.description_en || '') : (form.description_zh || '')}
              onChange={(e) => setMeta(editLang === 'en' ? 'description_en' : 'description_zh', e.target.value)}
            />
            {isEdit ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('event.game')}</label>
                <div className="px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-md border border-gray-200">{form.game}</div>
              </div>
            ) : (
              <Select
                label={t('event.game')}
                options={[{ value: 'ACC', label: 'ACC' }, { value: 'AC', label: 'AC' }]}
                value={form.game}
                onChange={(e) => handleGameChange(e.target.value as GamePlatform)}
              />
            )}
            <Select
              label={t('competition.sessionType')}
              options={SESSION_TYPE_OPTIONS_T(t)}
              value={form.sessionType}
              onChange={(e) => setMeta('sessionType', e.target.value as SessionType)}
            />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('template.gameConfig')}</h3>
          <GameConfigEditor
            gameConfig={form.gameConfig}
            game={form.game}
            onChange={setGC}
          />
        </Card>
      </div>
    </>
  )
}
