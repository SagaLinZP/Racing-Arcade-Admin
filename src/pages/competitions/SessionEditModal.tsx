import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { createDefaultGameConfig, createDefaultSplit, createDefaultGameSession, sessionTemplates } from '@/data/competitions'
import type { Session, SessionGameConfig, Split, GamePlatform, SessionType, GameSessionEntry, SessionTemplate } from '@/data/competitions'
import { GameConfigEditor } from './GameConfigEditor'
import { YES_NO, SESSION_TYPE_OPTIONS_T, IS_OPEN_OPTIONS, LAN_DISCOVERY_OPTIONS, BLACKLIST_MODE_OPTIONS, YES_NO_INT } from './gameConfigOptions'
import { Plus, Trash2, ChevronUp, ChevronDown, Power, AlertCircle } from 'lucide-react'

type TabKey = 'session' | 'gameConfig' | 'splits'

export function SessionEditModal({
  isOpen,
  onClose,
  onSave,
  session,
  editLang,
  game,
  splitCount,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (session: Session) => void
  session: Session
  editLang: 'en' | 'zh'
  game: GamePlatform
  splitCount: number
}) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabKey>('session')
  const [local, setLocal] = useState<Session>(() => {
    const base: Session = {
      ...session,
      gameConfig: session.gameConfig ?? createDefaultGameConfig(game),
    }
    const current = base.splits
    if (current.length < splitCount) {
      const added: Split[] = []
      for (let i = current.length; i < splitCount; i++) {
        added.push(createDefaultSplit(base.id, i + 1))
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
  const [tplDesc, setTplDesc] = useState('')
  const [serverErrors, setServerErrors] = useState<string[]>([])

  const gc = local.gameConfig!

  const setField = <K extends keyof Session>(key: K, value: Session[K]) =>
    setLocal(prev => ({ ...prev, [key]: value }))

  const setGC = (key: keyof SessionGameConfig, value: string | number | boolean) =>
    setLocal(prev => ({ ...prev, gameConfig: { ...prev.gameConfig!, [key]: value } }))

  const setSplitField = (splitId: string, key: keyof Split, value: string | number | boolean) =>
    setLocal(prev => ({
      ...prev,
      splits: prev.splits.map(s => s.id === splitId ? { ...s, [key]: value } : s),
    }))

  const updateGameSession = (gsId: string, patch: Partial<GameSessionEntry>) =>
    setLocal(prev => ({
      ...prev,
      gameSessions: prev.gameSessions.map(gs => gs.id === gsId ? { ...gs, ...patch } : gs),
    }))

  const handleGameSessionTypeChange = (gsId: string, newType: SessionType) => {
    setLocal(prev => ({
      ...prev,
      gameSessions: prev.gameSessions.map(gs => {
        if (gs.id !== gsId) return gs
        if (newType === 'race') {
          return { ...gs, type: newType, durationMinutes: undefined, raceDuration: gs.raceDuration ?? 60, raceDurationType: gs.raceDurationType ?? 'time' }
        }
        return { ...gs, type: newType, raceDuration: undefined, raceDurationType: undefined, durationMinutes: gs.durationMinutes ?? (newType === 'qualifying' ? 15 : 30) }
      }),
    }))
  }

  const addGameSession = () => {
    const newGs = createDefaultGameSession('practice')
    setLocal(prev => ({ ...prev, gameSessions: [...prev.gameSessions, newGs] }))
  }

  const deleteGameSession = (gsId: string) => {
    setLocal(prev => ({ ...prev, gameSessions: prev.gameSessions.filter(gs => gs.id !== gsId) }))
  }

  const moveGameSession = (idx: number, dir: -1 | 1) => {
    setLocal(prev => {
      const arr = [...prev.gameSessions]
      const target = idx + dir
      if (target < 0 || target >= arr.length) return prev
      ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
      return { ...prev, gameSessions: arr }
    })
  }

  const handleApplyTemplate = () => {
    const tpl = sessionTemplates.find(t => t.id === selectedTemplateId)
    if (!tpl) return
    setLocal(prev => ({
      ...prev,
      gameConfig: { ...tpl.gameConfig },
      gameSessions: tpl.gameSessions ?? prev.gameSessions,
      splits: tpl.splitConfig
        ? prev.splits.map(s => ({ ...s, ...tpl.splitConfig }))
        : prev.splits,
    }))
    setSelectedTemplateId('')
  }

  const handleSaveAsTemplate = () => {
    const now = new Date().toISOString()
    const raceGs = local.gameSessions.find(gs => gs.type === 'race')
    const splitConfig: Partial<Split> | undefined = local.splits[0]
      ? Object.fromEntries(
          Object.entries(local.splits[0]).filter(([k]) =>
            !['id', 'sessionId', 'splitNumber', 'results', 'resultsPublishedAt'].includes(k),
          ),
        )
      : undefined
    const newTpl: SessionTemplate = {
      id: `tpl_${Date.now()}`,
      name_zh: editLang === 'zh' ? tplName : local.name_zh,
      name_en: editLang === 'en' ? tplName : local.name_en,
      description_zh: editLang === 'zh' ? tplDesc : '',
      description_en: editLang === 'en' ? tplDesc : '',
      game,
      sessionType: raceGs?.type ?? local.gameSessions[0]?.type ?? 'race',
      gameConfig: { ...local.gameConfig! },
      gameSessions: local.gameSessions.map(gs => ({ ...gs })),
      splitConfig,
      createdAt: now,
      updatedAt: now,
    }
    sessionTemplates.push(newTpl)
    setTplName('')
    setTplDesc('')
    setShowSaveAsTemplate(false)
  }

  const validateServerStart = (): string[] => {
    const errors: string[] = []
    if (local.gameSessions.length === 0) {
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
    const errors = validateServerStart()
    setServerErrors(errors)
  }

  const handleSave = () => { onSave(local); onClose() }

  const compatibleTemplates = sessionTemplates.filter(tpl => tpl.game === game)

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'session', label: t('gameConfig.tabSession') },
    { key: 'gameConfig', label: t('gameConfig.tabGameConfig') },
    { key: 'splits', label: splitCount > 1 ? t('gameConfig.tabSplits') : t('gameConfig.tabServer') },
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('competition.session')} — ${editLang === 'en' ? local.name_en : local.name_zh}`}
      size="2xl"
    >
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
        <Button
          variant="secondary"
          size="sm"
          onClick={handleApplyTemplate}
          disabled={!selectedTemplateId}
        >
          {t('template.apply')}
        </Button>
        <div className="w-px h-8 bg-gray-300 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSaveAsTemplate(true)}
        >
          {t('template.saveAsTemplate')}
        </Button>
      </div>

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

      {activeTab === 'session' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('gameConfig.basicInfo')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label={`${t('competition.sessionName')} (${editLang === 'en' ? 'EN' : '中文'})`}
                value={editLang === 'en' ? local.name_en : local.name_zh}
                onChange={(e) => setField(editLang === 'en' ? 'name_en' : 'name_zh', e.target.value)}
              />
              <Input label={t('common.from')} type="datetime-local" value={local.startsAt.slice(0, 16)} onChange={(e) => setField('startsAt', e.target.value)} />
              <Input label={t('common.to')} type="datetime-local" value={local.endsAt.slice(0, 16)} onChange={(e) => setField('endsAt', e.target.value)} />
              <Select label={t('competition.resultType')} options={[{ value: 'classification', label: t('competition.resultTypeClassification') }, { value: 'leaderboard', label: t('competition.resultTypeLeaderboard') }]} value={local.resultType} onChange={(e) => setField('resultType', e.target.value as 'classification' | 'leaderboard')} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'gameConfig' && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">{t('gameConfig.gameSessions')}</h4>
              <Button variant="ghost" size="sm" onClick={addGameSession}>
                <Plus className="w-3.5 h-3.5 mr-1" />{t('gameConfig.addGameSession')}
              </Button>
            </div>
            <div className="space-y-2">
              {local.gameSessions.map((gs, idx) => (
                <div key={gs.id} className="flex items-start gap-2 rounded-md border border-gray-200 bg-gray-50 p-2.5">
                  <div className="flex flex-col items-center pt-5">
                    <button
                      onClick={() => moveGameSession(idx, -1)}
                      disabled={idx === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs text-gray-400 py-0.5">{idx + 1}</span>
                    <button
                      onClick={() => moveGameSession(idx, 1)}
                      disabled={idx === local.gameSessions.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
                    <Select
                      label={t('competition.sessionType')}
                      options={SESSION_TYPE_OPTIONS_T(t)}
                      value={gs.type}
                      onChange={(e) => handleGameSessionTypeChange(gs.id, e.target.value as SessionType)}
                    />
                    <Input
                      label={`${t('common.name')} (${editLang === 'en' ? 'EN' : '中文'})`}
                      value={editLang === 'en' ? gs.name_en : gs.name_zh}
                      onChange={(e) => updateGameSession(gs.id, editLang === 'en' ? { name_en: e.target.value } : { name_zh: e.target.value })}
                    />
                    {gs.type !== 'race' ? (
                      <Input
                        label={t('gameConfig.durationMinutes')}
                        type="number"
                        value={String(gs.durationMinutes ?? '')}
                        onChange={(e) => updateGameSession(gs.id, { durationMinutes: Number(e.target.value) })}
                      />
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('gameConfig.raceDuration')}</label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            className="block w-full min-w-0 rounded-md border border-gray-300 px-2 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={String(gs.raceDuration ?? '')}
                            onChange={(e) => updateGameSession(gs.id, { raceDuration: Number(e.target.value) })}
                          />
                          <select
                            className="rounded-md border border-gray-300 px-1.5 py-2 text-sm"
                            value={gs.raceDurationType || 'time'}
                            onChange={(e) => updateGameSession(gs.id, { raceDurationType: e.target.value as 'time' | 'laps' })}
                          >
                            <option value="time">{t('gameConfig.timeBased')}</option>
                            <option value="laps">{t('gameConfig.lapsBased')}</option>
                          </select>
                        </div>
                      </div>
                    )}
                    {game === 'ACC' && (
                      <>
                        <Input
                          label={t('gameConfig.dayOfWeekend')}
                          type="number"
                          min="1"
                          max="3"
                          value={String(gs.dayOfWeekend ?? 1)}
                          onChange={(e) => updateGameSession(gs.id, { dayOfWeekend: Number(e.target.value) })}
                        />
                        <Input
                          label={t('gameConfig.hourOfDay')}
                          type="number"
                          min="0"
                          max="23"
                          value={String(gs.hourOfDay ?? 14)}
                          onChange={(e) => updateGameSession(gs.id, { hourOfDay: Number(e.target.value) })}
                        />
                      </>
                    )}
                    {game === 'AC' && (
                      <>
                        <Input
                          label={t('gameConfig.waitTime')}
                          type="number"
                          value={String(gs.waitTime ?? 60)}
                          onChange={(e) => updateGameSession(gs.id, { waitTime: Number(e.target.value) })}
                        />
                        <Select
                          label={t('gameConfig.isOpen')}
                          options={IS_OPEN_OPTIONS}
                          value={String(gs.isOpen ?? 1)}
                          onChange={(e) => updateGameSession(gs.id, { isOpen: Number(e.target.value) })}
                        />
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => deleteGameSession(gs.id)}
                    className="mt-6 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {local.gameSessions.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">{t('gameConfig.noGameSessions')}</p>
              )}
            </div>
          </div>

          <GameConfigEditor
            gameConfig={gc}
            game={game}
            onChange={setGC}
          />
        </div>
      )}

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
                  {split.resultsPublishedAt && (
                    <Badge variant="success">{t('gameConfig.resultsPublished')}</Badge>
                  )}
                </div>
              )}

              <div>
                <h5 className="text-xs font-semibold text-gray-600 mb-2">{t('gameConfig.basicInfo')}</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input label={t('gameConfig.serverName')} value={split.serverName || ''} onChange={(e) => setSplitField(split.id, 'serverName', e.target.value)} />
                  <Input label={t('gameConfig.serverPassword')} value={split.serverPassword || ''} onChange={(e) => setSplitField(split.id, 'serverPassword', e.target.value)} />
                  <Input label={t('gameConfig.adminPassword')} value={split.adminPassword || ''} onChange={(e) => setSplitField(split.id, 'adminPassword', e.target.value)} />
                  {game === 'ACC' && (
                    <Input label={t('gameConfig.spectatorPassword')} value={split.spectatorPassword || ''} onChange={(e) => setSplitField(split.id, 'spectatorPassword', e.target.value)} />
                  )}
                  <Input label={t('gameConfig.maxConnections')} type="number" value={String(split.maxConnections ?? 30)} onChange={(e) => setSplitField(split.id, 'maxConnections', Number(e.target.value))} />
                  <Select label={t('gameConfig.registerToLobby')} options={YES_NO} value={String(split.registerToLobby ?? true)} onChange={(e) => setSplitField(split.id, 'registerToLobby', e.target.value === 'true')} />
                </div>
              </div>

              <div>
                <h5 className="text-xs font-semibold text-gray-600 mb-2">{t('gameConfig.networkConfig')}</h5>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input label={t('gameConfig.udpPort')} type="number" value={String(split.udpPort ?? 9600)} onChange={(e) => setSplitField(split.id, 'udpPort', Number(e.target.value))} />
                  <Input label={t('gameConfig.tcpPort')} type="number" value={String(split.tcpPort ?? 9600)} onChange={(e) => setSplitField(split.id, 'tcpPort', Number(e.target.value))} />
                  {game === 'AC' && (
                    <Input label={t('gameConfig.httpPort')} type="number" value={String(split.httpPort ?? 8081)} onChange={(e) => setSplitField(split.id, 'httpPort', Number(e.target.value))} />
                  )}
                  {game === 'ACC' && (
                    <Select label={t('gameConfig.lanDiscovery')} options={LAN_DISCOVERY_OPTIONS} value={String(split.lanDiscovery ?? 1)} onChange={(e) => setSplitField(split.id, 'lanDiscovery', Number(e.target.value))} />
                  )}
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
            </div>
          ))}
        </div>
      )}

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

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={handleStartServer}>
            <Power className="w-4 h-4 mr-1" />
            {t('gameConfig.startServer')}
          </Button>
          {serverErrors.length === 0 && (
            <span className="text-xs text-gray-400">
              {t('gameConfig.autoStartHint')}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={handleSave}>{t('common.save')}</Button>
        </div>
      </div>

      <Modal
        isOpen={showSaveAsTemplate}
        onClose={() => setShowSaveAsTemplate(false)}
        title={t('template.saveAsTemplate')}
        size="md"
      >
        <div className="space-y-3">
          <Input
            label={`${t('template.templateName')} (${editLang === 'en' ? 'EN' : '中文'})`}
            value={tplName}
            onChange={(e) => setTplName(e.target.value)}
            placeholder={editLang === 'en' ? local.name_en : local.name_zh}
          />
          <Input
            label={`${t('common.description')} (${editLang === 'en' ? 'EN' : '中文'})`}
            value={tplDesc}
            onChange={(e) => setTplDesc(e.target.value)}
          />
          <div className="text-sm text-gray-500">
            {t('gameConfig.track')}: {gc.track || '—'}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={() => setShowSaveAsTemplate(false)}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={handleSaveAsTemplate} disabled={!tplName.trim()}>{t('common.save')}</Button>
        </div>
      </Modal>
    </Modal>
  )
}
