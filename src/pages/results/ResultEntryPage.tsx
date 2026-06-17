import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { useManagedOptions } from '@/hooks/useManagedOptions'
import { drivers } from '@/data/drivers'
import { teams } from '@/data/teams'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { findStageById, getPointsForPosition, getName } from '@/lib/results'
import type { SessionResult, ResultStatus } from '@/data/competitions'
import type { ScoringTableEntry } from '@/lib/utils'
import { ArrowLeft, Save, Upload, Trophy, Plus, Trash2, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SplitResultState {
  splitId: string
  splitNumber: number
  results: SessionResult[]
  publishedAt?: string
}

export function ResultEntryPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const statusOptions = useManagedOptions('resultStatus', lang)
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const ctx = useMemo(() => (id ? findStageById(id) : null), [id])

  const scoringTable: ScoringTableEntry[] | undefined = ctx?.competition.defaultRuleset.scoringTable

  const [splitStates, setSplitStates] = useState<SplitResultState[]>(() => {
    if (!ctx) return []
    return ctx.stage.splits.map(split => ({
      splitId: split.id,
      splitNumber: split.splitNumber,
      results: split.results ? split.results.map(r => ({ ...r })) : [],
      publishedAt: split.resultsPublishedAt,
    }))
  })

  const [activeSplit, setActiveSplit] = useState(0)
  const [autoPoints, setAutoPoints] = useState(true)
  const [showUpload, setShowUpload] = useState(false)

  if (!ctx) {
    return (
      <div className="p-6">
        <p className="text-gray-500">{t('result.sessionNotFound')}</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/results')}>
          {t('common.back')}
        </Button>
      </div>
    )
  }

  const { competition, round, stage } = ctx
  const registeredDrivers = round.registeredDriverIds
  const current = splitStates[activeSplit]
  const isPublished = !!current?.publishedAt

  const updateResult = (idx: number, patch: Partial<SessionResult>) => {
    setSplitStates(prev => prev.map(ss => {
      if (ss.splitId !== current.splitId) return ss
      return {
        ...ss,
        results: ss.results.map((r, i) => i === idx ? { ...r, ...patch } : r),
      }
    }))
  }

  const handlePositionChange = (idx: number, position: number) => {
    const patch: Partial<SessionResult> = { position }
    if (autoPoints && scoringTable) {
      patch.points = getPointsForPosition(scoringTable, position)
    }
    updateResult(idx, patch)
  }

  const addDriver = (driverId: string) => {
    if (!current) return
    const driver = drivers.find(d => d.id === driverId)
    const existingIdx = current.results.length
    const newPosition = existingIdx + 1
    setSplitStates(prev => prev.map(ss => {
      if (ss.splitId !== current.splitId) return ss
      const newResult: SessionResult = {
        position: newPosition,
        driverId,
        teamId: driver?.teamId,
        status: 'Finished',
        points: autoPoints && scoringTable ? getPointsForPosition(scoringTable, newPosition) : 0,
      }
      return { ...ss, results: [...ss.results, newResult] }
    }))
  }

  const removeResult = (idx: number) => {
    setSplitStates(prev => prev.map(ss => {
      if (ss.splitId !== current.splitId) return ss
      return { ...ss, results: ss.results.filter((_, i) => i !== idx) }
    }))
  }

  const handleSave = () => {
    if (!ctx) return
    ctx.stage.splits.forEach(split => {
      const state = splitStates.find(ss => ss.splitId === split.id)
      if (state) {
        split.results = state.results
      }
    })
    navigate('/results')
  }

  const handlePublish = () => {
    setSplitStates(prev => prev.map(ss => {
      if (ss.splitId !== current.splitId) return ss
      return { ...ss, publishedAt: ss.publishedAt ?? new Date().toISOString() }
    }))
    if (ctx) {
      const split = ctx.stage.splits.find(s => s.id === current.splitId)
      if (split && !split.resultsPublishedAt) {
        split.resultsPublishedAt = new Date().toISOString()
      }
    }
  }

  const handleUnpublish = () => {
    setSplitStates(prev => prev.map(ss => {
      if (ss.splitId !== current.splitId) return ss
      return { ...ss, publishedAt: undefined }
    }))
    if (ctx) {
      const split = ctx.stage.splits.find(s => s.id === current.splitId)
      if (split) split.resultsPublishedAt = undefined
    }
  }

  const availableDrivers = registeredDrivers.filter(
    did => !current?.results.some(r => r.driverId === did),
  )

  const sortedResults = current
    ? [...current.results].map((r, origIdx) => ({ r, origIdx })).sort((a, b) => a.r.position - b.r.position)
    : []

  return (
    <div className="p-6 space-y-4">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/results')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span>{getName(competition, lang)}</span>
              <span>/</span>
              <span>{getName(round, lang)}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{getName(stage, lang)}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowUpload(!showUpload)}>
            <Upload className="w-4 h-4 mr-1" />
            {t('result.fileUpload')}
          </Button>
          <Button variant="secondary" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" />
            {t('common.save')}
          </Button>
          {isPublished ? (
            <Button variant="danger" onClick={handleUnpublish}>
              {t('result.unpublish')}
            </Button>
          ) : (
            <Button variant="primary" onClick={handlePublish}>
              <CheckCircle className="w-4 h-4 mr-1" />
              {t('result.publishResults')}
            </Button>
          )}
        </div>
      </div>

      {/* Stage info */}
      <Card>
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-gray-500">{t('event.game')}: </span>
            <span className="font-medium">{competition.game}</span>
          </div>
          {stage.gameConfig?.track && (
            <div>
              <span className="text-gray-500">{t('gameConfig.track')}: </span>
              <span className="font-medium">{stage.gameConfig.track}</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">{t('common.date')}: </span>
            <span className="font-medium">{new Date(stage.startsAt).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-gray-500">{t('competition.sessions')}: </span>
            <span className="font-medium">{stage.gameSessions.length}</span>
          </div>
          {scoringTable && scoringTable.length > 0 && (
            <div className="ml-auto">
              <span className="text-gray-500">{t('result.scoringTable')}: </span>
              <span className="font-medium">
                P1={scoringTable[0].points}
                {scoringTable.length > 1 && ` … P${scoringTable.length}=${scoringTable[scoringTable.length - 1].points}`}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Upload zone */}
      {showUpload && (
        <Card>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">{t('result.uploadHint')}</p>
            <Button variant="secondary" size="sm" className="mt-3">{t('result.chooseFile')}</Button>
          </div>
        </Card>
      )}

      {/* Split tabs */}
      {splitStates.length > 1 && (
        <div className="flex gap-1 border-b border-gray-200">
          {splitStates.map((ss, idx) => (
            <button
              key={ss.splitId}
              onClick={() => setActiveSplit(idx)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeSplit === idx
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              )}
            >
              {t('result.split')} {ss.splitNumber}
              {ss.publishedAt && <Badge variant="success" className="ml-2 text-xs">{t('result.statusPublished')}</Badge>}
            </button>
          ))}
        </div>
      )}

      {/* Result entry table */}
      <Card padding={false}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-700">
              {splitStates.length > 1 ? `${t('result.split')} ${current?.splitNumber}` : t('result.manualEntry')}
            </h3>
            {isPublished && <Badge variant="success">{t('result.statusPublished')}</Badge>}
          </div>
          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={autoPoints}
              onChange={(e) => setAutoPoints(e.target.checked)}
              className="rounded"
            />
            {t('result.autoPoints')}
          </label>
        </div>

        {sortedResults.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase w-16">{t('result.position')}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{t('result.driver')}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{t('result.team')}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase w-28">{t('result.totalTime')}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase w-28">{t('result.bestLap')}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase w-16">{t('result.laps')}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase w-28">{t('result.gapToLeader')}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase w-28">{t('result.status')}</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase w-20">{t('result.penalty')}</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 uppercase w-16">{t('result.points')}</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedResults.map(({ r, origIdx }) => {
                  const driver = drivers.find(d => d.id === r.driverId)
                  const team = r.teamId ? teams.find(t => t.id === r.teamId) : undefined
                  return (
                    <tr key={r.driverId} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5">
                        <Input
                          type="number"
                          className="w-12 text-center"
                          value={String(r.position)}
                          onChange={(e) => handlePositionChange(origIdx, Number(e.target.value))}
                        />
                      </td>
                      <td className="px-3 py-1.5 text-sm font-medium text-gray-900">
                        {driver?.nickname ?? r.driverId}
                      </td>
                      <td className="px-3 py-1.5 text-sm text-gray-500">{team?.name ?? '—'}</td>
                      <td className="px-3 py-1.5">
                        <Input
                          className="w-24"
                          value={r.totalTime ?? ''}
                          onChange={(e) => updateResult(origIdx, { totalTime: e.target.value })}
                          placeholder="0:00:00"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <Input
                          className="w-24"
                          value={r.bestLap ?? ''}
                          onChange={(e) => updateResult(origIdx, { bestLap: e.target.value })}
                          placeholder="0:00.0"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <Input
                          type="number"
                          className="w-12"
                          value={String(r.lapsCompleted ?? 0)}
                          onChange={(e) => updateResult(origIdx, { lapsCompleted: Number(e.target.value) })}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <Input
                          className="w-20"
                          value={r.gapToLeader ?? ''}
                          onChange={(e) => updateResult(origIdx, { gapToLeader: e.target.value })}
                          placeholder="—"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <Select
                          options={statusOptions}
                          value={r.status}
                          onChange={(e) => updateResult(origIdx, { status: e.target.value as ResultStatus })}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <Input
                          className="w-20"
                          value={r.penalty ?? ''}
                          onChange={(e) => updateResult(origIdx, { penalty: e.target.value })}
                          placeholder="—"
                        />
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <Input
                          type="number"
                          className="w-14 text-right"
                          value={String(r.points ?? 0)}
                          onChange={(e) => updateResult(origIdx, { points: Number(e.target.value) })}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <button
                          onClick={() => removeResult(origIdx)}
                          className="text-gray-300 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">{t('result.noResultsEntered')}</p>
        )}

        {/* Add driver */}
        {availableDrivers.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-200">
            <Plus className="w-4 h-4 text-gray-400" />
            <select
              className="text-sm border border-gray-300 rounded-md px-2 py-1.5"
              value=""
              onChange={(e) => { if (e.target.value) addDriver(e.target.value) }}
            >
              <option value="">{t('result.addDriver')}</option>
              {availableDrivers.map(did => {
                const d = drivers.find(d => d.id === did)
                return (
                  <option key={did} value={did}>{d?.nickname ?? did}</option>
                )
              })}
            </select>
          </div>
        )}
      </Card>

      {/* Standings quick view */}
      {scoringTable && scoringTable.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-700">{t('result.scoringTable')}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {scoringTable.map(entry => (
              <div key={entry.position} className="flex flex-col items-center bg-gray-50 rounded-md px-3 py-1.5 border border-gray-200">
                <span className="text-xs text-gray-400">P{entry.position}</span>
                <span className="text-sm font-bold text-blue-600">{entry.points}</span>
                {entry.note_en && <span className="text-xs text-gray-400">{lang === 'zh' ? entry.note_zh : entry.note_en}</span>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
