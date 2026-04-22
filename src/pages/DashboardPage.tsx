import { useTranslation } from 'react-i18next'
import { useApp } from '@/hooks/useAppStore'
import { dashboardStats } from '@/data/admin'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { Users, Calendar, TrendingUp, BarChart3, Activity, Globe, Plus, FileText } from 'lucide-react'

export function DashboardPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const stats = dashboardStats
  const navigate = useNavigate()

  const kpiCards = [
    { label: t('dashboard.totalUsers'), value: stats.totalUsers.toLocaleString(), change: `+${stats.newUsersToday} ${t('dashboard.today').toLowerCase()}`, icon: Users, color: 'text-blue-600 bg-blue-100' },
    { label: t('dashboard.totalEvents'), value: stats.totalEvents.toString(), change: `${stats.weeklyEvents} ${t('dashboard.thisWeek').toLowerCase()}`, icon: Calendar, color: 'text-green-600 bg-green-100' },
    { label: t('dashboard.avgRegistrations'), value: stats.avgRegistrations.toFixed(1), change: `per event`, icon: BarChart3, color: 'text-purple-600 bg-purple-100' },
    { label: t('dashboard.participationRate'), value: `${(stats.participationRate * 100).toFixed(0)}%`, change: `${(stats.completionRate * 100).toFixed(0)}% completion`, icon: Activity, color: 'text-orange-600 bg-orange-100' },
  ]

  const maxUsers = Math.max(...stats.userGrowth.map(d => d.count))
  const maxRegs = Math.max(...stats.registrationTrends.map(d => d.count))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate('/events/create')}>
            <Plus className="w-4 h-4 mr-1" />
            {t('event.createEvent')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/news/create')}>
            <FileText className="w-4 h-4 mr-1" />
            {t('news.createArticle')}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                <p className="text-xs text-gray-400 mt-1">{kpi.change}</p>
              </div>
              <div className={`p-2 rounded-lg ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4">{t('dashboard.userGrowth')}</h3>
          <div className="space-y-2">
            {stats.userGrowth.map((d) => (
              <div key={d.date} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-20 shrink-0">{new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${(d.count / maxUsers) * 100}%` }} />
                </div>
                <span className="text-xs font-medium text-gray-600 w-12 text-right">{d.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Registration Trends */}
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4">{t('dashboard.registrationTrends')}</h3>
          <div className="space-y-2">
            {stats.registrationTrends.map((d) => (
              <div key={d.date} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-20 shrink-0">{new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full transition-all" style={{ width: `${(d.count / maxRegs) * 100}%` }} />
                </div>
                <span className="text-xs font-medium text-gray-600 w-12 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Game Distribution */}
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4">{t('dashboard.gameDistribution')}</h3>
          <div className="space-y-3">
            {stats.gameDistribution.map((d) => {
              const total = stats.gameDistribution.reduce((s, x) => s + x.count, 0)
              const pct = ((d.count / total) * 100).toFixed(0)
              return (
                <div key={d.game} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-20 shrink-0">{d.game}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-16 text-right">{d.count} ({pct}%)</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Region Distribution */}
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4">{t('dashboard.regionDistribution')}</h3>
          <div className="space-y-3">
            {stats.regionDistribution.map((d) => (
              <div key={d.region} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{t(`region.${d.region}`)}</span>
                </div>
                <div className="flex gap-6 text-xs text-gray-500">
                  <span>{d.users.toLocaleString()} users</span>
                  <span>{d.events} events</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-3">{t('dashboard.quickActions')}</h3>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => navigate('/events/create')}>Create Event</Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/championships/create')}>Create Championship</Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/results')}>Enter Results</Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/news/create')}>Publish News</Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/users')}>Manage Users</Button>
        </div>
      </Card>
    </div>
  )
}
