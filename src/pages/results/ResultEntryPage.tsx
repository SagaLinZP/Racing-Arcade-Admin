import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { events } from '@/data/events'
import { drivers } from '@/data/drivers'
import { teams } from '@/data/teams'
import { resultChangeLogs } from '@/data/admin'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { ArrowLeft, Save, Upload, History } from 'lucide-react'

const STATUS_OPTS = [
  { value: 'Finished', label: 'Finished' },
  { value: 'DNF', label: 'DNF' },
  { value: 'DNS', label: 'DNS' },
  { value: 'DSQ', label: 'DSQ' },
]

export function ResultEntryPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const navigate = useNavigate()
  const { id } = useParams()
  const [showHistory, setShowHistory] = useState(false)

  const event = useMemo(() => events.find(e => e.id === id), [id])
  const eventDrivers = useMemo(() => {
    if (!event) return []
    return event.registeredDriverIds.map(did => drivers.find(d => d.id === did) || { id: did, nickname: did, teamId: undefined as string | undefined })
  }, [event])

  if (!event) return <div className="text-center py-12 text-gray-500">Event not found</div>

  const changeLogs = resultChangeLogs.filter(cl => cl.eventId === event.id)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/results')}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('result.enterResults')}</h1>
            <p className="text-sm text-gray-500">{state.language === 'zh' ? event.name_zh : event.name_en}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowHistory(true)}><History className="w-4 h-4 mr-1" />Change Log</Button>
          <Button><Save className="w-4 h-4 mr-1" />{t('result.publishResults')}</Button>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4 pb-2 border-b">
          <h3 className="text-sm font-medium text-gray-700">Event Info</h3>
          <StatusBadge status={event.status} label={t(`event.status.${event.status}`)} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Game:</span> {event.game}</div>
          <div><span className="text-gray-500">Track:</span> {event.track}</div>
          <div><span className="text-gray-500">Date:</span> {new Date(event.eventStartTime).toLocaleDateString()}</div>
          <div><span className="text-gray-500">Registered:</span> {event.currentRegistrations}</div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Import Results</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Drag and drop result file (JSON/XML) or click to upload</p>
          <Button variant="secondary" size="sm" className="mt-3">Choose File</Button>
        </div>
      </Card>

      <Card padding={false}>
        <div className="px-6 py-4 border-b">
          <h3 className="text-sm font-medium text-gray-700">{t('result.manualEntry')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">P</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('result.driver')}</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('result.team')}</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('result.totalTime')}</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('result.bestLap')}</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('result.lapsCompleted')}</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('result.status')}</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('result.points')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {eventDrivers.map((d, i) => {
                const existing = event.results?.find(r => r.driverId === d.id)
                const teamName = d.teamId ? teams.find(tm => tm.id === d.teamId)?.name || '' : ''
                return (
                  <tr key={d.id} className={existing ? 'bg-green-50/50' : ''}>
                    <td className="px-3 py-2"><Input type="number" className="w-14" defaultValue={existing?.position || i + 1} /></td>
                    <td className="px-3 py-2 text-sm">{d.nickname}</td>
                    <td className="px-3 py-2 text-sm text-gray-500">{teamName}</td>
                    <td className="px-3 py-2"><Input className="w-24" defaultValue={existing?.totalTime || ''} placeholder="0:00:00" /></td>
                    <td className="px-3 py-2"><Input className="w-20" defaultValue={existing?.bestLap || ''} placeholder="0:00.0" /></td>
                    <td className="px-3 py-2"><Input type="number" className="w-14" defaultValue={existing?.lapsCompleted || 0} /></td>
                    <td className="px-3 py-2"><Select options={STATUS_OPTS} value={existing?.status || 'Finished'} /></td>
                    <td className="px-3 py-2"><Input type="number" className="w-14" defaultValue={existing?.points || 0} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showHistory} onClose={() => setShowHistory(false)} title="Change Log" size="lg">
        {changeLogs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No changes recorded</p>
        ) : (
          <div className="space-y-3">
            {changeLogs.map(cl => (
              <div key={cl.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{cl.field}: <span className="line-through text-red-500">{cl.oldValue}</span> to <span className="text-green-600">{cl.newValue}</span></span>
                  <span className="text-gray-400 text-xs">{new Date(cl.changedAt).toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Reason: {cl.reason}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
