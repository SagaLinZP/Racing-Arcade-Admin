import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { useManagedOptions } from '@/hooks/useManagedOptions'
import { news, addNews, updateNews, type NewsArticle } from '@/data/news'
import { addNotification } from '@/data/notifications'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { ArrowLeft, Save, Send } from 'lucide-react'

type NewsRegion = 'CN' | 'AP' | 'AM' | 'EU'

export function NewsEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const { state } = useApp()
  const lang = state.language
  const categoryOptions = useManagedOptions('newsCategory', lang)
  const isNew = id === 'create'
  const [editLang, setEditLang] = useState<'en' | 'zh'>('en')

  const article = useMemo(() => isNew ? null : news.find(n => n.id === id), [id, isNew])

  const [titleEn, setTitleEn] = useState(article?.title_en ?? '')
  const [titleZh, setTitleZh] = useState(article?.title_zh ?? '')
  const [contentEn, setContentEn] = useState(article?.content_en ?? '')
  const [contentZh, setContentZh] = useState(article?.content_zh ?? '')
  const [category, setCategory] = useState<NewsArticle['category']>(article?.category ?? 'event')
  const [author, setAuthor] = useState(article?.author ?? '')
  const [coverImage, setCoverImage] = useState(article?.coverImage ?? '')
  const [regions, setRegions] = useState<NewsRegion[]>(article?.regions ?? ['CN', 'AP', 'AM', 'EU'])
  const [isPinned, setIsPinned] = useState(article?.isPinned ?? false)

  const toggleRegion = (r: NewsRegion) => {
    setRegions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])
  }

  const save = (notify: boolean) => {
    const payload: NewsArticle = {
      id: article?.id ?? `news_${news.length + 1}`,
      title_zh: titleZh || titleEn,
      title_en: titleEn || titleZh,
      content_zh: contentZh || contentEn,
      content_en: contentEn || contentZh,
      coverImage,
      category,
      regions,
      isPinned,
      publishedAt: article?.publishedAt ?? new Date().toISOString(),
      author: author || 'Admin',
    }
    if (isNew) addNews(payload)
    else updateNews(payload)
    if (notify) {
      addNotification({
        id: `ntf_news_${payload.id}`,
        type: 'system',
        title_zh: '新闻发布',
        title_en: 'News Published',
        body_zh: payload.title_zh,
        body_en: payload.title_en,
        link: '/news',
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }
    navigate('/news')
  }

  const canSave = !!(titleEn.trim() || titleZh.trim())

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/news')}><ArrowLeft className="w-4 h-4" /></Button>
          <h1 className="text-2xl font-bold text-gray-900">{isNew ? t('news.createArticle') : t('news.editArticle')}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => save(false)} disabled={!canSave}><Save className="w-4 h-4 mr-1" />{t('news.saveDraft')}</Button>
          <Button onClick={() => save(true)} disabled={!canSave}><Send className="w-4 h-4 mr-1" />{t('news.publish')}</Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">{t('common.language')}:</span>
        <button className={`px-3 py-1 text-sm rounded ${editLang === 'en' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600'}`} onClick={() => setEditLang('en')}>EN</button>
        <button className={`px-3 py-1 text-sm rounded ${editLang === 'zh' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600'}`} onClick={() => setEditLang('zh')}>中文</button>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={`${t('news.articleTitle')} (${editLang === 'en' ? 'EN' : '中文'})`}
            value={editLang === 'en' ? titleEn : titleZh}
            onChange={(e) => (editLang === 'en' ? setTitleEn(e.target.value) : setTitleZh(e.target.value))}
          />
          <div className="flex gap-4">
            <Select label={t('news.category')} options={categoryOptions} value={category} onChange={(e) => setCategory(e.target.value as NewsArticle['category'])} />
            <Input label={t('news.author')} value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Textarea
              label={`${t('news.content')} (${editLang === 'en' ? 'EN' : '中文'})`}
              value={editLang === 'en' ? contentEn : contentZh}
              onChange={(e) => (editLang === 'en' ? setContentEn(e.target.value) : setContentZh(e.target.value))}
              rows={10}
            />
          </div>
          <Input label={t('news.coverImage')} value={coverImage} onChange={(e) => setCoverImage(e.target.value)} />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-3">{t('common.regions')}</h3>
        <div className="flex gap-4">
          {(['CN', 'AP', 'AM', 'EU'] as const).map(r => (
            <label key={r} className="flex items-center gap-2">
              <input type="checkbox" checked={regions.includes(r)} onChange={() => toggleRegion(r)} className="rounded border-gray-300" />
              <span className="text-sm">{r}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="rounded border-gray-300" />
          <span className="text-sm font-medium text-gray-700">{t('news.isPinned')}</span>
        </label>
      </Card>
    </div>
  )
}
