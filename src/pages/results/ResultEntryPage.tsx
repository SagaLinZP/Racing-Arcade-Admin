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
import { findStageById, getPointsForPosition, getName, getRaceSessionId, getStageLockAt, isStageLocked } from '@/lib/results'
import { lockStageResults } from '@/lib/stageOps'
import { canSyncStage, syncStageResults } from '@/lib/serverResults'
import { updateCompetition } from '@/data/competitions'
import type { SessionResult, ResultStatus } from '@/data/competitions'
import type { ScoringTableEntry } from '@/lib/utils'
import { ArrowLeft, Save, Upload, Plus, Trash2, CheckCircle, History, Gavel, RefreshCw, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseResultsJson, reconcileRows, rowsToSessionResults, type ParsedRow } from '@/lib/resultParser'
import { auditLogs } from '@/data/admin'
import { addNotification } from '@/data/notifications'
import { useDataVersion } from '@/data/store'
import { PenaltyModal } from '@/components/PenaltyModal'
import { Modal } from '@/components/ui/Modal'
import { formatDateTimeTz } from '@/lib/timezone'

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
  useDataVersion()
  const { id } = useParams<{ id: string }>()

  const ctx = useMemo(() => (id ? findStageById(id) : null), [id])

  const scoringTable: ScoringTableEntry[] | undefined = ctx?.competition.defaultRuleset.scoringTable

  const [splitStates, setSplitStates] = useState<SplitResultState[]>(() => {
    if (!ctx) return []
    return ctx.stage.splits.map(split => ({
      splitId: split.id,
      splitNumber: split.splitNumber,
      results: split.results ? split.results.map(r => ({ ...r })) : [],
      publishedAt: split.resultsLockedAt,
    }))
  })

  const [activeSplit, setActiveSplit] = useState(0)
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(
    () => ctx?.stage ? (getRaceSessionId(ctx.stage) ?? ctx.stage.sessions[0]?.id) : undefined,
  )
  const [syncing, setSyncing] = useState(false)
  const [penaltyTarget, setPenaltyTarget] = useState<{ driverId: string; driverName: string } | null>(null)
  const [showLockConfirm, setShowLockConfirm] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [preview, setPreview] = useState<ParsedRow[] | null>(null)
  const [parseMsg, setParseMsg] = useState<string | null>(null)

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
  const locked = isStageLocked(stage, competition)
  const awardsPoints = stage.awardsPoints !== false

  const updateResult = (idx: number, patch: Partial<SessionResult>) => {
    setSplitStates(prev => prev.map(ss => {
      if (ss.splitId !== current.splitId) return ss
      return { ...ss, results: ss.results.map((r, i) => i === idx ? { ...r, ...patch } : r) }
    }))
  }

  const handlePositionChange = (idx: number, position: number) => {
    const patch: Partial<SessionResult> = { position }
    if (awardsPoints && scoringTable) {
      patch.points = getPointsForPosition(scoringTable, position)
    }
    updateResult(idx, patch)
  }

  const addDriver = (driverId: string) => {
    if (!current || !activeSessionId) return
    const driver = drivers.find(d => d.id === driverId)
    const newPosition = sessionResults.length + 1
    setSplitStates(prev => prev.map(ss => {
      if (ss.splitId !== current.splitId) return ss
      const newResult: SessionResult = {
        position: newPosition,
        driverId,
        teamId: driver?.teamId,
        sessionId: activeSessionId,
        status: 'Finished',
        points: awardsPoints && scoringTable ? getPointsForPosition(scoringTable, newPosition) : 0,
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

  const commitLocal = () => {
    if (!ctx) return
    ctx.stage.splits.forEach(split => {
      const st = splitStates.find(ss => ss.splitId === split.id)
      if (st) split.results = st.results.map(r => ({ ...r }))
    })
  }

  const resyncFromStage = () => {
    if (!ctx) return
    setSplitStates(ctx.stage.splits.map(split => ({
      splitId: split.id,
      splitNumber: split.splitNumber,
      results: split.results ? split.results.map(r => ({ ...r })) : [],
      publishedAt: split.resultsLockedAt,
    })))
  }

  const openPenalty = (driverId: string, driverName: string) => {
    commitLocal()
    setPenaltyTarget({ driverId, driverName })
  }

  const handleSave = () => {
    if (!ctx) return
    commitLocal()
    navigate(`/results/competition/${competition.id}`)
  }

  const handleLock = () => {
    setShowLockConfirm(false)
    commitLocal()
    lockStageResults(stage, competition)
    resyncFromStage()
    addNotification({
      id: `ntf_lock_${stage.id}`,
      type: 'results',
      title_zh: '成绩已锁定',
      title_en: 'Results Locked',
      body_zh: `${competition.name_zh} - ${stage.name_zh} 成绩已锁定，积分已发放`,
      body_en: `${competition.name_en} - ${stage.name_en} results locked, points awarded`,
      link: `/results/${stage.id}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    })
  }

  const handleSync = () => {
    if (syncing) return
    setSyncing(true)
    setTimeout(() => {
      syncStageResults(stage, round, competition)
      updateCompetition(competition)
      resyncFromStage()
      setSyncing(false)
    }, 500)
  }

  const handleParse = () => {
    if (!current) return
    const res = parseResultsJson(pasteText)
    if (!res.ok) {
      setPreview(null)
      setParseMsg(t(`result.parseErr_${res.error}`))
      return
    }
    const reconciled = reconcileRows(res.rows, stage, current.splitNumber)
    setPreview(reconciled)
    const matched = reconciled.filter(r => r.matched).length
    setParseMsg(t('result.parseSummary', { game: res.game, total: reconciled.length, matched, unmatched: reconciled.length - matched }))
  }

  const handleImport = () => {
    if (!preview || !current || !activeSessionId) return
    const imported = rowsToSessionResults(preview, activeSessionId, current.splitNumber, scoringTable)
    setSplitStates(prev => prev.map(ss => {
      if (ss.splitId !== current.splitId) return ss
      const others = ss.results.filter(r => r.sessionId !== activeSessionId)
      return { ...ss, results: [...others, ...imported] }
    }))
    setPreview(null)
    setPasteText('')
    setShowUpload(false)
  }

  const sessionResults = current
    ? current.results.map((r, fullIdx) => ({ r, fullIdx })).filter(({ r }) => r.sessionId === activeSessionId)
    : []
  const sortedResults = [...sessionResults].sort((a, b) => a.r.position - b.r.position)

  const availableDrivers = registeredDrivers.filter(
    did => !sessionResults.some(({ r }) => r.driverId === did),
  )

  const syncable = canSyncStage(stage)
  const lockMs = getStageLockAt(stage, competition)
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now()
  const remainMs = lockMs - nowMs
  const remainH = Math.floor(remainMs / 3_600_000)
  const remainM = Math.floor((remainMs % 3_600_000) / 60_000)
  const isOverdue = remainMs <= 0

  return (
    <div className="p-6 space-y-4">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(`/results/competition/${competition.id}`)}>
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
          {syncable && (
            <Button variant="secondary" onClick={handleSync} disabled={syncing}>
              <RefreshCw className={cn('w-4 h-4 mr-1', syncing && 'animate-spin')} />
              {t('result.syncFromServer')}
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShowUpload(!showUpload)}>
            <Upload className="w-4 h-4 mr-1" />
            {t('result.fileUpload')}
          </Button>
          <Button variant="secondary" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" />
            {t('common.save')}
          </Button>
          {!locked && (
            <Button variant="primary" onClick={() => setShowLockConfirm(true)}>
              <CheckCircle className="w-4 h-4 mr-1" />
              {t('result.lockResults')}
            </Button>
          )}
        </div>
      </div>

      {/* Stage info — only game / track / date */}
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
            <span className="font-medium">{formatDateTimeTz(stage.startsAt, competition.timezone)}</span>
          </div>
        </div>
      </Card>

      {/* Import zone */}
      {showUpload && (
        <Card>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">{t('result.importTitle')}</h3>
              <span className="text-xs text-gray-400">{t('result.importHint')}</span>
            </div>
            <textarea
              className="w-full h-32 rounded-md border border-gray-300 px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder='{ "sessionResult": { "leaderBoardLines": [ ... ] } }   //   { "Result": [ ... ] }'
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleParse} disabled={!pasteText.trim()}>{t('result.parse')}</Button>
              {preview && preview.some(r => r.matched) && (
                <Button variant="primary" size="sm" onClick={handleImport}>{t('result.import')}</Button>
              )}
              {parseMsg && <span className="text-xs text-gray-600">{parseMsg}</span>}
            </div>
            {preview && preview.length > 0 && (
              <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-md">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium text-gray-500 uppercase w-10">{t('result.position')}</th>
                      <th className="px-2 py-1.5 text-left font-medium text-gray-500 uppercase">{t('result.driver')}</th>
                      <th className="px-2 py-1.5 text-left font-medium text-gray-500 uppercase w-24">{t('result.bestLap')}</th>
                      <th className="px-2 py-1.5 text-left font-medium text-gray-500 uppercase w-14">{t('result.laps')}</th>
                      <th className="px-2 py-1.5 text-left font-medium text-gray-500 uppercase w-24" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.map((r, i) => {
                      const d = r.matchedDriverId ? drivers.find(dr => dr.id === r.matchedDriverId) : undefined
                      return (
                        <tr key={i} className={cn(!r.matched && 'bg-red-50')}>
                          <td className="px-2 py-1 text-gray-600">{r.position}</td>
                          <td className="px-2 py-1 text-gray-900">{d?.nickname ?? r.driverName ?? r.playerId ?? (r.raceNumber != null ? `#${r.raceNumber}` : '—')}</td>
                          <td className="px-2 py-1 font-mono text-gray-500">{r.bestLapMs ? (r.bestLapMs / 1000).toFixed(3) : '—'}</td>
                          <td className="px-2 py-1 text-gray-500">{r.laps ?? '—'}</td>
                          <td className="px-2 py-1">
                            {r.matched
                              ? <Badge variant="success">{t('result.previewMatched')}</Badge>
                              : <Badge variant="danger">{t('result.previewUnmatched')}</Badge>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Split selector — always show, even for 1 split */}
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
          </button>
        ))}
      </div>

      {/* Session selector — after split */}
      {stage.sessions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">{t('competition.sessions')}:</span>
          {stage.sessions.map(s => {
            const count = current?.results.filter(r => r.sessionId === s.id).length ?? 0
            return (
              <button
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md border transition-colors',
                  activeSessionId === s.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50',
                )}
              >
                {getName(s, lang)}
                <span className="ml-1 text-gray-400">({count})</span>
              </button>
            )
          })}
        </div>
      )}

      {locked && (
        <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          <History className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{t('result.lockedHint')}</span>
        </div>
      )}

      {/* Result entry table */}
      <Card padding={false}>
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
                  {awardsPoints && <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 uppercase w-16">{t('result.points')}</th>}
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedResults.map(({ r, fullIdx }) => {
                  const driver = drivers.find(d => d.id === r.driverId)
                  const team = r.teamId ? teams.find(tt => tt.id === r.teamId) : undefined
                  return (
                    <tr key={r.driverId} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5">
                        <Input
                          type="number"
                          disabled={locked}
                          className="w-12 text-center"
                          value={String(r.position)}
                          onChange={(e) => handlePositionChange(fullIdx, Number(e.target.value))}
                        />
                      </td>
                      <td className="px-3 py-1.5 text-sm font-medium text-gray-900">
                        {driver?.nickname ?? r.driverId}
                      </td>
                      <td className="px-3 py-1.5 text-sm text-gray-500">{team?.name ?? '—'}</td>
                      <td className="px-3 py-1.5">
                        <Input className="w-24" disabled={locked} value={r.totalTime ?? ''} onChange={(e) => updateResult(fullIdx, { totalTime: e.target.value })} placeholder="0:00:00" />
                      </td>
                      <td className="px-3 py-1.5">
                        <Input className="w-24" disabled={locked} value={r.bestLap ?? ''} onChange={(e) => updateResult(fullIdx, { bestLap: e.target.value })} placeholder="0:00.0" />
                      </td>
                      <td className="px-3 py-1.5">
                        <Input type="number" disabled={locked} className="w-12" value={String(r.lapsCompleted ?? 0)} onChange={(e) => updateResult(fullIdx, { lapsCompleted: Number(e.target.value) })} />
                      </td>
                      <td className="px-3 py-1.5">
                        <Input className="w-20" disabled={locked} value={r.gapToLeader ?? ''} onChange={(e) => updateResult(fullIdx, { gapToLeader: e.target.value })} placeholder="—" />
                      </td>
                      <td className="px-3 py-1.5">
                        <Select options={statusOptions} value={r.status} locked={locked} onChange={(e) => updateResult(fullIdx, { status: e.target.value as ResultStatus })} />
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-1.5">
                          {r.penalty && <span className="text-xs text-amber-700 truncate max-w-[72px]" title={r.penalty}>{r.penalty}</span>}
                          {!locked && (
                            <button onClick={() => openPenalty(r.driverId, driver?.nickname ?? r.driverId)} className="text-gray-400 hover:text-red-600 shrink-0" title={t('result.penaltyAction')}>
                              <Gavel className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      {awardsPoints && (
                        <td className="px-3 py-1.5 text-right">
                          <Input type="number" disabled={locked} className="w-14 text-right" value={String(r.points ?? 0)} onChange={(e) => updateResult(fullIdx, { points: Number(e.target.value) })} />
                        </td>
                      )}
                      <td className="px-3 py-1.5">
                        {!locked && (
                          <button onClick={() => removeResult(fullIdx)} className="text-gray-300 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
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
        {!locked && availableDrivers.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-200">
            <Plus className="w-4 h-4 text-gray-400" />
            <select className="text-sm border border-gray-300 rounded-md px-2 py-1.5" value="" onChange={(e) => { if (e.target.value) addDriver(e.target.value) }}>
              <option value="">{t('result.addDriver')}</option>
              {availableDrivers.map(did => {
                const d = drivers.find(d => d.id === did)
                return <option key={did} value={did}>{d?.nickname ?? did}</option>
              })}
            </select>
          </div>
        )}
      </Card>

      {/* Lock time adjustment + countdown */}
      {!locked && (
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Clock className={cn('w-4 h-4', isOverdue ? 'text-red-500' : 'text-gray-400')} />
              <div>
                <div className="text-sm font-medium text-gray-700">
                  {t('result.lockAtTime', { time: formatDateTimeTz(new Date(lockMs).toISOString(), competition.timezone) })}
                </div>
                <div className={cn('text-xs', isOverdue ? 'text-red-500' : 'text-gray-400')}>
                  {isOverdue
                    ? t('result.lockOverdue')
                    : t('result.lockCountdown', { h: remainH, m: remainM })}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {t('result.lockCalcFrom', { time: formatDateTimeTz(stage.endsAt, competition.timezone) })}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Input
                type="number"
                min={1}
                className="w-20"
                value={String(competition.resultLockWindowHours ?? 24)}
                onChange={(e) => updateCompetition({ ...competition, resultLockWindowHours: Number(e.target.value) || 24 })}
              />
              <span className="text-xs text-gray-400">{t('result.lockWindowUnit')}</span>
            </div>
          </div>
        </Card>
      )}

      {auditLogs.filter(l => l.stageId === stage.id).length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">{t('result.auditHistory')}</h3>
          </div>
          <div className="space-y-2">
            {auditLogs.filter(l => l.stageId === stage.id).map(l => (
              <div key={l.id} className="flex flex-wrap items-baseline gap-x-2 text-xs border-b border-gray-100 pb-1.5">
                <span className="text-gray-400 font-mono">{new Date(l.changedAt).toLocaleString()}</span>
                <span className="text-gray-800 font-medium">{drivers.find(d => d.id === l.driverId)?.nickname ?? l.driverId}</span>
                <span className="text-gray-500">{l.field}: {l.oldValue || '—'} → {l.newValue}</span>
                <span className="text-gray-400">· {l.reason}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {penaltyTarget && (
        <PenaltyModal
          isOpen={true}
          onClose={() => setPenaltyTarget(null)}
          competition={competition}
          stage={stage}
          sessionId={activeSessionId}
          driverId={penaltyTarget.driverId}
          driverName={penaltyTarget.driverName}
          sessionName={(() => { const s = stage.sessions.find(se => se.id === activeSessionId); return s ? getName(s, lang) : undefined })()}
          scoringTable={scoringTable}
          onApplied={resyncFromStage}
        />
      )}

      <Modal isOpen={showLockConfirm} onClose={() => setShowLockConfirm(false)} title={t('result.lockConfirmTitle')} size="sm">
        <p className="text-sm text-gray-600 mb-5">{t('result.lockConfirmBody')}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowLockConfirm(false)}>{t('common.cancel')}</Button>
          <Button variant="primary" size="sm" onClick={handleLock}>{t('result.lockResults')}</Button>
        </div>
      </Modal>
    </div>
  )
}
