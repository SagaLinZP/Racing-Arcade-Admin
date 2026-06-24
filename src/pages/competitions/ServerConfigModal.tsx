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
  stageTemplates,
} from '@/data/competitions'
import type {
  Stage,
  SessionGameConfig,
  Split,
  GamePlatform,
  StageTemplate,
  BopEntry,
} from '@/data/competitions'
import { GameConfigEditor } from './GameConfigEditor'
import { SplitServerFields, SessionsEditor } from './serverFields'
import { startServer, stopServer, getServerInstance } from '@/data/servers'
import { useDataVersion } from '@/data/store'
import {
  Plus, Trash2, ChevronDown, ChevronRight, Power, Square, Settings, Info,
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
  useDataVersion()
  const [activeTab, setActiveTab] = useState<TabKey>('splits')
  const [local, setLocal] = useState<Stage>(() => {
    const base: Stage = { ...stage }
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
  const [bopExpanded, setBopExpanded] = useState(false)
  const [confirmApply, setConfirmApply] = useState(false)

  const gc = local.gameConfig

  const initGameConfig = () =>
    setLocal(prev => ({ ...prev, gameConfig: prev.gameConfig ?? createDefaultGameConfig(game) }))

  const setGC = (key: keyof SessionGameConfig, value: string | number | boolean) =>
    setLocal(prev => ({
      ...prev,
      gameConfig: { ...(prev.gameConfig ?? createDefaultGameConfig(game)), [key]: value },
    }))

  const setSplitField = (splitId: string, key: keyof Split, value: string | number | boolean) =>
    setLocal(prev => ({
      ...prev,
      splits: prev.splits.map(s => s.id === splitId ? { ...s, [key]: value } : s),
    }))

  const addBopEntry = () => {
    const entry: BopEntry = { track: gc?.track || '', carModel: 0, ballastKg: 0 }
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

  const handleApplyTemplate = () => {
    if (!selectedTemplateId) return
    if (local.gameConfig || local.sessions.length > 0) {
      setConfirmApply(true)
      return
    }
    performApply()
  }

  const performApply = () => {
    const tpl = stageTemplates.find(t => t.id === selectedTemplateId)
    if (!tpl) return
    setLocal(prev => ({
      ...prev,
      gameConfig: { ...tpl.gameConfig },
      sessions: tpl.sessions.length > 0
        ? tpl.sessions.map(s => ({ ...s }))
        : [
            createDefaultSession('practice'),
            createDefaultSession('qualifying'),
            createDefaultSession('race'),
          ],
      splits: tpl.splitConfig
        ? prev.splits.map(s => ({ ...s, ...tpl.splitConfig }))
        : prev.splits,
    }))
    setConfirmApply(false)
  }

  const handleSaveAsTemplate = () => {
    const now = new Date().toISOString()
    const newTpl: StageTemplate = {
      id: `tpl_${Date.now()}`,
      name_zh: editLang === 'zh' ? tplName : local.name_zh,
      name_en: editLang === 'en' ? tplName : local.name_en,
      game,
      gameConfig: { ...(local.gameConfig ?? createDefaultGameConfig(game)) },
      sessions: local.sessions.map(s => ({ ...s })),
      splitConfig: local.splits[0]
        ? Object.fromEntries(
            Object.entries(local.splits[0]).filter(([k]) =>
              !['id', 'splitNumber', 'results', 'resultsLockedAt'].includes(k),
            ),
          )
        : undefined,
      createdAt: now,
      updatedAt: now,
    }
    stageTemplates.push(newTpl)
    setTplName('')
    setShowSaveAsTemplate(false)
  }

  const handleSave = () => { onSave(local); onClose() }

  const compatibleTemplates = stageTemplates.filter(tpl => tpl.game === game)

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
            options={[
              { value: '', label: t('template.selectPlaceholder') },
              ...compatibleTemplates.map(tpl => ({
                value: tpl.id,
                label: editLang === 'en' ? tpl.name_en : tpl.name_zh,
              })),
            ]}
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
          />
        </div>
        <Button variant="secondary" size="sm" onClick={handleApplyTemplate} disabled={!selectedTemplateId}>
          {t('template.apply')}
        </Button>
        <div className="w-px h-8 bg-gray-300 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSaveAsTemplate(true)}
          disabled={!local.gameConfig && local.sessions.length === 0}
        >
          {t('template.saveAsTemplate')}
        </Button>
      </div>

      {/* Empty stage guidance */}
      {!local.gameConfig && local.sessions.length === 0 && (
        <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-3 mb-4 text-sm text-blue-700">
          {t('gameConfig.emptyStageHint')}
        </div>
      )}

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
          {gc ? (
            <GameConfigEditor gameConfig={gc} game={game} onChange={setGC} />
          ) : (
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
              <Settings className="w-6 h-6 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3">{t('gameConfig.configEmptyHint')}</p>
              <Button variant="secondary" size="sm" onClick={initGameConfig}>
                {t('gameConfig.configureManually')}
              </Button>
            </div>
          )}

          {/* BOP (ACC only) */}
          {gc && game === 'ACC' && (
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
        <SessionsEditor
          sessions={local.sessions}
          game={game}
          editLang={editLang}
          onChange={(sessions) => setLocal(prev => ({ ...prev, sessions }))}
        />
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
              <ServerStatusBar stageId={local.id} split={split} gameConfig={local.gameConfig} t={t} />
              {splitCount > 1 && (
                <div className="flex items-center gap-2">
                  <Badge variant="info">{t('gameConfig.split')} {split.splitNumber}</Badge>
                </div>
              )}
              <SplitServerFields split={split} game={game} onChange={(k, v) => setSplitField(split.id, k, v)} />
              <EntryListEditor
                split={split}
                game={game}
                editLang={editLang}
                t={t}
              />
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-200">
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
      {confirmApply && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={() => setConfirmApply(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-900">{t('template.confirmApplyTitle')}</h3>
            <p className="text-sm text-gray-600">{t('template.confirmApplyBody')}</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setConfirmApply(false)}>{t('common.cancel')}</Button>
              <Button variant="primary" size="sm" onClick={performApply}>{t('template.replace')}</Button>
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
}: {
  split: Split
  game: GamePlatform
  editLang: 'en' | 'zh'
  t: (key: string, opts?: Record<string, unknown>) => string
}) {
  const [expanded, setExpanded] = useState(false)
  const entries = split.entryList ?? []

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
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
      </div>
      {expanded && (
        <div className="p-3">
          <div className="flex items-start gap-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2 mb-3 text-xs text-blue-700">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{t('serverConfig.entryListEditInRegistration')}</span>
          </div>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5 text-sm text-gray-600">#{entry.raceNumber}</td>
                      <td className="px-2 py-1.5 text-sm font-medium text-gray-900">{entry.driverName || '—'}</td>
                      <td className="px-2 py-1.5 text-sm text-gray-500">{entry.teamName || '—'}</td>
                      <td className="px-2 py-1.5 text-sm font-mono text-gray-500">{entry.carModel || '—'}</td>
                      <td className="px-2 py-1.5 text-sm text-gray-500">{entry.ballastKg ?? 0}</td>
                      <td className="px-2 py-1.5 text-sm text-gray-500">{entry.restrictor ?? 0}</td>
                      <td className="px-2 py-1.5 text-center text-sm">{entry.isServerAdmin ? '✓' : '—'}</td>
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
    </div>
  )
}

function ServerStatusBar({ stageId, split, gameConfig, t }: {
  stageId: string
  split: Split
  gameConfig?: SessionGameConfig
  t: (key: string, opts?: Record<string, unknown>) => string
}) {
  const inst = getServerInstance(split.id)
  const running = inst?.status === 'running'
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-md bg-white border border-gray-200 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full', running ? 'bg-green-500' : 'bg-gray-400')} />
          <span className="text-xs font-medium text-gray-700">{running ? t('gameConfig.serverRunning') : t('gameConfig.serverStopped')}</span>
          {running && <span className="text-xs text-gray-400">· {inst?.onlineCount ?? 0} {t('gameConfig.online')}</span>}
        </div>
        {running
          ? <Button variant="ghost" size="sm" onClick={() => stopServer(split.id)}><Square className="w-3.5 h-3.5 mr-1" />{t('gameConfig.serverStop')}</Button>
          : <Button variant="ghost" size="sm" onClick={() => startServer(stageId, split, gameConfig)}><Power className="w-3.5 h-3.5 mr-1" />{t('gameConfig.startServer')}</Button>}
      </div>
      {inst && inst.logs.length > 0 && (
        <div className="rounded-md bg-gray-900 text-gray-100 text-xs font-mono p-2 max-h-24 overflow-y-auto space-y-0.5">
          {inst.logs.map((l, i) => <div key={i}>{l.message}</div>)}
        </div>
      )}
    </div>
  )
}
