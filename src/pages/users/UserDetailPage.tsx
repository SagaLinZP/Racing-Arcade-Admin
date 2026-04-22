import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { drivers } from '@/data/drivers'
import { teams } from '@/data/teams'
import { events } from '@/data/events'
import { banRecords } from '@/data/admin'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { ArrowLeft, ShieldAlert, ShieldCheck } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const BAN_TYPE_OPTIONS = [
  { value: 'warning', label: 'Warning' },
  { value: 'temporary', label: 'Temporary Ban' },
  { value: 'permanent', label: 'Permanent Ban' },
  { value: 'race', label: 'Race Ban' },
]

export function UserDetailPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()
  const { id } = useParams()
  const [showBan, setShowBan] = useState(false)

  const driver = useMemo(() => drivers.find(d => d.id === id), [id])
  if (!driver) return <div className="text-center py-12 text-gray-500">User not found</div>

  const team = driver.teamId ? teams.find(tm => tm.id === driver.teamId) : null
  const userBans = banRecords.filter(b => b.userId === driver.id)
  const participatedEvents = events.filter(e => e.registeredDriverIds.includes(driver.id))

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/users')}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('user.userDetail')}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-600">{driver.nickname}</span>
              <span className="text-gray-400">·</span>
              <span className="text-sm text-gray-500">{driver.country} ({driver.region})</span>
              {userBans.some(b => b.status === 'active') && <StatusBadge status="banned" label="Banned" />}
            </div>
          </div>
        </div>
        <Button variant="danger" onClick={() => setShowBan(true)}>
          <ShieldAlert className="w-4 h-4 mr-1" />{t('user.banUser')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b">Profile</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">ID:</span><span className="font-mono">{driver.id}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Country:</span><span>{driver.country}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Region:</span><span>{driver.region}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Team:</span><span className="text-blue-600">{team?.name || 'None'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">iRacing ID:</span><span>{driver.iracingId || 'Not set'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Steam:</span><span>{driver.steamBound ? 'Bound' : 'Not bound'}</span></div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b">Statistics</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-xl font-bold text-gray-900">{driver.totalEntries}</div>
              <div className="text-xs text-gray-500">Entries</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-xl font-bold text-gray-900">{driver.wins}</div>
              <div className="text-xs text-gray-500">Wins</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-xl font-bold text-gray-900">{driver.podiums}</div>
              <div className="text-xs text-gray-500">Podiums</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-xl font-bold text-gray-900">{driver.totalPoints.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Points</div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b">MOZA Devices</h3>
          {driver.mozaDevices.length === 0 ? (
            <p className="text-sm text-gray-400">No devices</p>
          ) : (
            <div className="space-y-1">
              {driver.mozaDevices.map((dev, i) => (
                <div key={i} className="text-sm text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full" />{dev}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b">{t('user.banHistory')}</h3>
        {userBans.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No ban records</p>
        ) : (
          <div className="space-y-2">
            {userBans.map(ban => (
              <div key={ban.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <StatusBadge status={ban.status === 'active' ? 'banned' : 'default'} label={ban.type} />
                  <div>
                    <p className="text-sm">{lang === 'en' ? ban.reason_en : ban.reason_zh}</p>
                    <p className="text-xs text-gray-400">{formatDate(ban.startDate, lang)}{ban.endDate ? ` - ${formatDate(ban.endDate, lang)}` : ''}</p>
                  </div>
                </div>
                {ban.status === 'active' && (
                  <Button variant="secondary" size="sm"><ShieldCheck className="w-3.5 h-3.5 mr-1" />{t('user.unbanUser')}</Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b">Participated Events ({participatedEvents.length})</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {participatedEvents.map(e => (
            <div key={e.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
              <div>
                <span className="text-sm font-medium">{lang === 'zh' ? e.name_zh : e.name_en}</span>
                <span className="text-xs text-gray-400 ml-2">{e.track}</span>
              </div>
              <StatusBadge status={e.status} label={t(`event.status.${e.status}`)} />
            </div>
          ))}
        </div>
      </Card>

      <Modal isOpen={showBan} onClose={() => setShowBan(false)} title={t('user.banUser')} size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Ban user: <strong>{driver.nickname}</strong></p>
          <Select label={t('user.banType')} options={BAN_TYPE_OPTIONS} />
          <Input label={t('user.banDuration')} placeholder="e.g., 7 days, 2 races" />
          <Textarea label={`${t('user.banReason')} (English)`} placeholder="Reason for ban..." />
          <Textarea label={`${t('user.banReason')} (Chinese)`} placeholder="Reason for ban..." />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowBan(false)}>{t('common.cancel')}</Button>
            <Button variant="danger">{t('user.banUser')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
