import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import {
  createDefaultGameConfig,
  createDefaultSplit,
  createDefaultSession,
  createDefaultEntryListEntry,
  sessionTemplates,
} from '@/data/competitions'
import type {
  Stage,
  SessionGameConfig,
  Split,
  GamePlatform,
  SessionType,
  Session,
  SessionTemplate,
  BopEntry,
  EntryListEntry,
} from '@/data/competitions'
import { GameConfigEditor } from './GameConfigEditor'
import {
  YES_NO,
  SESSION_TYPE_OPTIONS_T,
  IS_OPEN_OPTIONS,
  LAN_DISCOVERY_OPTIONS,
  BLACKLIST_MODE_OPTIONS,
  YES_NO_INT,
} from './gameConfigOptions'
import {
  Plus, Trash2, ChevronUp, ChevronDown, ChevronRight, Power, AlertCircle, RefreshCw,
} from 'lucide-react'

type TabKey = 'splits' | 'sessions' | 'gameSettings'

export function ServerConfigModal({
  isOpen,
  onClose,
  onSave,
  stage,
  editLang,
  game,
  splitCount,
  registeredDrivers,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (stage: Stage) => void
  stage: Stage
  editLang: 'en' | 'zh'
  game: GamePlatform
  splitCount: number
  registeredDrivers: Array<{ id: string; nickname: string; teamName?: string; teamId?: string }>
}) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabKey>('splits')
  const [local, setLocal] = useState<Stage>(() => {
    const base: Stage = {
      ...stage,
      gameConfig: stage.gameConfig ?? createDefaultGameConfig(game),
      sessions: stage.sessions?.length ? stage.sessions : [
        createDefaultSession('practice'),
        createDefaultSession('qualifying'),
        createDefaultSession('race'),
      ],
    }
    const current = base.splits ?? []
    if (current.length < splitCount) {
      const added: Split[] = []
      for (let i = current.length; i < splitCount; i++) {
        added.push(createDefaultSplit(stage.id, i + 1))
      }
      base.splits = [...current, ...added]
    } else if (current.length > splitCount) {
      base.splits = current.slice(0, splitCount).map((s, i) => ({ ...s, splitNumber: i + 1 }))
    }
    return base
  })

  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false)
  const [tplName, setTplName] = useState('')
  const [serverErrors, setServerErrors] = useState<string[]>([])
  const [bopExpanded, setBopExpanded] = useState(false)

  const gc = local.gameConfig!

  const setGC = (key: keyof SessionGameConfig, value: string | number | boolean) =>
    setLocal(prev => ({ ...prev, gameConfig: { ...prev.gameConfig!, [key]: value } }))

  const setSplitField = (splitId: string, key: keyof Split, value: string | number | boolean) =>
    setLocal(prev => ({
      ...prev,
      splits: prev.splits.map(s => s.id === splitId ? { ...s, [key]: value } : s),
    }))

  const updateSession = (gsId: string, patch: Partial<Session>) =>
    setLocal(prev => ({
      ...prev,
      sessions: prev.sessions.map(gs => gs.id === gsId ? { ...gs, ...patch } : gs),
    }))

  const handleSessionTypeChange = (gsId: string, newType: SessionType) => {
    setLocal(prev => ({
      ...prev,
      sessions: prev.sessions.map(gs => {
        if (gs.id !== gsId) return gs
        if (newType === 'race') {
          return { ...gs, type: newType, durationMinutes: undefined, raceDuration: gs.raceDuration ?? 60, raceDurationType: gs.raceDurationType ?? 'time' }
        }
        return { ...gs, type: newType, raceDuration: undefined, raceDurationType: undefined, durationMinutes: gs.durationMinutes ?? (newType === 'qualifying' ? 15 : 30) }
      }),
    }))
  }

  const addSession = () => {
    const newGs = createDefaultSession('practice')
    setLocal(prev => ({ ...prev, sessions: [...prev.sessions, newGs] }))
  }

  const deleteSession = (gsId: string) => {
    setLocal(prev => ({ ...prev, sessions: prev.sessions.filter(gs => gs.id !== gsId) }))
  }

  const moveSession = (idx: number, dir: -1 | 1) => {
    setLocal(prev => {
      const arr = [...prev.sessions]
      const target = idx + dir
      if (target < 0 || target >= arr.length) return prev
      ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
      return { ...prev, sessions: arr }
    })
  }

  const addBopEntry = () => {
    const entry: BopEntry = { track: gc.track || '', carModel: 0, ballastKg: 0 }
    setLocal(prev => ({ ...prev, bopEntries: [...(prev.bopEntries || []), entry] }))
  }

  const updateBopEntry = (idx: number, patch: Partial<BopEntry>) => {
    setLocal(prev => ({
      ...prev,
      bopEntries: (prev.bopEntries || []).map((e, i) => i === idx ? { ...e, ...patch } : e),
    }))
  }

  const deleteBopEntry = (idx: number) => {
    setLocal(prev => ({
      ...prev,
      bopEntries: (prev.bopEntries || []).filter((_, i) => i !== idx),
    }))
  }

  const updateEntryList = (splitId: string, entries: EntryListEntry[]) =>
    setLocal(prev => ({
      ...prev,
      splits: prev.splits.map(s => s.id === splitId ? { ...s, entryList: entries } : s),
    }))

  const autoGenerateEntryList = (splitId: string) => {
    if (registeredDrivers.length === 0) return
    const entries: EntryListEntry[] = registeredDrivers.map((d, i) => ({
      id: `ele_${splitId}_${Date.now()}_${i}`,
      driverId: d.id,
      driverName: d.nickname,
      teamName: d.teamName,
      raceNumber: 100 + i,
      ballastKg: 0,
      restrictor: 0,
      isAutoGenerated: true,
    }))
    updateEntryList(splitId, entries)
  }

  const addEntryListEntry = (splitId: string) => {
    const split = local.splits.find(s => s.id === splitId)
    const nextNum = (split?.entryList?.length ?? 0) + 1
    updateEntryList(splitId, [...(split?.entryList ?? []), createDefaultEntryListEntry(nextNum)])
  }

  const updateEntryListEntry = (splitId: string, entryId: string, patch: Partial<EntryListEntry>) => {
    const split = local.splits.find(s => s.id === splitId)
    if (!split) return
    updateEntryList(splitId, (split.entryList ?? []).map(e => e.id === entryId ? { ...e, ...patch } : e))
  }

  const deleteEntryListEntry = (splitId: string, entryId: string) => {
    const split = local.splits.find(s => s.id === splitId)
    if (!split) return
    updateEntryList(splitId, (split.entryList ?? []).filter(e => e.id !== entryId))
  }

  const handleApplyTemplate = () => {
    const tpl = sessionTemplates.find(t => t.id === selectedTemplateId)
    if (!tpl) return
    setLocal(prev => ({
      ...prev,
      gameConfig: { ...tpl.gameConfig },
      splits: tpl.splitConfig
        ? prev.splits.map(s => ({ ...s, ...tpl.splitConfig }))
        : prev.splits,
    }))
    setSelectedTemplateId('')
  }

  const handleSaveAsTemplate = () => {
    const now = new Date().toISOString()
    const newTpl: SessionTemplate = {
      id: `tpl_${Date.now()}`,
      name_zh: editLang === 'zh' ? tplName : local.name_zh,
      name_en: editLang === 'en' ? tplName : local.name_en,
      game,
      gameConfig: { ...local.gameConfig! },
      splitConfig: local.splits[0]
        ? Object.fromEntries(
            Object.entries(local.splits[0]).filter(([k]) =>
              !['id', 'splitNumber', 'results', 'resultsPublishedAt'].includes(k),
            ),
          )
        : undefined,
      createdAt: now,
      updatedAt: now,
    }
    sessionTemplates.push(newTpl)
    setTplName('')
    setShowSaveAsTemplate(false)
  }

  const validateServerStart = (): string[] => {
    const errors: string[] = []
    if (local.sessions.length === 0) {
      errors.push(t('gameConfig.errNoGameSessions'))
    }
    if (!gc.track) {
      errors.push(t('gameConfig.errNoTrack'))
    }
    if (game === 'AC' && !gc.cars) {
      errors.push(t('gameConfig.errNoCars'))
    }
    for (const split of local.splits) {
      if (!split.serverName) {
        errors.push(t('gameConfig.errNoServerName', { n: split.splitNumber }))
      }
    }
    return errors
  }

  const handleStartServer = () => {
    setServerErrors(validateServerStart())
  }

  const handleSave = () => { onSave(local); onClose() }

  const compatibleTemplates = sessionTemplates.filter(tpl => tpl.game === game)

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'splits', label: splitCount > 1 ? t('gameConfig.tabSplits') : t('gameConfig.tabServer') },
    { key: 'sessions', label: t('serverConfig.tabSessions') },
    { key: 'gameSettings', label: t('serverConfig.tabGameSettings') },
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('serverConfig.title')} — ${editLang === 'en' ? local.name_en : local.name_zh}`}
      size="2xl"
    >
      {/* Template toolbar */}
      <div className="flex items-end gap-2 rounded-md bg-gray-50 border border-gray-200 px-3 py-2.5 mb-4">
        <div className="flex-1">
          <Select
            label={t('template.applyTemplate')}
            options={compatibleTemplates.map(tpl => ({
              value: tpl.id,
              label: editLang === 'en' ? tpl.name_en : tpl.name_zh,
            }))}
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
          />
        </div>
        <Button variant="secondary" size="sm" onClick={handleApplyTemplate} disabled={!selectedTemplateId}>
          {t('template.apply')}
        </Button>
        <div className="w-px h-8 bg-gray-300 mx-1" />
        <Button variant="ghost" size="sm" onClick={() => setShowSaveAsTemplate(true)}>
          {t('template.saveAsTemplate')}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Game Settings */}
      {activeTab === 'gameSettings' && (
        <div className="space-y-3">
          <GameConfigEditor gameConfig={gc} game={game} onChange={setGC} />

          {/* BOP (ACC only) */}
          {game === 'ACC' && (
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors">
                <button
                  onClick={() => setBopExpanded(!bopExpanded)}
                  className="flex items-center gap-2"
                >
                  {bopExpanded
                    ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                  <span className="text-sm font-medium text-gray-700">{t('gameConfig.bopTitle')}</span>
                  <span className="text-xs font-mono text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">bop.json</span>
                </button>
                {bopExpanded && (
                  <Button variant="ghost" size="sm" onClick={addBopEntry}>
                    <Plus className="w-3.5 h-3.5 mr-1" />{t('gameConfig.addBopEntry')}
                  </Button>
                )}
              </div>
              {bopExpanded && (
                <div className="p-3">
                  <p className="text-xs text-gray-500 mb-3">{t('gameConfig.bopHint')}</p>
                  {(local.bopEntries || []).length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('gameConfig.bopTrack')}</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('gameConfig.bopCarModel')}</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('gameConfig.bopBallastKg')}</th>
                            <th className="w-10" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(local.bopEntries || []).map((entry, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-3 py-1.5">
                                <Input value={entry.track} onChange={(e) => updateBopEntry(idx, { track: e.target.value })} />
                              </td>
                              <td className="px-3 py-1.5">
                                <Input type="number" value={String(entry.carModel)} onChange={(e) => updateBopEntry(idx, { carModel: Number(e.target.value) })} />
                              </td>
                              <td className="px-3 py-1.5">
                                <Input type="number" value={String(entry.ballastKg)} onChange={(e) => updateBopEntry(idx, { ballastKg: Number(e.target.value) })} />
                              </td>
                              <td className="px-3 py-1.5">
                                <button onClick={() => deleteBopEntry(idx)} className="text-gray-300 hover:text-red-500">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-6">{t('gameConfig.noBopEntries')}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Sessions */}
      {activeTab === 'sessions' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-700">{t('gameConfig.gameSessions')}</h4>
            <Button variant="ghost" size="sm" onClick={addSession}>
              <Plus className="w-3.5 h-3.5 mr-1" />{t('gameConfig.addGameSession')}
            </Button>
          </div>
          <div className="space-y-2">
            {local.sessions.map((gs, idx) => (
              <div key={gs.id} className="flex items-start gap-2 rounded-md border border-gray-200 bg-gray-50 p-2.5">
                <div className="flex flex-col items-center pt-5">
                  <button onClick={() => moveSession(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs text-gray-400 py-0.5">{idx + 1}</span>
                  <button onClick={() => moveSession(idx, 1)} disabled={idx === local.sessions.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
                  <Select label={t('competition.sessionType')} options={SESSION_TYPE_OPTIONS_T(t)} value={gs.type} onChange={(e) => handleSessionTypeChange(gs.id, e.target.value as SessionType)} />
                  <Input label={`${t('common.name')} (${editLang === 'en' ? 'EN' : '中文'})`} value={editLang === 'en' ? gs.name_en : gs.name_zh} onChange={(e) => updateSession(gs.id, editLang === 'en' ? { name_en: e.target.value } : { name_zh: e.target.value })} />
                  {gs.type !== 'race' ? (
                    <Input label={t('gameConfig.durationMinutes')} type="number" value={String(gs.durationMinutes ?? '')} onChange={(e) => updateSession(gs.id, { durationMinutes: Number(e.target.value) })} />
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('gameConfig.raceDuration')}</label>
                      <div className="flex gap-1">
                        <input type="number" className="block w-full min-w-0 rounded-md border border-gray-300 px-2 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" value={String(gs.raceDuration ?? '')} onChange={(e) => updateSession(gs.id, { raceDuration: Number(e.target.value) })} />
                        <select className="rounded-md border border-gray-300 px-1.5 py-2 text-sm" value={gs.raceDurationType || 'time'} onChange={(e) => updateSession(gs.id, { raceDurationType: e.target.value as 'time' | 'laps' })}>
                          <option value="time">{t('gameConfig.timeBased')}</option>
                          <option value="laps">{t('gameConfig.lapsBased')}</option>
                        </select>
                      </div>
                    </div>
                  )}
                  {game === 'ACC' && (
                    <>
                      <Input label={t('gameConfig.dayOfWeekend')} type="number" min="1" max="3" value={String(gs.dayOfWeekend ?? 1)} onChange={(e) => updateSession(gs.id, { dayOfWeekend: Number(e.target.value) })} />
                      <Input label={t('gameConfig.hourOfDay')} type="number" min="0" max="23" value={String(gs.hourOfDay ?? 14)} onChange={(e) => updateSession(gs.id, { hourOfDay: Number(e.target.value) })} />
                    </>
                  )}
                  {game === 'AC' && (
                    <>
                      <Input label={t('gameConfig.waitTime')} type="number" value={String(gs.waitTime ?? 60)} onChange={(e) => updateSession(gs.id, { waitTime: Number(e.target.value) })} />
                      <Select label={t('gameConfig.isOpen')} options={IS_OPEN_OPTIONS} value={String(gs.isOpen ?? 1)} onChange={(e) => updateSession(gs.id, { isOpen: Number(e.target.value) })} />
                    </>
                  )}
                </div>
                <button onClick={() => deleteSession(gs.id)} className="mt-6 text-gray-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {local.sessions.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">{t('gameConfig.noGameSessions')}</p>
            )}
          </div>
        </div>
      )}

      {/* Tab: Splits */}
      {activeTab === 'splits' && (
        <div className="space-y-3">
          {splitCount > 1 && (
            <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-700">
              {t('gameConfig.splitCountFixed', { count: local.splits.length })}
            </div>
          )}
          {local.splits.map((split) => (
            <div key={split.id} className="rounded-md border border-gray-200 bg-gray-50 p-4 space-y-4">
              {splitCount > 1 && (
                <div className="flex items-center gap-2">
                  <Badge variant="info">{t('gameConfig.split')} {split.splitNumber}</Badge>
                </div>
              )}
              <div>
                <h5 className="text-xs font-semibold text-gray-600 mb-2">{t('gameConfig.basicInfo')}</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input label={t('gameConfig.serverName')} value={split.serverName || ''} onChange={(e) => setSplitField(split.id, 'serverName', e.target.value)} />
                  <Input label={t('gameConfig.serverPassword')} value={split.serverPassword || ''} onChange={(e) => setSplitField(split.id, 'serverPassword', e.target.value)} />
                  <Input label={t('gameConfig.adminPassword')} value={split.adminPassword || ''} onChange={(e) => setSplitField(split.id, 'adminPassword', e.target.value)} />
                  {game === 'ACC' && <Input label={t('gameConfig.spectatorPassword')} value={split.spectatorPassword || ''} onChange={(e) => setSplitField(split.id, 'spectatorPassword', e.target.value)} />}
                  <Input label={t('gameConfig.maxConnections')} type="number" value={String(split.maxConnections ?? 30)} onChange={(e) => setSplitField(split.id, 'maxConnections', Number(e.target.value))} />
                  <Select label={t('gameConfig.registerToLobby')} options={YES_NO} value={String(split.registerToLobby ?? true)} onChange={(e) => setSplitField(split.id, 'registerToLobby', e.target.value === 'true')} />
                </div>
              </div>
              <div>
                <h5 className="text-xs font-semibold text-gray-600 mb-2">{t('gameConfig.networkConfig')}</h5>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input label={t('gameConfig.udpPort')} type="number" value={String(split.udpPort ?? 9600)} onChange={(e) => setSplitField(split.id, 'udpPort', Number(e.target.value))} />
                  <Input label={t('gameConfig.tcpPort')} type="number" value={String(split.tcpPort ?? 9600)} onChange={(e) => setSplitField(split.id, 'tcpPort', Number(e.target.value))} />
                  {game === 'AC' && <Input label={t('gameConfig.httpPort')} type="number" value={String(split.httpPort ?? 8081)} onChange={(e) => setSplitField(split.id, 'httpPort', Number(e.target.value))} />}
                  {game === 'ACC' && <Select label={t('gameConfig.lanDiscovery')} options={LAN_DISCOVERY_OPTIONS} value={String(split.lanDiscovery ?? 1)} onChange={(e) => setSplitField(split.id, 'lanDiscovery', Number(e.target.value))} />}
                </div>
              </div>
              {game === 'ACC' && (
                <div>
                  <h5 className="text-xs font-semibold text-gray-600 mb-2">{t('gameConfig.accServerSettings')}</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input label={t('gameConfig.maxCarSlots')} type="number" value={String(split.maxCarSlots ?? 30)} onChange={(e) => setSplitField(split.id, 'maxCarSlots', Number(e.target.value))} />
                    <Select label={t('gameConfig.isRaceLocked')} options={YES_NO_INT} value={String(split.isRaceLocked ?? 1)} onChange={(e) => setSplitField(split.id, 'isRaceLocked', Number(e.target.value))} />
                    <Select label={t('gameConfig.isLockedPrepPhase')} options={YES_NO_INT} value={String(split.isLockedPrepPhase ?? 0)} onChange={(e) => setSplitField(split.id, 'isLockedPrepPhase', Number(e.target.value))} />
                    <Select label={t('gameConfig.shortFormationLap')} options={YES_NO_INT} value={String(split.shortFormationLap ?? 1)} onChange={(e) => setSplitField(split.id, 'shortFormationLap', Number(e.target.value))} />
                    <Select label={t('gameConfig.dumpLeaderboards')} options={YES_NO_INT} value={String(split.dumpLeaderboards ?? 1)} onChange={(e) => setSplitField(split.id, 'dumpLeaderboards', Number(e.target.value))} />
                    <Select label={t('gameConfig.dumpEntryList')} options={YES_NO_INT} value={String(split.dumpEntryList ?? 1)} onChange={(e) => setSplitField(split.id, 'dumpEntryList', Number(e.target.value))} />
                    <Select label={t('gameConfig.randomizeTrackWhenEmpty')} options={YES_NO_INT} value={String(split.randomizeTrackWhenEmpty ?? 0)} onChange={(e) => setSplitField(split.id, 'randomizeTrackWhenEmpty', Number(e.target.value))} />
                    <Select label={t('gameConfig.allowAutoDQ')} options={YES_NO_INT} value={String(split.allowAutoDQ ?? 1)} onChange={(e) => setSplitField(split.id, 'allowAutoDQ', Number(e.target.value))} />
                    <Select label={t('gameConfig.ignorePrematureDisconnects')} options={YES_NO_INT} value={String(split.ignorePrematureDisconnects ?? 1)} onChange={(e) => setSplitField(split.id, 'ignorePrematureDisconnects', Number(e.target.value))} />
                  </div>
                </div>
              )}
              {game === 'AC' && (
                <div>
                  <h5 className="text-xs font-semibold text-gray-600 mb-2">{t('gameConfig.acServerSettings')}</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Select label={t('gameConfig.pickupModeEnabled')} options={YES_NO_INT} value={String(split.pickupModeEnabled ?? 1)} onChange={(e) => setSplitField(split.id, 'pickupModeEnabled', Number(e.target.value))} />
                    <Select label={t('gameConfig.lockedEntryList')} options={YES_NO_INT} value={String(split.lockedEntryList ?? 0)} onChange={(e) => setSplitField(split.id, 'lockedEntryList', Number(e.target.value))} />
                    <Input label={t('gameConfig.votingQuorum')} type="number" min="0" max="100" value={String(split.votingQuorum ?? 75)} onChange={(e) => setSplitField(split.id, 'votingQuorum', Number(e.target.value))} />
                    <Input label={t('gameConfig.voteDuration')} type="number" value={String(split.voteDuration ?? 20)} onChange={(e) => setSplitField(split.id, 'voteDuration', Number(e.target.value))} />
                    <Select label={t('gameConfig.blacklistMode')} options={BLACKLIST_MODE_OPTIONS} value={String(split.blacklistMode ?? 0)} onChange={(e) => setSplitField(split.id, 'blacklistMode', Number(e.target.value))} />
                    <Input label={t('gameConfig.clientSendIntervalHz')} type="number" value={String(split.clientSendIntervalHz ?? 15)} onChange={(e) => setSplitField(split.id, 'clientSendIntervalHz', Number(e.target.value))} />
                    <Input label={t('gameConfig.qualifyMaxWaitPerc')} type="number" value={String(split.qualifyMaxWaitPerc ?? 120)} onChange={(e) => setSplitField(split.id, 'qualifyMaxWaitPerc', Number(e.target.value))} />
                    <Input label={t('gameConfig.maxBallastKg')} type="number" value={String(split.maxBallastKg ?? 0)} onChange={(e) => setSplitField(split.id, 'maxBallastKg', Number(e.target.value))} />
                    <Select label={t('gameConfig.raceGasPenaltyDisabled')} options={YES_NO_INT} value={String(split.raceGasPenaltyDisabled ?? 0)} onChange={(e) => setSplitField(split.id, 'raceGasPenaltyDisabled', Number(e.target.value))} />
                    <Input label={t('gameConfig.resultScreenTime')} type="number" value={String(split.resultScreenTime ?? 60)} onChange={(e) => setSplitField(split.id, 'resultScreenTime', Number(e.target.value))} />
                    <Input label={t('gameConfig.welcomeMessage')} value={split.welcomeMessage || ''} onChange={(e) => setSplitField(split.id, 'welcomeMessage', e.target.value)} />
                  </div>
                </div>
              )}
              <div>
                <h5 className="text-xs font-semibold text-gray-600 mb-2">{t('gameConfig.entryListConfig')} <span className="font-mono text-gray-400">{game === 'ACC' ? 'entrylist.json' : 'entry_list.ini'}</span></h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {game === 'ACC' && (
                    <>
                      <Input label={t('gameConfig.centralEntryListPath')} value={split.centralEntryListPath || ''} onChange={(e) => setSplitField(split.id, 'centralEntryListPath', e.target.value)} />
                      <Select label={t('gameConfig.forceEntryList')} options={YES_NO_INT} value={String(split.forceEntryList ?? 0)} onChange={(e) => setSplitField(split.id, 'forceEntryList', Number(e.target.value))} />
                    </>
                  )}
                  {game === 'AC' && (
                    <p className="text-xs text-gray-500 md:col-span-2">{t('gameConfig.entryListHintAC')}</p>
                  )}
                </div>
              </div>
              <EntryListEditor
                split={split}
                game={game}
                editLang={editLang}
                t={t}
                registeredDrivers={registeredDrivers}
                onAutoGenerate={() => autoGenerateEntryList(split.id)}
                onAddEntry={() => addEntryListEntry(split.id)}
                onUpdateEntry={(entryId, patch) => updateEntryListEntry(split.id, entryId, patch)}
                onDeleteEntry={(entryId) => deleteEntryListEntry(split.id, entryId)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Server errors */}
      {serverErrors.length > 0 && (
        <div className="mt-4 rounded-md bg-red-50 border border-red-200 px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">{t('gameConfig.cannotStartServer')}</span>
          </div>
          <ul className="text-sm text-red-600 ml-6 list-disc">
            {serverErrors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={handleStartServer}>
            <Power className="w-4 h-4 mr-1" />
            {t('gameConfig.startServer')}
          </Button>
          {serverErrors.length === 0 && (
            <span className="text-xs text-gray-400">{t('gameConfig.autoStartHint')}</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={handleSave}>{t('common.save')}</Button>
        </div>
      </div>

      {/* Save as template modal */}
      {showSaveAsTemplate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={() => setShowSaveAsTemplate(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-900">{t('template.saveAsTemplate')}</h3>
            <Input
              label={`${t('template.templateName')} (${editLang === 'en' ? 'EN' : '中文'})`}
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
              placeholder={editLang === 'en' ? local.name_en : local.name_zh}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowSaveAsTemplate(false)}>{t('common.cancel')}</Button>
              <Button variant="primary" size="sm" onClick={handleSaveAsTemplate} disabled={!tplName.trim()}>{t('common.save')}</Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

function EntryListEditor({
  split,
  game,
  t,
  registeredDrivers,
  onAutoGenerate,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
}: {
  split: Split
  game: GamePlatform
  editLang: 'en' | 'zh'
  t: (key: string, opts?: Record<string, unknown>) => string
  registeredDrivers: Array<{ id: string; nickname: string; teamName?: string; teamId?: string }>
  onAutoGenerate: () => void
  onAddEntry: () => void
  onUpdateEntry: (entryId: string, patch: Partial<EntryListEntry>) => void
  onDeleteEntry: (entryId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showAutoConfirm, setShowAutoConfirm] = useState(false)
  const entries = split.entryList ?? []

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2">
          {expanded
            ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
          <span className="text-sm font-medium text-gray-700">{t('serverConfig.entryListTitle')}</span>
          <span className="text-xs font-mono text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">
            {game === 'ACC' ? 'entrylist.json' : 'entry_list.ini'}
          </span>
          {entries.length > 0 && (
            <Badge variant="default">{entries.length}</Badge>
          )}
        </button>
        {expanded && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setShowAutoConfirm(true)}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              {t('serverConfig.entryListAutoGenerate')}
            </Button>
            <Button variant="ghost" size="sm" onClick={onAddEntry}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              {t('serverConfig.entryListAddEntry')}
            </Button>
          </div>
        )}
      </div>
      {expanded && (
        <div className="p-3">
          {entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('serverConfig.entryListRaceNumber')}</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('serverConfig.entryListDriver')}</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('serverConfig.entryListTeamName')}</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('serverConfig.entryListCarModel')}</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('serverConfig.entryListBallast')}</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('serverConfig.entryListRestrictor')}</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t('serverConfig.entryListIsAdmin')}</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5 w-20">
                        <input
                          type="number"
                          className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={String(entry.raceNumber)}
                          onChange={(e) => onUpdateEntry(entry.id, { raceNumber: Number(e.target.value) })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          className="block w-full min-w-[120px] rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={entry.driverId || ''}
                          onChange={(e) => {
                            const driver = registeredDrivers.find(d => d.id === e.target.value)
                            if (driver) {
                              onUpdateEntry(entry.id, { driverId: driver.id, driverName: driver.nickname, teamName: driver.teamName })
                            } else {
                              onUpdateEntry(entry.id, { driverId: undefined, driverName: '' })
                            }
                          }}
                        >
                          <option value="">{t('serverConfig.entryListSelectDriver')}</option>
                          {registeredDrivers
                            .filter(d => d.id === entry.driverId || !entries.some(e => e.id !== entry.id && e.driverId === d.id))
                            .map(d => (
                              <option key={d.id} value={d.id}>
                                {d.nickname}{d.teamName ? ` (${d.teamName})` : ''}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className="block w-full min-w-[80px] rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={entry.teamName || ''}
                          onChange={(e) => onUpdateEntry(entry.id, { teamName: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className="block w-full min-w-[80px] rounded-md border border-gray-300 px-2 py-1.5 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={entry.carModel || ''}
                          onChange={(e) => onUpdateEntry(entry.id, { carModel: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5 w-20">
                        <input
                          type="number"
                          className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={String(entry.ballastKg ?? 0)}
                          onChange={(e) => onUpdateEntry(entry.id, { ballastKg: Number(e.target.value) })}
                        />
                      </td>
                      <td className="px-2 py-1.5 w-20">
                        <input
                          type="number"
                          className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={String(entry.restrictor ?? 0)}
                          onChange={(e) => onUpdateEntry(entry.id, { restrictor: Number(e.target.value) })}
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={entry.isServerAdmin ?? false}
                          onChange={(e) => onUpdateEntry(entry.id, { isServerAdmin: e.target.checked })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <button onClick={() => onDeleteEntry(entry.id)} className="text-gray-300 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">{t('serverConfig.entryListEmpty')}</p>
          )}
        </div>
      )}
      {showAutoConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={() => setShowAutoConfirm(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-900">{t('serverConfig.entryListAutoGenerate')}</h3>
            <p className="text-sm text-gray-600">{t('serverConfig.entryListAutoGenerateConfirm')}</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowAutoConfirm(false)}>{t('common.cancel')}</Button>
              <Button variant="primary" size="sm" onClick={() => { onAutoGenerate(); setShowAutoConfirm(false) }}>{t('common.confirm')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
