import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { drivers } from '@/data/drivers'
import { teams } from '@/data/teams'
import { banRecords } from '@/data/admin'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DataTable } from '@/components/ui/DataTable'
import { Eye } from 'lucide-react'

const REGION_OPTIONS = [
  { value: '', label: 'All Regions' },
  { value: 'CN', label: 'China' },
  { value: 'AP', label: 'Asia Pacific' },
  { value: 'AM', label: 'Americas' },
  { value: 'EU', label: 'Europe & Africa' },
]

export function UserListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('')

  const filtered = useMemo(() => {
    return drivers.filter(d => {
      if (search && !d.nickname.toLowerCase().includes(search.toLowerCase())) return false
      if (regionFilter && d.region !== regionFilter) return false
      return true
    })
  }, [search, regionFilter])

  const isBanned = (userId: string) => banRecords.some(b => b.userId === userId && b.status === 'active')

  const columns = [
    {
      key: 'nickname', header: t('user.nickname'),
      render: (d: typeof drivers[0]) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">{d.nickname.charAt(0)}</div>
          <span className="font-medium">{d.nickname}</span>
          {isBanned(d.id) && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{t('common.banned')}</span>}
        </div>
      ),
    },
    { key: 'country', header: t('user.country') },
    { key: 'region', header: t('user.region'), render: (d: typeof drivers[0]) => <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">{d.region}</span> },
    {
      key: 'team', header: t('user.team'),
      render: (d: typeof drivers[0]) => {
        const team = d.teamId ? teams.find(tm => tm.id === d.teamId) : null
        return team ? <span className="text-sm text-blue-600">{team.name}</span> : <span className="text-gray-400">-</span>
      },
    },
    { key: 'totalEntries', header: t('user.totalEntries') },
    { key: 'wins', header: t('user.wins') },
    { key: 'totalPoints', header: t('user.totalPoints'), render: (d: typeof drivers[0]) => d.totalPoints.toLocaleString() },
    {
      key: 'actions', header: t('common.actions'),
      render: (d: typeof drivers[0]) => (
        <Button variant="ghost" size="sm" onClick={() => navigate(`/users/${d.id}`)}><Eye className="w-3.5 h-3.5" /></Button>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t('user.title')}</h1>
      <Card>
        <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b">
          <div className="w-64"><Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div className="w-40"><Select options={REGION_OPTIONS} value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} /></div>
          <div className="text-sm text-gray-500 flex items-center">{filtered.length} users</div>
        </div>
        <DataTable columns={columns} data={filtered} keyExtractor={(d) => d.id} />
      </Card>
    </div>
  )
}
