import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { createDefaultSession } from '@/data/competitions'
import type { Split, GamePlatform, Session, SessionType } from '@/data/competitions'
import {
  YES_NO,
  SESSION_TYPE_OPTIONS_T,
  IS_OPEN_OPTIONS,
  LAN_DISCOVERY_OPTIONS,
  BLACKLIST_MODE_OPTIONS,
  YES_NO_INT,
} from './gameConfigOptions'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'

/**
 * All server-level Split fields (passwords, ports, server settings, advanced).
 * Excludes the driver entry list — that is registration-specific.
 */
export function SplitServerFields({
  split,
  game,
  onChange,
}: {
  split: Partial<Split>
  game: GamePlatform
  onChange: (key: keyof Split, value: string | number | boolean) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      <div>
        <h5 className="text-xs font-semibold text-gray-600 mb-2">{t('gameConfig.basicInfo')}</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input label={t('gameConfig.serverName')} value={split.serverName || ''} onChange={(e) => onChange('serverName', e.target.value)} />
          <Input label={t('gameConfig.serverPassword')} value={split.serverPassword || ''} onChange={(e) => onChange('serverPassword', e.target.value)} />
          <Input label={t('gameConfig.adminPassword')} value={split.adminPassword || ''} onChange={(e) => onChange('adminPassword', e.target.value)} />
          {game === 'ACC' && <Input label={t('gameConfig.spectatorPassword')} value={split.spectatorPassword || ''} onChange={(e) => onChange('spectatorPassword', e.target.value)} />}
          <Input label={t('gameConfig.maxConnections')} type="number" value={String(split.maxConnections ?? 30)} onChange={(e) => onChange('maxConnections', Number(e.target.value))} />
          <Select label={t('gameConfig.registerToLobby')} options={YES_NO} value={String(split.registerToLobby ?? true)} onChange={(e) => onChange('registerToLobby', e.target.value === 'true')} />
        </div>
      </div>
      <div>
        <h5 className="text-xs font-semibold text-gray-600 mb-2">{t('gameConfig.networkConfig')}</h5>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input label={t('gameConfig.udpPort')} type="number" value={String(split.udpPort ?? 9600)} onChange={(e) => onChange('udpPort', Number(e.target.value))} />
          <Input label={t('gameConfig.tcpPort')} type="number" value={String(split.tcpPort ?? 9600)} onChange={(e) => onChange('tcpPort', Number(e.target.value))} />
          {game === 'AC' && <Input label={t('gameConfig.httpPort')} type="number" value={String(split.httpPort ?? 8081)} onChange={(e) => onChange('httpPort', Number(e.target.value))} />}
          {game === 'ACC' && <Select label={t('gameConfig.lanDiscovery')} options={LAN_DISCOVERY_OPTIONS} value={String(split.lanDiscovery ?? 1)} onChange={(e) => onChange('lanDiscovery', Number(e.target.value))} />}
        </div>
      </div>
      {game === 'ACC' && (
        <div>
          <h5 className="text-xs font-semibold text-gray-600 mb-2">{t('gameConfig.accServerSettings')}</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input label={t('gameConfig.maxCarSlots')} type="number" value={String(split.maxCarSlots ?? 30)} onChange={(e) => onChange('maxCarSlots', Number(e.target.value))} />
            <Select label={t('gameConfig.isRaceLocked')} options={YES_NO_INT} value={String(split.isRaceLocked ?? 1)} onChange={(e) => onChange('isRaceLocked', Number(e.target.value))} />
            <Select label={t('gameConfig.isLockedPrepPhase')} options={YES_NO_INT} value={String(split.isLockedPrepPhase ?? 0)} onChange={(e) => onChange('isLockedPrepPhase', Number(e.target.value))} />
            <Select label={t('gameConfig.shortFormationLap')} options={YES_NO_INT} value={String(split.shortFormationLap ?? 1)} onChange={(e) => onChange('shortFormationLap', Number(e.target.value))} />
            <Select label={t('gameConfig.dumpLeaderboards')} options={YES_NO_INT} value={String(split.dumpLeaderboards ?? 1)} onChange={(e) => onChange('dumpLeaderboards', Number(e.target.value))} />
            <Select label={t('gameConfig.dumpEntryList')} options={YES_NO_INT} value={String(split.dumpEntryList ?? 1)} onChange={(e) => onChange('dumpEntryList', Number(e.target.value))} />
            <Select label={t('gameConfig.randomizeTrackWhenEmpty')} options={YES_NO_INT} value={String(split.randomizeTrackWhenEmpty ?? 0)} onChange={(e) => onChange('randomizeTrackWhenEmpty', Number(e.target.value))} />
            <Select label={t('gameConfig.allowAutoDQ')} options={YES_NO_INT} value={String(split.allowAutoDQ ?? 1)} onChange={(e) => onChange('allowAutoDQ', Number(e.target.value))} />
            <Select label={t('gameConfig.ignorePrematureDisconnects')} options={YES_NO_INT} value={String(split.ignorePrematureDisconnects ?? 1)} onChange={(e) => onChange('ignorePrematureDisconnects', Number(e.target.value))} />
          </div>
          <h5 className="text-xs font-semibold text-gray-600 mt-4 mb-2">{t('gameConfig.entryListConfig')} <span className="font-mono text-gray-400">entrylist.json</span></h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label={t('gameConfig.centralEntryListPath')} value={split.centralEntryListPath || ''} onChange={(e) => onChange('centralEntryListPath', e.target.value)} />
            <Select label={t('gameConfig.forceEntryList')} options={YES_NO_INT} value={String(split.forceEntryList ?? 0)} onChange={(e) => onChange('forceEntryList', Number(e.target.value))} />
          </div>
        </div>
      )}
      {game === 'AC' && (
        <div>
          <h5 className="text-xs font-semibold text-gray-600 mb-2">{t('gameConfig.acServerSettings')}</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select label={t('gameConfig.pickupModeEnabled')} options={YES_NO_INT} value={String(split.pickupModeEnabled ?? 1)} onChange={(e) => onChange('pickupModeEnabled', Number(e.target.value))} />
            <Select label={t('gameConfig.lockedEntryList')} options={YES_NO_INT} value={String(split.lockedEntryList ?? 0)} onChange={(e) => onChange('lockedEntryList', Number(e.target.value))} />
            <Input label={t('gameConfig.votingQuorum')} type="number" min="0" max="100" value={String(split.votingQuorum ?? 75)} onChange={(e) => onChange('votingQuorum', Number(e.target.value))} />
            <Input label={t('gameConfig.voteDuration')} type="number" value={String(split.voteDuration ?? 20)} onChange={(e) => onChange('voteDuration', Number(e.target.value))} />
            <Select label={t('gameConfig.blacklistMode')} options={BLACKLIST_MODE_OPTIONS} value={String(split.blacklistMode ?? 0)} onChange={(e) => onChange('blacklistMode', Number(e.target.value))} />
            <Input label={t('gameConfig.clientSendIntervalHz')} type="number" value={String(split.clientSendIntervalHz ?? 15)} onChange={(e) => onChange('clientSendIntervalHz', Number(e.target.value))} />
            <Input label={t('gameConfig.qualifyMaxWaitPerc')} type="number" value={String(split.qualifyMaxWaitPerc ?? 120)} onChange={(e) => onChange('qualifyMaxWaitPerc', Number(e.target.value))} />
            <Input label={t('gameConfig.maxBallastKg')} type="number" value={String(split.maxBallastKg ?? 0)} onChange={(e) => onChange('maxBallastKg', Number(e.target.value))} />
            <Select label={t('gameConfig.raceGasPenaltyDisabled')} options={YES_NO_INT} value={String(split.raceGasPenaltyDisabled ?? 0)} onChange={(e) => onChange('raceGasPenaltyDisabled', Number(e.target.value))} />
            <Input label={t('gameConfig.resultScreenTime')} type="number" value={String(split.resultScreenTime ?? 60)} onChange={(e) => onChange('resultScreenTime', Number(e.target.value))} />
            <Input label={t('gameConfig.welcomeMessage')} value={split.welcomeMessage || ''} onChange={(e) => onChange('welcomeMessage', e.target.value)} />
          </div>
          <h5 className="text-xs font-semibold text-gray-600 mt-4 mb-2">{t('gameConfig.advancedSettings')}</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input label={t('gameConfig.numThreads')} type="number" value={String(split.numThreads ?? 2)} onChange={(e) => onChange('numThreads', Number(e.target.value))} />
            <Input label={t('gameConfig.sleepTime')} type="number" value={String(split.sleepTime ?? 1)} onChange={(e) => onChange('sleepTime', Number(e.target.value))} />
            <Input label={t('gameConfig.udpPluginLocalPort')} type="number" value={String(split.udpPluginLocalPort ?? 0)} onChange={(e) => onChange('udpPluginLocalPort', Number(e.target.value))} />
            <Input label={t('gameConfig.udpPluginAddress')} value={split.udpPluginAddress || ''} onChange={(e) => onChange('udpPluginAddress', e.target.value)} />
            <Input label={t('gameConfig.authPluginAddress')} value={split.authPluginAddress || ''} onChange={(e) => onChange('authPluginAddress', e.target.value)} />
          </div>
        </div>
      )}
    </div>
  )
}

/** P/Q/R session timing editor (shared by the server-config modal and the template editor). */
export function SessionsEditor({
  sessions,
  game,
  onChange,
}: {
  sessions: Session[]
  game: GamePlatform
  onChange: (sessions: Session[]) => void
}) {
  const { t } = useTranslation()

  const updateSession = (gsId: string, patch: Partial<Session>) =>
    onChange(sessions.map(gs => gs.id === gsId ? { ...gs, ...patch } : gs))

  const handleTypeChange = (gsId: string, newType: SessionType) =>
    onChange(sessions.map(gs => {
      if (gs.id !== gsId) return gs
      if (newType === 'race') return { ...gs, type: newType, durationMinutes: undefined, raceDuration: gs.raceDuration ?? 60, raceDurationType: gs.raceDurationType ?? 'time' }
      return { ...gs, type: newType, raceDuration: undefined, raceDurationType: undefined, durationMinutes: gs.durationMinutes ?? (newType === 'qualifying' ? 15 : 30) }
    }))

  const addSession = () => onChange([...sessions, createDefaultSession('practice')])
  const deleteSession = (gsId: string) => onChange(sessions.filter(gs => gs.id !== gsId))
  const moveSession = (idx: number, dir: -1 | 1) => {
    const arr = [...sessions]
    const target = idx + dir
    if (target < 0 || target >= arr.length) return
    ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
    onChange(arr)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700">{t('gameConfig.gameSessions')}</h4>
        <Button variant="ghost" size="sm" onClick={addSession}>
          <Plus className="w-3.5 h-3.5 mr-1" />{t('gameConfig.addGameSession')}
        </Button>
      </div>
      <div className="space-y-2">
        {sessions.map((gs, idx) => (
          <div key={gs.id} className="flex items-start gap-2 rounded-md border border-gray-200 bg-gray-50 p-2.5">
            <div className="flex flex-col items-center pt-5">
              <button onClick={() => moveSession(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
              <span className="text-xs text-gray-400 py-0.5">{idx + 1}</span>
              <button onClick={() => moveSession(idx, 1)} disabled={idx === sessions.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
              <Select label={t('competition.sessionType')} options={SESSION_TYPE_OPTIONS_T(t)} value={gs.type} onChange={(e) => handleTypeChange(gs.id, e.target.value as SessionType)} />
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
            <button onClick={() => deleteSession(gs.id)} className="mt-6 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {sessions.length === 0 && <p className="text-sm text-gray-400 text-center py-4">{t('gameConfig.noGameSessions')}</p>}
      </div>
    </div>
  )
}
