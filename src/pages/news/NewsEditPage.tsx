import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { news } from '@/data/news'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { ArrowLeft, Save, Send } from 'lucide-react'

const CATEGORY_OPTIONS = [
  { value: 'event', label: 'Event Announcement' },
  { value: 'platform', label: 'Platform Update' },
  { value: 'review', label: 'Race Review' },
  { value: 'other', label: 'Other' },
]

export function NewsEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const isNew = id === 'create'
  const [editLang, setEditLang] = useState<'en' | 'zh'>('en')

  const article = useMemo(() => isNew ? null : news.find(n => n.id === id), [id, isNew])

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/news')}><ArrowLeft className="w-4 h-4" /></Button>
          <h1 className="text-2xl font-bold text-gray-900">{isNew ? t('news.createArticle') : t('news.editArticle')}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary"><Save className="w-4 h-4 mr-1" />Save Draft</Button>
          <Button><Send className="w-4 h-4 mr-1" />Publish</Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Language:</span>
        <button className={`px-3 py-1 text-sm rounded ${editLang === 'en' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600'}`} onClick={() => setEditLang('en')}>English</button>
        <button className={`px-3 py-1 text-sm rounded ${editLang === 'zh' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600'}`} onClick={() => setEditLang('zh')}>Chinese</button>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={`Title (${editLang === 'en' ? 'EN' : 'Chinese'})`} defaultValue={article ? (editLang === 'en' ? article.title_en : article.title_zh) : ''} />
          <div className="flex gap-4">
            <Select label="Category" options={CATEGORY_OPTIONS} value={article?.category || 'event'} />
            <Input label="Author" defaultValue={article?.author || ''} />
          </div>
          <div className="md:col-span-2">
            <Textarea label={`Content (${editLang === 'en' ? 'EN' : 'Chinese'})`} defaultValue={article ? (editLang === 'en' ? article.content_en : article.content_zh) : ''} rows={10} />
          </div>
          <Input label="Cover Image URL" defaultValue={article?.coverImage || ''} />
          <Input label="Related Event IDs" placeholder="e.g., e1, e2" defaultValue={article?.relatedEventIds?.join(', ') || ''} />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Regions</h3>
        <div className="flex gap-4">
          {(['CN', 'AP', 'AM', 'EU'] as const).map(r => (
            <label key={r} className="flex items-center gap-2">
              <input type="checkbox" defaultChecked={article?.regions.includes(r) || false} className="rounded border-gray-300" />
              <span className="text-sm">{r}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked={article?.isPinned || false} className="rounded border-gray-300" />
          <span className="text-sm font-medium text-gray-700">Pin this article</span>
        </label>
      </Card>
    </div>
  )
}
