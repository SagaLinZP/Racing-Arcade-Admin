import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { createDefaultGameConfig, createDefaultSplit, sessionTemplates } from '@/data/competitions'
import type { Session, SessionGameConfig, Split, GamePlatform, SessionType, SessionTemplate } from '@/data/competitions'
import { GameConfigEditor } from './GameConfigEditor'
import { YES_NO, SESSION_TYPE_OPTIONS_T } from './gameConfigOptions'

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

  const handleTypeChange = (newType: SessionType) => {
    setLocal(prev => {
      const next = { ...prev, type: newType }
      if (newType === 'race') {
        if (next.raceDuration == null) { next.raceDuration = 60; next.raceDurationType = 'time' }
        next.durationMinutes = undefined
      } else {
        if (next.durationMinutes == null) next.durationMinutes = 30
        next.raceDuration = undefined
        next.raceDurationType = undefined
      }
      return next
    })
  }

  const handleApplyTemplate = () => {
    const tpl = sessionTemplates.find(t => t.id === selectedTemplateId)
    if (!tpl) return
    setLocal(prev => ({ ...prev, gameConfig: { ...tpl.gameConfig } }))
    setSelectedTemplateId('')
  }

  const handleSaveAsTemplate = () => {
    const now = new Date().toISOString()
    const newTpl: SessionTemplate = {
      id: `tpl_${Date.now()}`,
      name_zh: editLang === 'zh' ? tplName : local.name_zh,
      name_en: editLang === 'en' ? tplName : local.name_en,
      description_zh: editLang === 'zh' ? tplDesc : '',
      description_en: editLang === 'en' ? tplDesc : '',
      game,
      sessionType: local.type,
      gameConfig: { ...local.gameConfig! },
      createdAt: now,
      updatedAt: now,
    }
    sessionTemplates.push(newTpl)
    setTplName('')
    setTplDesc('')
    setShowSaveAsTemplate(false)
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
              <Select
                label={t('competition.sessionType')}
                options={SESSION_TYPE_OPTIONS_T(t)}
                value={local.type}
                onChange={(e) => handleTypeChange(e.target.value as SessionType)}
              />
              <Input label={t('common.from')} type="datetime-local" value={local.startsAt.slice(0, 16)} onChange={(e) => setField('startsAt', e.target.value)} />
              <Input label={t('common.to')} type="datetime-local" value={local.endsAt.slice(0, 16)} onChange={(e) => setField('endsAt', e.target.value)} />
              {local.type !== 'race' ? (
                <Input label={t('gameConfig.durationMinutes')} type="number" value={String(local.durationMinutes ?? '')} onChange={(e) => setField('durationMinutes', Number(e.target.value))} />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Input label={t('gameConfig.raceDuration')} type="number" value={String(local.raceDuration ?? '')} onChange={(e) => setField('raceDuration', Number(e.target.value))} />
                  <Select label={t('gameConfig.raceDurationType')} options={[{ value: 'time', label: t('gameConfig.timeBased') }, { value: 'laps', label: t('gameConfig.lapsBased') }]} value={local.raceDurationType || 'time'} onChange={(e) => setField('raceDurationType', e.target.value as 'time' | 'laps')} />
                </div>
              )}
              <Select label={t('competition.resultType')} options={[{ value: 'classification', label: t('competition.resultTypeClassification') }, { value: 'leaderboard', label: t('competition.resultTypeLeaderboard') }]} value={local.resultType} onChange={(e) => setField('resultType', e.target.value as 'classification' | 'leaderboard')} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'gameConfig' && (
        <div className="space-y-4">
          <div className="flex items-end gap-2 rounded-md bg-gray-50 border border-gray-200 px-3 py-2.5">
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
            <div key={split.id} className="rounded-md border border-gray-200 bg-gray-50 p-4 space-y-3">
              {splitCount > 1 && (
                <div className="flex items-center gap-2">
                  <Badge variant="info">{t('gameConfig.split')} {split.splitNumber}</Badge>
                  {split.resultsPublishedAt && (
                    <Badge variant="success">{t('gameConfig.resultsPublished')}</Badge>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label={t('gameConfig.serverName')} value={split.serverName || ''} onChange={(e) => setSplitField(split.id, 'serverName', e.target.value)} />
                <Input label={t('gameConfig.serverPassword')} value={split.serverPassword || ''} onChange={(e) => setSplitField(split.id, 'serverPassword', e.target.value)} />
                <Input label={t('gameConfig.adminPassword')} value={split.adminPassword || ''} onChange={(e) => setSplitField(split.id, 'adminPassword', e.target.value)} />
                <Input label={t('gameConfig.spectatorPassword')} value={split.spectatorPassword || ''} onChange={(e) => setSplitField(split.id, 'spectatorPassword', e.target.value)} />
                <Input label={t('gameConfig.maxConnections')} type="number" value={String(split.maxConnections ?? 30)} onChange={(e) => setSplitField(split.id, 'maxConnections', Number(e.target.value))} />
                <Select label={t('gameConfig.registerToLobby')} options={YES_NO} value={String(split.registerToLobby ?? true)} onChange={(e) => setSplitField(split.id, 'registerToLobby', e.target.value === 'true')} />
                <Input label={t('gameConfig.joinLink')} value={split.serverJoinLink || ''} onChange={(e) => setSplitField(split.id, 'serverJoinLink', e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
        <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="primary" onClick={handleSave}>{t('common.save')}</Button>
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
            {t('gameConfig.track')}: {gc.track || '—'} · {t('competition.sessionType')}: {t(`competition.sessionType${local.type.charAt(0).toUpperCase() + local.type.slice(1)}`)}
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
