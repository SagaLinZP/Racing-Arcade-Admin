import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { teams } from '@/data/teams'
import { drivers } from '@/data/drivers'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export function TeamDetailPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()
  const { id } = useParams()

  const team = useMemo(() => teams.find(tm => tm.id === id), [id])
  if (!team) return <div className="text-center py-12 text-gray-500">Team not found</div>

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/teams')}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('team.teamDetail')}</h1>
            <p className="text-sm text-gray-500">{team.name} - {team.region}</p>
          </div>
        </div>
        <Button variant="danger" size="sm"><Trash2 className="w-4 h-4 mr-1" />{t('team.dissolveTeam')}</Button>
      </div>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b">{t('team.members')} ({team.members.length})</h3>
        <div className="space-y-2">
          {team.members.map(m => {
            const d = drivers.find(dr => dr.id === m.userId)
            return (
              <div key={m.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">{d?.nickname?.charAt(0) || '?'}</div>
                  <div>
                    <span className="text-sm font-medium">{d?.nickname || m.userId}</span>
                    <span className="text-xs text-gray-400 ml-2">({m.role})</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400">Joined {formatDate(m.joinedAt, lang)}</span>
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b">Statistics</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-xl font-bold">{team.totalEntries}</div>
            <div className="text-xs text-gray-500">{t('team.totalEntries')}</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-xl font-bold">P{team.bestResult}</div>
            <div className="text-xs text-gray-500">Best Result</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-xl font-bold">{team.totalPoints.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{t('team.totalPoints')}</div>
          </div>
        </div>
      </Card>

      <Card>
        <p className="text-sm text-gray-700">{team.description}</p>
      </Card>
    </div>
  )
}
