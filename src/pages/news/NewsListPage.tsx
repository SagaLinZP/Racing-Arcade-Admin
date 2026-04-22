import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { news } from '@/data/news'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Plus, Pencil, Trash2, Pin } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export function NewsListPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()

  const columns = [
    {
      key: 'title', header: t('news.articleTitle'),
      render: (n: typeof news[0]) => (
        <div className="flex items-center gap-2">
          {n.isPinned && <Pin className="w-3.5 h-3.5 text-orange-500" />}
          <span className="font-medium">{lang === 'zh' ? n.title_zh : n.title_en}</span>
        </div>
      ),
    },
    { key: 'category', header: t('news.category'), render: (n: typeof news[0]) => <span className="text-xs px-2 py-0.5 bg-gray-100 rounded capitalize">{n.category}</span> },
    { key: 'regions', header: t('common.regions'), render: (n: typeof news[0]) => <span className="text-xs text-gray-500">{n.regions.join(', ')}</span> },
    { key: 'publishedAt', header: t('news.publishedAt'), render: (n: typeof news[0]) => <span className="text-xs">{formatDate(n.publishedAt, lang)}</span> },
    { key: 'author', header: t('news.author') },
    {
      key: 'actions', header: t('common.actions'),
      render: (n: typeof news[0]) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/news/${n.id}/edit`)}><Pencil className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="sm"><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('news.title')}</h1>
        <Button onClick={() => navigate('/news/create')}><Plus className="w-4 h-4 mr-1" />{t('news.createArticle')}</Button>
      </div>
      <Card padding={false}>
        <DataTable columns={columns} data={news} keyExtractor={(n) => n.id} />
      </Card>
    </div>
  )
}
