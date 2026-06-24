import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { useManagedOptions } from '@/hooks/useManagedOptions'
import { competitions, updateCompetition, createDefaultRound, createDefaultStage } from '@/data/competitions'
import type { Round, Stage, GamePlatform, Competition } from '@/data/competitions'
import type { Region } from '@/lib/utils'
import { drivers } from '@/data/drivers'
import { teams } from '@/data/teams'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ArrowLeft, Save, Plus, ChevronDown, ChevronRight, Trash2, Settings, AlertTriangle } from 'lucide-react'
import { cn, getCompetitionStatus, getRoundStatus } from '@/lib/utils'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { ServerConfigModal } from './ServerConfigModal'
import { isoToLocalInput, localInputToIso, tzSelectOptions, tzShortLabel } from '@/lib/timezone'
import { canEditIdentity, canEditEligibility, isStageStarted, canEditRegistrationWindow, isServerConfigLocked } from '@/lib/guards'
import { getStageLockAt } from '@/lib/results'

type TabKey = 'info' | 'rounds'

export function CompetitionEditPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const carClassOptions = useManagedOptions('carClass', lang)
  const gameOptions = useManagedOptions('game', lang)
  const regionOptions = useManagedOptions('region', lang)
  const navigate = useNavigate()
  const { id } = useParams()
  const [tab, setTab] = useState<TabKey>('info')
  const [editLang, setEditLang] = useState<'en' | 'zh'>('en')
  const [expandedRoundId, setExpandedRoundId] = useState<string | null>(null)
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null)

  const foundComp = useMemo(() => competitions.find(c => c.id === id), [id])
  const [localComp, setLocalComp] = useState<Competition | null>(null)

  if (!foundComp) return <div className="text-center py-12 text-gray-500">Competition not found</div>
  const comp = localComp ?? foundComp
  const identityLocked = !canEditIdentity(comp)

  const setLocal = (updater: (prev: Competition) => Competition) => {
    setLocalComp(prev => updater(prev ?? foundComp))
  }

  const addRound = () => {
    const round = createDefaultRound(comp.id)
    setLocal(prev => ({ ...prev, rounds: [...prev.rounds, round] }))
    setExpandedRoundId(round.id)
  }

  const updateRound = (roundId: string, patch: Partial<Round>) => {
    setLocal(prev => ({ ...prev, rounds: prev.rounds.map(r => r.id === roundId ? { ...r, ...patch } : r) }))
  }

  const deleteRound = (roundId: string) => {
    setLocal(prev => ({ ...prev, rounds: prev.rounds.filter(r => r.id !== roundId) }))
  }

  const addStage = (roundId: string) => {
    const stage = createDefaultStage(roundId)
    setLocal(prev => ({ ...prev, rounds: prev.rounds.map(r => r.id === roundId ? { ...r, stages: [...r.stages, stage] } : r) }))
    setExpandedStageId(stage.id)
  }

  const updateStage = (roundId: string, stageId: string, updated: Stage) => {
    setLocal(prev => ({ ...prev, rounds: prev.rounds.map(r => r.id === roundId ? { ...r, stages: r.stages.map(s => s.id === stageId ? updated : s) } : r) }))
  }

  const deleteStage = (roundId: string, stageId: string) => {
    setLocal(prev => ({ ...prev, rounds: prev.rounds.map(r => r.id === roundId ? { ...r, stages: r.stages.filter(s => s.id !== stageId) } : r) }))
  }

  const LOCK_BUFFER_MS = 10 * 60 * 1000
  const hasLockDeadlineError = (localComp ?? comp).rounds.some(round =>
    round.stages.some((stage, i) => {
      if (i === 0) return false
      const prevLock = getStageLockAt(round.stages[i - 1], localComp ?? comp)
      return prevLock > new Date(stage.startsAt).getTime() - LOCK_BUFFER_MS
    })
  )

  const handleSave = () => {
    if (hasLockDeadlineError) return
    if (localComp) {
      updateCompetition({ ...localComp, updatedAt: new Date().toISOString() })
    }
    navigate('/competitions')
  }

  const status = getCompetitionStatus(comp)
  const getName = (e: { name_zh: string; name_en: string }) => lang === 'zh' ? e.name_zh : e.name_en

  const tabs: Array<{ key: TabKey; label: string; count?: number }> = [
    { key: 'info', label: t('competition.tabInfo') },
    { key: 'rounds', label: t('competition.tabRounds'), count: comp.rounds.length },
  ]

  return (
    <>
      <div className="sticky top-0 z-10 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 pt-5 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/competitions')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('competition.editCompetition')}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={status} label={t(`event.status.${status}`)} />
                  <span className="text-sm text-gray-500">{getName(comp)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{t('common.language')}:</span>
                <button
                  className={cn('px-2.5 py-1 text-xs rounded', editLang === 'en' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                  onClick={() => setEditLang('en')}
                >EN</button>
                <button
                  className={cn('px-2.5 py-1 text-xs rounded', editLang === 'zh' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                  onClick={() => setEditLang('zh')}
                >中文</button>
              </div>
              <div className="w-px h-6 bg-gray-200" />
              <Button variant="secondary" onClick={handleSave} disabled={hasLockDeadlineError}>
                <Save className="w-4 h-4 mr-1" />{t('common.save')}
              </Button>
            </div>
          </div>

          <div className="flex gap-6">
            {tabs.map(tb => (
              <button
                key={tb.key}
                className={cn(
                  'pb-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                  tab === tb.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                )}
                onClick={() => setTab(tb.key)}
              >
                {tb.label}
                {tb.count !== undefined && (
                  <span className={cn('ml-1.5 text-xs', tab === tb.key ? 'text-blue-500' : 'text-gray-400')}>
                    ({tb.count})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'info' && (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          {identityLocked && (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-700">
              {t('event.identityLockedHint')}
            </div>
          )}
          <Card>
            <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionBasicInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label={`${t('competition.competitionName')} (${editLang === 'en' ? 'EN' : '中文'})`} value={editLang === 'en' ? comp.name_en : comp.name_zh} onChange={(e) => setLocal(prev => ({ ...prev, ...(editLang === 'en' ? { name_en: e.target.value } : { name_zh: e.target.value }) }))} />
              <Select label={t('event.game')} options={gameOptions} value={comp.game} locked={identityLocked} onChange={(e) => setLocal(prev => ({ ...prev, game: e.target.value as GamePlatform }))} />
              <Select label={t('event.carClass')} options={carClassOptions.length > 0 ? carClassOptions : [{ value: '', label: '' }]} value={comp.carClass} locked={identityLocked} onChange={(e) => setLocal(prev => ({ ...prev, carClass: e.target.value }))} />
              <Select label={t('event.timezone')} options={tzSelectOptions(lang)} value={comp.timezone ?? 'UTC+8'} onChange={(e) => setLocal(prev => ({ ...prev, timezone: e.target.value }))} />
              <Input label={t('event.resultLockWindow')} type="number" min={0} disabled={identityLocked} value={String(comp.resultLockWindowHours ?? 24)} onChange={(e) => setLocal(prev => ({ ...prev, resultLockWindowHours: e.target.value ? Number(e.target.value) : undefined }))} />
              <Input label={t('event.minSplitEntries')} type="number" min={1} disabled={identityLocked} value={String(comp.minSplitEntries ?? 10)} onChange={(e) => setLocal(prev => ({ ...prev, minSplitEntries: e.target.value ? Number(e.target.value) : undefined }))} />
              <Input label={t('event.carList')} placeholder={t('event.carListPlaceholder')} disabled={identityLocked} value={comp.carList?.join(', ') || ''} onChange={(e) => setLocal(prev => ({ ...prev, carList: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} />
              <Input label={t('event.streamUrl')} value={comp.defaultRuleset.streamUrl || ''} onChange={(e) => setLocal(prev => ({ ...prev, defaultRuleset: { ...prev.defaultRuleset, streamUrl: e.target.value } }))} />
              <div className="md:col-span-2 max-w-sm">
                <ImageUpload label={t('event.coverImage')} value={comp.coverImage || ''} onChange={(v) => setLocal(prev => ({ ...prev, coverImage: v }))} />
              </div>
              <div className="md:col-span-2">
                <Textarea label={`${t('common.description')} (${editLang === 'en' ? 'EN' : '中文'})`} value={editLang === 'en' ? comp.description_en : comp.description_zh} onChange={(e) => setLocal(prev => ({ ...prev, ...(editLang === 'en' ? { description_en: e.target.value } : { description_zh: e.target.value }) }))} />
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('common.regions')}</h3>
            <div className="flex flex-wrap gap-6">
              {regionOptions.map(opt => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={identityLocked}
                    checked={comp.regions.includes(opt.value as Region)}
                    onChange={() => setLocal(prev => ({ ...prev, regions: prev.regions.includes(opt.value as Region) ? prev.regions.filter(r => r !== opt.value) : [...prev.regions, opt.value as Region] }))}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionRules')}</h3>
            <div className="space-y-4">
              <Textarea label={`${t('event.accessRequirements')} (${editLang === 'en' ? 'EN' : '中文'})`} disabled={identityLocked} value={editLang === 'en' ? comp.defaultRuleset.accessRequirements_en || '' : comp.defaultRuleset.accessRequirements_zh || ''} onChange={(e) => setLocal(prev => ({ ...prev, defaultRuleset: { ...prev.defaultRuleset, ...(editLang === 'en' ? { accessRequirements_en: e.target.value } : { accessRequirements_zh: e.target.value }) } }))} />
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionScoringTable')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-3 font-medium w-24">{t('event.position')}</th>
                    <th className="py-2 pr-3 font-medium w-24">{t('event.points')}</th>
                    <th className="py-2 pr-3 font-medium">{t('event.note')} ({editLang === 'en' ? 'EN' : '中文'})</th>
                    <th className="py-2 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {(comp.defaultRuleset.scoringTable || []).map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-2 pr-3">
                        <input type="number" className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" value={row.position} readOnly />
                      </td>
                      <td className="py-2 pr-3">
                        <input type="number" disabled={identityLocked} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-50" value={row.points} onChange={(e) => setLocal(prev => ({ ...prev, defaultRuleset: { ...prev.defaultRuleset, scoringTable: (prev.defaultRuleset.scoringTable || []).map((r, i) => i === idx ? { ...r, points: Number(e.target.value) } : r) } }))} />
                      </td>
                      <td className="py-2 pr-3">
                        <input type="text" disabled={identityLocked} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-50" value={editLang === 'en' ? (row.note_en || '') : (row.note_zh || '')} onChange={(e) => setLocal(prev => ({ ...prev, defaultRuleset: { ...prev.defaultRuleset, scoringTable: (prev.defaultRuleset.scoringTable || []).map((r, i) => i === idx ? { ...r, ...(editLang === 'en' ? { note_en: e.target.value } : { note_zh: e.target.value }) } : r) } }))} />
                      </td>
                      <td className="py-2">
                        <button disabled={identityLocked} className="text-red-500 hover:text-red-700 disabled:opacity-30" onClick={() => setLocal(prev => ({ ...prev, defaultRuleset: { ...prev.defaultRuleset, scoringTable: (prev.defaultRuleset.scoringTable || []).filter((_, i) => i !== idx).map((r, i) => ({ ...r, position: i + 1 })) } }))}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!comp.defaultRuleset.scoringTable || comp.defaultRuleset.scoringTable.length === 0) && (
                    <tr><td colSpan={4} className="py-4 text-center text-gray-400">{t('common.noData')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Textarea
                label={`${t('event.scoringNote')} (${editLang === 'en' ? 'EN' : '中文'})`}
                disabled={identityLocked}
                value={editLang === 'en' ? comp.defaultRuleset.scoringNote_en || '' : comp.defaultRuleset.scoringNote_zh || ''}
                onChange={(e) => setLocal(prev => ({ ...prev, defaultRuleset: { ...prev.defaultRuleset, ...(editLang === 'en' ? { scoringNote_en: e.target.value } : { scoringNote_zh: e.target.value }) } }))}
              />
            </div>
            <div className="mt-3">
              <Button variant="secondary" size="sm" disabled={identityLocked} onClick={() => setLocal(prev => ({ ...prev, defaultRuleset: { ...prev.defaultRuleset, scoringTable: [...(prev.defaultRuleset.scoringTable || []), { position: (prev.defaultRuleset.scoringTable?.length || 0) + 1, points: 0, note_en: '', note_zh: '' }] } }))}>
                <Plus className="w-4 h-4 mr-1" />
                {t('event.addRow')}
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.resources')}</h3>
            <Textarea label={`Resources (${editLang === 'en' ? 'EN' : '中文'})`} value={editLang === 'en' ? comp.defaultRuleset.resources_en || '' : comp.defaultRuleset.resources_zh || ''} onChange={(e) => setLocal(prev => ({ ...prev, defaultRuleset: { ...prev.defaultRuleset, ...(editLang === 'en' ? { resources_en: e.target.value } : { resources_zh: e.target.value }) } }))} />
          </Card>
        </div>
      )}

      {tab === 'rounds' && (
        <div className="max-w-5xl mx-auto p-6 space-y-4">
          {comp.rounds.length === 0 && (
            <Card>
              <div className="text-center py-8">
                <p className="text-sm text-gray-400 mb-3">{t('competition.noRounds')}</p>
                <Button variant="secondary" size="sm" onClick={addRound}>
                  <Plus className="w-4 h-4 mr-1" />
                  {t('competition.addRound')}
                </Button>
              </div>
            </Card>
          )}

          {comp.rounds.map((round, roundIdx) => (
            <RoundAccordion
              key={round.id}
              round={round}
              comp={comp}
              roundIdx={roundIdx}
              isExpanded={expandedRoundId === round.id}
              expandedStageId={expandedStageId}
              onToggleRound={() => setExpandedRoundId(expandedRoundId === round.id ? null : round.id)}
              onToggleStage={(stageId) => setExpandedStageId(expandedStageId === stageId ? null : stageId)}
              editLang={editLang}
              game={comp.game}
              timezone={comp.timezone}
              onUpdate={(patch) => updateRound(round.id, patch)}
              onDelete={() => deleteRound(round.id)}
              onAddStage={() => addStage(round.id)}
              onDeleteStage={(stageId) => deleteStage(round.id, stageId)}
              onUpdateStage={(stageId, updated) => updateStage(round.id, stageId, updated)}
            />
          ))}

          {comp.rounds.length > 0 && (
            <Button variant="secondary" size="sm" onClick={addRound}>
              <Plus className="w-4 h-4 mr-1" />
              {t('competition.addRound')}
            </Button>
          )}
        </div>
      )}
    </>
  )
}

function RoundAccordion({
  round,
  comp,
  roundIdx,
  isExpanded,
  expandedStageId,
  onToggleRound,
  onToggleStage,
  editLang,
  game,
  timezone,
  onUpdate,
  onDelete,
  onAddStage,
  onDeleteStage,
  onUpdateStage,
}: {
  round: Round
  comp: Competition
  roundIdx: number
  isExpanded: boolean
  expandedStageId: string | null
  onToggleRound: () => void
  onToggleStage: (stageId: string) => void
  editLang: 'en' | 'zh'
  game: GamePlatform
  timezone?: string
  onUpdate: (patch: Partial<Round>) => void
  onDelete: () => void
  onAddStage: () => void
  onDeleteStage: (stageId: string) => void
  onUpdateStage: (stageId: string, updated: Stage) => void
}) {
  const { t } = useTranslation()
  const lang = useApp().state.language
  const getName = (e: { name_zh: string; name_en: string }) => lang === 'zh' ? e.name_zh : e.name_en
  const tzShort = tzShortLabel(timezone)
  const regWindowLocked = !canEditRegistrationWindow(round)

  return (
    <Card padding={false}>
      <div
        className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50 cursor-pointer border-b"
        onClick={onToggleRound}
      >
        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
        <span className="text-sm font-medium text-gray-400 w-8 shrink-0">#{roundIdx + 1}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 truncate">
              {getName(round)}
            </span>
            <StatusBadge status={getRoundStatus(round, comp)} label={t(`event.status.${getRoundStatus(round, comp)}`)} />
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {round.track || 'No track'}
            {' · '}
            {round.stages.length} {t('competition.stages')}
            {' · '}
            {round.currentRegistrations} {t('competition.registrations')}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete() }}>
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>

      {isExpanded && (
        <div className="px-6 pb-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4" key={editLang}>
            <Input label={`${t('competition.roundName')} (${editLang === 'en' ? 'EN' : '中文'})`} defaultValue={editLang === 'en' ? round.name_en : round.name_zh} onChange={(e) => onUpdate(editLang === 'en' ? { name_en: e.target.value } : { name_zh: e.target.value })} />
            <Input label={t('event.track')} defaultValue={round.track || ''} onChange={(e) => onUpdate({ track: e.target.value })} />
            <Input label={`${t('event.registrationOpenAt')} (${tzShort})`} type="datetime-local" disabled={regWindowLocked} defaultValue={isoToLocalInput(round.registrationOpenAt, timezone)} onChange={(e) => onUpdate({ registrationOpenAt: e.target.value ? localInputToIso(e.target.value, timezone) : round.registrationOpenAt })} />
            <Input label={`${t('event.registrationCloseAt')} (${tzShort})`} type="datetime-local" disabled={regWindowLocked} defaultValue={isoToLocalInput(round.registrationCloseAt, timezone)} onChange={(e) => onUpdate({ registrationCloseAt: e.target.value ? localInputToIso(e.target.value, timezone) : round.registrationCloseAt })} />
            <Input label={`${t('event.cancelRegistrationDeadline')} (${tzShort})`} type="datetime-local" disabled={regWindowLocked} defaultValue={isoToLocalInput(round.cancelRegistrationDeadline, timezone)} onChange={(e) => onUpdate({ cancelRegistrationDeadline: e.target.value ? localInputToIso(e.target.value, timezone) : undefined })} />
            <Input label={t('event.maxRegistrations')} type="number" min={round.currentRegistrations || 0} disabled={regWindowLocked} defaultValue={round.maxRegistrations ?? ''} onChange={(e) => onUpdate({ maxRegistrations: e.target.value ? Math.max(round.currentRegistrations || 0, Number(e.target.value)) : undefined })} />
          </div>
          {regWindowLocked && <p className="text-xs text-gray-400 -mt-1">{t('event.registrationWindowLockedHint')}</p>}

          <div className="max-w-sm">
            <ImageUpload label={t('event.coverImage')} defaultValue={round.coverImage || ''} aspectRatio="video" onChange={(v) => onUpdate({ coverImage: v })} />
          </div>

          <Textarea label={`${t('common.description')} (${editLang === 'en' ? 'EN' : '中文'})`} defaultValue={editLang === 'en' ? round.description_en || '' : round.description_zh || ''} onChange={(e) => onUpdate(editLang === 'en' ? { description_en: e.target.value } : { description_zh: e.target.value })} />

          {round.cancelledReason_zh && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {editLang === 'en' ? round.cancelledReason_en : round.cancelledReason_zh}
            </div>
          )}

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">{t('competition.stages')} ({round.stages.length})</h4>
              <Button variant="ghost" size="sm" onClick={onAddStage}>
                <Plus className="w-4 h-4 mr-1" />
                {t('competition.addStage')}
              </Button>
            </div>

            {round.stages.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">{t('competition.noStages')}</p>
            )}

            <div className="space-y-2">
              {round.stages.map((stage, stageIdx) => {
                const prevLockMs = stageIdx > 0 ? getStageLockAt(round.stages[stageIdx - 1], comp) : undefined
                return (
                <StageAccordion
                  key={stage.id}
                  stage={stage}
                  stageIdx={stageIdx}
                  isExpanded={expandedStageId === stage.id}
                  onToggle={() => onToggleStage(stage.id)}
                  editLang={editLang}
                  registeredDriverIds={round.registeredDriverIds}
                  game={game}
                  timezone={timezone}
                  lockWindowHours={comp.resultLockWindowHours ?? 24}
                  eligibilityLocked={!canEditEligibility(round)}
                  prevStageLockMs={prevLockMs}
                  onUpdate={(updated) => onUpdateStage(stage.id, updated)}
                  onDelete={() => onDeleteStage(stage.id)}
                />
                )
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

function StageAccordion({
  stage,
  stageIdx,
  isExpanded,
  onToggle,
  editLang,
  registeredDriverIds,
  game,
  timezone,
  lockWindowHours,
  eligibilityLocked,
  prevStageLockMs,
  onUpdate,
  onDelete,
}: {
  stage: Stage
  stageIdx: number
  isExpanded: boolean
  onToggle: () => void
  editLang: 'en' | 'zh'
  registeredDriverIds: string[]
  game: GamePlatform
  timezone?: string
  lockWindowHours: number
  eligibilityLocked?: boolean
  prevStageLockMs?: number
  onUpdate: (updated: Stage) => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const lang = useApp().state.language
  const tzShort = tzShortLabel(timezone)
  const startLocked = isStageStarted(stage)
  const serverConfigLocked = isServerConfigLocked(stage)
  const lockAtIso = stage.resultsLockAt ?? new Date(new Date(stage.endsAt).getTime() + lockWindowHours * 3_600_000).toISOString()
  const splitRuleOptions = useManagedOptions('splitRule', lang)
  const eligibilityOptions = useManagedOptions('eligibilitySource', lang)
  const getName = (e: { name_zh: string; name_en: string }) => lang === 'zh' ? e.name_zh : e.name_en
  const isFirstStage = stageIdx === 0
  const effectiveEligibilityLocked = eligibilityLocked || isFirstStage
  const [eligibility, setEligibility] = useState(isFirstStage ? 'roundRegistration' : (stage.eligibilitySource || 'roundRegistration'))
  const [advMetric, setAdvMetric] = useState(stage.advancementRule?.metric || 'lapTime')
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set())
  const [showServerConfig, setShowServerConfig] = useState(false)

  const STAGE_LOCK_BUFFER_MS = 10 * 60 * 1000
  const lockDeadlineError = prevStageLockMs != null
    ? prevStageLockMs > new Date(stage.startsAt).getTime() - STAGE_LOCK_BUFFER_MS
    : false

  const splitCount = Math.max(1, stage.splits.length)

  const handleSaveStage = (updated: Stage) => {
    onUpdate(updated)
  }

  const registeredDrivers = registeredDriverIds
    .map(id => drivers.find(d => d.id === id))
    .filter((d): d is NonNullable<typeof d> => d !== undefined)
    .map(d => ({
      id: d.id,
      nickname: d.nickname,
      country: d.country,
      teamId: d.teamId,
      teamName: d.teamId ? teams.find(t => t.id === d.teamId)?.name : undefined,
    }))

  const toggleDriver = (id: string) => {
    setSelectedDrivers(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer bg-gray-50/50"
        onClick={onToggle}
      >
        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
        <span className="text-xs font-medium text-gray-400 w-6 shrink-0">S{stageIdx + 1}</span>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-900">{getName(stage)}</span>
        </div>
        <span className="text-xs text-gray-400">{stage.sessions.length} {t('competition.sessions')}</span>
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete() }}>
          <Trash2 className="w-3.5 h-3.5 text-red-500" />
        </Button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
            <Input label={`${t('competition.stageName')} (${editLang === 'en' ? 'EN' : '中文'})`} value={editLang === 'en' ? stage.name_en : stage.name_zh} onChange={(e) => onUpdate({ ...stage, ...(editLang === 'en' ? { name_en: e.target.value } : { name_zh: e.target.value }) })} />
            <Input label={`${t('common.from')} (${tzShort})`} type="datetime-local" disabled={startLocked} value={isoToLocalInput(stage.startsAt, timezone)} onChange={(e) => onUpdate({ ...stage, startsAt: e.target.value ? localInputToIso(e.target.value, timezone) : stage.startsAt })} />
            <Input label={`${t('common.to')} (${tzShort})`} type="datetime-local" value={isoToLocalInput(stage.endsAt, timezone)} onChange={(e) => onUpdate({ ...stage, endsAt: e.target.value ? localInputToIso(e.target.value, timezone) : stage.endsAt })} />
            <div>
              <Input label={`${t('event.resultsLockAt')} (${tzShort})`} type="datetime-local" value={isoToLocalInput(lockAtIso, timezone)} onChange={(e) => onUpdate({ ...stage, resultsLockAt: e.target.value ? localInputToIso(e.target.value, timezone) : undefined })} />
              <p className="text-xs text-gray-500 mt-1">{t('event.resultsLockAtHint', { hours: lockWindowHours })}</p>
            </div>
          </div>

          {lockDeadlineError && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{t('competition.lockDeadlineError')}</span>
            </div>
          )}

          <Textarea label={`${t('common.description')} (${editLang === 'en' ? 'EN' : '中文'})`} value={editLang === 'en' ? stage.description_en || '' : stage.description_zh || ''} onChange={(e) => onUpdate({ ...stage, ...(editLang === 'en' ? { description_en: e.target.value } : { description_zh: e.target.value }) })} />

          <div className="space-y-3">
            <Select
              label={t('competition.eligibilitySource')}
              options={eligibilityOptions}
              value={eligibility}
              locked={effectiveEligibilityLocked}
              onChange={(e) => { setEligibility(e.target.value as typeof eligibility); onUpdate({ ...stage, eligibilitySource: e.target.value as Stage['eligibilitySource'] }) }}
            />

            {isFirstStage && (
              <p className="text-xs text-gray-500 pl-3 border-l-2 border-gray-200 pl-3 py-1">
                {t('competition.firstStageInheritHint')}
              </p>
            )}

            {eligibility === 'previousStageResult' && (
              <div className="space-y-3 pl-1 border-l-2 border-blue-200 pl-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Select
                    label={t('competition.advancementMetric')}
                    options={[
                      { value: 'lapTime', label: t('competition.advancementMetricLapTime') },
                      { value: 'position', label: t('competition.advancementMetricPosition') },
                    ]}
                    value={advMetric}
                    locked={effectiveEligibilityLocked}
                    onChange={(e) => { const m = e.target.value as 'lapTime' | 'position'; setAdvMetric(m); onUpdate({ ...stage, advancementRule: { ...(stage.advancementRule ?? { metric: m }), metric: m } }) }}
                  />
                  {advMetric === 'lapTime' ? (
                    <Input
                      label={t('competition.advancementLapTimeMultiplier')}
                      type="number"
                      step="0.01"
                      min="1"
                      disabled={eligibilityLocked}
                      value={String(stage.advancementRule?.lapTimeMultiplier ?? 1.05)}
                      onChange={(e) => onUpdate({ ...stage, advancementRule: { ...(stage.advancementRule ?? { metric: 'lapTime' }), metric: 'lapTime', lapTimeMultiplier: Number(e.target.value) } })}
                    />
                  ) : (
                    <Input label={t('competition.advancementLimit')} type="number" disabled={eligibilityLocked} value={String(stage.advancementRule?.limit ?? '')} onChange={(e) => onUpdate({ ...stage, advancementRule: { ...(stage.advancementRule ?? { metric: advMetric }), metric: advMetric, limit: Number(e.target.value) } })} />
                  )}
                </div>
                {advMetric === 'lapTime' && (
                  <p className="text-xs text-gray-500">{t('competition.advancementLapTimeMultiplierHint')}</p>
                )}
              </div>
            )}

            {eligibility === 'roundRegistration' && (
              <p className="text-xs text-gray-500 pl-3 border-l-2 border-gray-200 pl-3 py-1">
                {t('competition.eligibilityRoundRegistrationHint')}
              </p>
            )}

            {eligibility === 'manualInvite' && (
              <div className="border-l-2 border-blue-200 pl-3 space-y-2">
                <p className="text-xs text-gray-500">{t('competition.manualInviteHint')}</p>
                {registeredDrivers.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto rounded border border-gray-200 divide-y">
                    {registeredDrivers.map(d => (
                      <label key={d!.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={selectedDrivers.has(d!.id)}
                          onChange={() => toggleDriver(d!.id)}
                        />
                        <span className="text-sm text-gray-700">{d!.nickname}</span>
                        <span className="text-xs text-gray-400">{d!.country}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">{t('competition.noRegisteredDrivers')}</p>
                )}
                {selectedDrivers.size > 0 && (
                  <p className="text-xs text-blue-600">{selectedDrivers.size} {t('competition.driversSelected')}</p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={stage.awardsPoints !== false} onChange={(e) => onUpdate({ ...stage, awardsPoints: e.target.checked })} className="rounded border-gray-300" />
              <span className="text-sm text-gray-700">{t('competition.awardsPoints')}</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 pl-6">{t('competition.awardsPointsHint')}</p>
          </div>

          <div className="rounded-md bg-gray-50 border border-gray-200 p-3 space-y-3">
            <h5 className="text-xs font-medium text-gray-600">{t('event.sectionSplitConfig')}</h5>
            <p className="text-xs text-gray-500">{t('competition.splitDecidedAfterReg')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select label={t('event.splitAssignmentRule')} options={splitRuleOptions} value={stage.splitAssignmentRule || ''} onChange={(e) => onUpdate({ ...stage, splitAssignmentRule: e.target.value })} />
            </div>
          </div>

          {/* Server Config button */}
          <div className={cn('rounded-md border border-gray-200 bg-white p-3 transition-colors', serverConfigLocked ? 'opacity-70' : 'hover:bg-gray-50 hover:border-gray-300')}>
            <button
              onClick={() => { if (!serverConfigLocked) setShowServerConfig(true) }}
              disabled={serverConfigLocked}
              className={cn('flex items-center justify-between w-full', serverConfigLocked ? 'cursor-not-allowed' : 'cursor-pointer')}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{t('serverConfig.title')}</span>
              </div>
              <span className="text-xs text-gray-400">{serverConfigLocked ? t('event.serverConfigLocked') : <span className="text-blue-600 hover:text-blue-700">{t('common.edit')}</span>}</span>
            </button>
          </div>
        </div>
      )}

      {showServerConfig && (
        <ServerConfigModal
          isOpen={true}
          onClose={() => setShowServerConfig(false)}
          onSave={handleSaveStage}
          stage={stage}
          editLang={editLang}
          game={game}
          splitCount={splitCount}
          registeredDrivers={registeredDrivers}
        />
      )}
    </div>
  )
}
