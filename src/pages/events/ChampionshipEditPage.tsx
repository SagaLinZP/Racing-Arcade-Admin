import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { championships } from '@/data/championships'
import { events } from '@/data/events'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ArrowLeft, Save } from 'lucide-react'

export function ChampionshipEditPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()
  const { id } = useParams()
  const [editLang, setEditLang] = useState<'en' | 'zh'>('en')

  const ch = useMemo(() => championships.find(c => c.id === id), [id])
  const chEvents = useMemo(() => ch ? events.filter(e => ch.eventIds.includes(e.id)) : [], [ch])

  if (!ch) return <div className="text-center py-12 text-gray-500">Championship not found</div>

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/championships')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('championship.editChampionship')}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={ch.status} label={ch.status} />
              <span className="text-sm text-gray-500">{lang === 'zh' ? ch.name_zh : ch.name_en}</span>
            </div>
          </div>
        </div>
        <Button variant="secondary"><Save className="w-4 h-4 mr-1" />{t('common.save')}</Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Language:</span>
        <button className={`px-3 py-1 text-sm rounded ${editLang === 'en' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600'}`} onClick={() => setEditLang('en')}>English</button>
        <button className={`px-3 py-1 text-sm rounded ${editLang === 'zh' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600'}`} onClick={() => setEditLang('zh')}>中文</button>
      </div>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">Championship Info</h3>
        <div className="space-y-4">
          <Input label={`Name (${editLang === 'en' ? 'EN' : '中文'})`} defaultValue={editLang === 'en' ? ch.name_en : ch.name_zh} />
          <Textarea label={`Description (${editLang === 'en' ? 'EN' : '中文'})`} defaultValue={editLang === 'en' ? ch.description_en : ch.description_zh} />
          <Textarea label={`Rules (${editLang === 'en' ? 'EN' : '中文'})`} defaultValue={editLang === 'en' ? ch.rules_en : ch.rules_zh} />
          <Textarea label={`Scoring Rules (${editLang === 'en' ? 'EN' : '中文'})`} defaultValue={editLang === 'en' ? ch.scoringRules_en : ch.scoringRules_zh} />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('championship.subEvents')} ({chEvents.length})</h3>
        <div className="space-y-2">
          {chEvents.map((e, i) => (
            <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500">#{i + 1}</span>
                <div>
                  <div className="text-sm font-medium">{lang === 'zh' ? e.name_zh : e.name_en}</div>
                  <div className="text-xs text-gray-500">{e.track} · {new Date(e.eventStartTime).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={e.status} label={t(`event.status.${e.status}`)} />
                <Button variant="ghost" size="sm" onClick={() => navigate(`/events/${e.id}/edit`)}>Edit</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
