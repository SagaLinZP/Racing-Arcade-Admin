import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { teams } from '@/data/teams'
import { drivers } from '@/data/drivers'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { Eye } from 'lucide-react'

export function TeamListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return teams
    return teams.filter(tm => tm.name.toLowerCase().includes(search.toLowerCase()))
  }, [search])

  const getCaptain = (id: string) => drivers.find(d => d.id === id)?.nickname || id

  const columns = [
    { key: 'name', header: t('team.teamName'), render: (tm: typeof teams[0]) => <span className="font-medium">{tm.name}</span> },
    { key: 'region', header: t('user.region'), render: (tm: typeof teams[0]) => <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">{tm.region}</span> },
    { key: 'captain', header: t('team.captain'), render: (tm: typeof teams[0]) => getCaptain(tm.captainId) },
    { key: 'members', header: t('team.memberCount'), render: (tm: typeof teams[0]) => tm.members.length },
    { key: 'totalEntries', header: t('team.totalEntries') },
    { key: 'totalPoints', header: t('team.totalPoints'), render: (tm: typeof teams[0]) => tm.totalPoints.toLocaleString() },
    {
      key: 'actions', header: t('common.actions'),
      render: (tm: typeof teams[0]) => (
        <Button variant="ghost" size="sm" onClick={() => navigate(`/teams/${tm.id}`)}><Eye className="w-3.5 h-3.5" /></Button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t('team.title')}</h1>
      <Card>
        <div className="mb-4 pb-4 border-b">
          <div className="w-64"><Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        </div>
        <DataTable columns={columns} data={filtered} keyExtractor={(tm) => tm.id} />
      </Card>
    </div>
  )
}
