import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { ArrowLeft, Save, Plus, Trash2, ChevronDown, ChevronRight, Settings, AlertCircle } from 'lucide-react'
import { cn, getCompetitionStatus } from '@/lib/utils'
import { scrollToTop } from '@/lib/scrollContainer'
import { useManagedOptions } from '@/hooks/useManagedOptions'
import { useApp } from '@/hooks/useAppStore'
import {
  addCompetition,
  createDefaultRound,
  createDefaultStage,
  createDefaultGameConfig,
} from '@/data/competitions'
import type { Competition, Round, Stage, GamePlatform, CompetitionStatus } from '@/data/competitions'
import type { ScoringTableEntry, Region } from '@/lib/utils'
import { ServerConfigModal } from './ServerConfigModal'

interface FormState {
  name_en: string
  name_zh: string
  description_en: string
  description_zh: string
  game: string
  carClass: string
  carList: string
  regions: string[]
  accessRequirements_en: string
  accessRequirements_zh: string
  resources_en: string
  resources_zh: string
  scoringNote_en: string
  scoringNote_zh: string
  streamUrl: string
  coverImage: string
}

const emptyForm = (): FormState => ({
  name_en: '', name_zh: '',
  description_en: '', description_zh: '',
  game: 'ACC', carClass: '', carList: '',
  regions: ['CN'],
  accessRequirements_en: '', accessRequirements_zh: '',
  resources_en: '', resources_zh: '',
  scoringNote_en: '', scoringNote_zh: '',
  streamUrl: '',
  coverImage: '',
})

type TabKey = 'info' | 'rounds'

export function CompetitionCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state } = useApp()
  const lang = state.language
  const carClassOptions = useManagedOptions('carClass', lang)
  const gameOptions = useManagedOptions('game', lang)
  const regionOptions = useManagedOptions('region', lang)
  const [editLang, setEditLang] = useState<'en' | 'zh'>('en')
  const [tab, setTab] = useState<TabKey>('info')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [scoringRows, setScoringRows] = useState<ScoringTableEntry[]>([{ position: 1, points: 25, note_en: '', note_zh: '' }])
  const [rounds, setRounds] = useState<Round[]>([])
  const [expandedRoundId, setExpandedRoundId] = useState<string | null>(null)
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [nameError, setNameError] = useState<string | undefined>(undefined)
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const [showLeaveModal, setShowLeaveModal] = useState(false)

  const touch = () => { setDirty(true); setErrorMessages([]) }

  const update = (field: keyof FormState, value: string | number | boolean | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }))
    touch()
    if (field === 'name_en' || field === 'name_zh') setNameError(undefined)
  }

  const toggleRegion = (region: string) => {
    setForm(prev => ({
      ...prev,
      regions: prev.regions.includes(region)
        ? prev.regions.filter(r => r !== region)
        : [...prev.regions, region],
    }))
    touch()
  }

  const addScoringRow = () => {
    setScoringRows(prev => [...prev, { position: prev.length + 1, points: 0, note_en: '', note_zh: '' }])
    touch()
  }
  const removeScoringRow = (idx: number) => {
    setScoringRows(prev => prev.filter((_, i) => i !== idx).map((row, i) => ({ ...row, position: i + 1 })))
    touch()
  }
  const updateScoringRow = (idx: number, field: string, value: string | number) => {
    setScoringRows(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row))
    touch()
  }

  const addRound = () => {
    const round = createDefaultRound('temp')
    setRounds(prev => [...prev, round])
    setExpandedRoundId(round.id)
    touch()
  }

  const updateRound = (roundId: string, patch: Partial<Round>) => {
    setRounds(prev => prev.map(r => r.id === roundId ? { ...r, ...patch } : r))
    touch()
  }

  const deleteRound = (roundId: string) => {
    setRounds(prev => prev.filter(r => r.id !== roundId))
    touch()
  }

  const addStage = (roundId: string) => {
    const stage = createDefaultStage(roundId)
    setRounds(prev => prev.map(r =>
      r.id === roundId ? { ...r, stages: [...r.stages, stage] } : r
    ))
    setExpandedStageId(stage.id)
    touch()
  }

  const updateStage = (roundId: string, stageId: string, updated: Stage) => {
    setRounds(prev => prev.map(r =>
      r.id === roundId
        ? { ...r, stages: r.stages.map(s => s.id === stageId ? updated : s) }
        : r
    ))
    touch()
  }

  const deleteStage = (roundId: string, stageId: string) => {
    setRounds(prev => prev.map(r =>
      r.id === roundId ? { ...r, stages: r.stages.filter(s => s.id !== stageId) } : r
    ))
    touch()
  }

  const buildCompetition = (asDraft: boolean): Competition => {
    const now = new Date().toISOString()
    const compId = `c_${Date.now()}`
    const finalRounds: Round[] = rounds.map((r, ri) => ({
      ...r,
      competitionId: compId,
      roundNumber: ri + 1,
      stages: r.stages.map(s => ({
        ...s,
        gameConfig: s.gameConfig ?? createDefaultGameConfig(form.game as GamePlatform),
      })),
    }))
    return {
      id: compId,
      name_zh: form.name_zh || form.name_en || 'Untitled',
      name_en: form.name_en || form.name_zh || 'Untitled',
      description_zh: form.description_zh,
      description_en: form.description_en,
      coverImage: form.coverImage,
      regions: form.regions as Region[],
      game: form.game as GamePlatform,
      carClass: form.carClass,
      carList: form.carList ? form.carList.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      defaultRuleset: {
        scoringTable: scoringRows,
        scoringNote_zh: form.scoringNote_zh || undefined,
        scoringNote_en: form.scoringNote_en || undefined,
        accessRequirements_zh: form.accessRequirements_zh || undefined,
        accessRequirements_en: form.accessRequirements_en || undefined,
        resources_zh: form.resources_zh || undefined,
        resources_en: form.resources_en || undefined,
        streamUrl: form.streamUrl || undefined,
      },
      rounds: finalRounds,
      statusOverride: asDraft ? 'Draft' : undefined,
      createdBy: 'admin',
      createdAt: now,
      updatedAt: now,
    }
  }

  const previewStatus: CompetitionStatus = useMemo(() => {
    if (!form.name_en.trim() && !form.name_zh.trim()) return 'Draft'
    return getCompetitionStatus({ rounds } as Competition)
  }, [form.name_en, form.name_zh, rounds])

  const statusLabel = t(`event.status.${previewStatus}`)

  const validate = (asDraft: boolean): string[] => {
    const msgs: string[] = []
    const nameMissing = !form.name_en.trim() && !form.name_zh.trim()
    if (nameMissing) {
      msgs.push(t('competition.errNameRequired'))
      setNameError(t('competition.errNameRequired'))
    } else {
      setNameError(undefined)
    }
    if (asDraft) return msgs

    if (rounds.length === 0) {
      msgs.push(t('competition.errNoRoundsPublish'))
    }
    rounds.forEach((r, ri) => {
      const rLabel = `${t('competition.round')} ${ri + 1}${(r.name_en || r.name_zh) ? ` (${lang === 'zh' ? r.name_zh || r.name_en : r.name_en || r.name_zh})` : ''}`
      if (!r.name_en.trim() && !r.name_zh.trim()) {
        msgs.push(`${rLabel}: ${t('competition.errRoundNameRequired')}`)
      }
      const open = new Date(r.registrationOpenAt).getTime()
      const close = new Date(r.registrationCloseAt).getTime()
      if (!(close > open)) {
        msgs.push(`${rLabel}: ${t('competition.errRoundRegDates')}`)
      }
      if (r.cancelRegistrationDeadline) {
        const cd = new Date(r.cancelRegistrationDeadline).getTime()
        if (cd > close) {
          msgs.push(`${rLabel}: ${t('competition.errRoundCancelDeadline')}`)
        }
      }
      r.stages.forEach((s, si) => {
        const sLabel = `${rLabel} · ${t('competition.stage')} ${si + 1}`
        if (!s.name_en.trim() && !s.name_zh.trim()) {
          msgs.push(`${sLabel}: ${t('competition.errStageNameRequired')}`)
        }
        const st = new Date(s.startsAt).getTime()
        const en = new Date(s.endsAt).getTime()
        if (!(en > st)) {
          msgs.push(`${sLabel}: ${t('competition.errStageTime')}`)
        }
      })
    })
    return msgs
  }

  const handleSave = (asDraft: boolean) => {
    const msgs = validate(asDraft)
    if (msgs.length > 0) {
      setErrorMessages(msgs)
      const hasInfoError = !!(nameError)
      setTab(hasInfoError ? 'info' : 'rounds')
      scrollToTop()
      return
    }
    setErrorMessages([])
    const newComp = buildCompetition(asDraft)
    addCompetition(newComp)
    setDirty(false)
    navigate('/competitions')
  }

  const handleBack = () => {
    if (dirty) setShowLeaveModal(true)
    else navigate('/competitions')
  }

  const tabs: Array<{ key: TabKey; label: string; count?: number }> = [
    { key: 'info', label: t('competition.tabInfo') },
    { key: 'rounds', label: t('competition.tabRounds'), count: rounds.length },
  ]

  return (
    <>
      <div className="sticky top-0 z-10 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 pt-5 pb-0">
          <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{t('competition.createCompetition')}</h1>
            <StatusBadge status={String(previewStatus)} label={`${t('competition.createPreviewStatus')}: ${statusLabel}`} />
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
            <Button variant="secondary" onClick={() => handleSave(true)}>
              <Save className="w-4 h-4 mr-1" />
              {t('event.saveAsDraft')}
            </Button>
            <Button onClick={() => handleSave(false)}>
              {t('event.publishNow')}
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-400 pb-2">{t('competition.createHintBilingual')}</p>

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

      {errorMessages.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 pt-4">
          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-sm font-medium text-red-700">{t('competition.errPublishBlocked')}</span>
            </div>
            <ul className="list-disc list-inside text-sm text-red-600 space-y-0.5">
              {errorMessages.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>
        </div>
      )}

      {tab === 'info' && (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          <Card>
            <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionBasicInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                data-flow="create-name"
                label={`${t('competition.competitionName')} (${editLang === 'en' ? 'EN' : '中文'}) *`}
                value={editLang === 'en' ? form.name_en : form.name_zh}
                onChange={(e) => update(editLang === 'en' ? 'name_en' : 'name_zh', e.target.value)}
                error={nameError}
              />
              <Select data-flow="create-game" label={t('event.game')} options={gameOptions} value={form.game} onChange={(e) => update('game', e.target.value)} />
              <Select data-flow="create-carClass" label={t('event.carClass')} options={carClassOptions.length > 0 ? carClassOptions : [{ value: '', label: '' }]} value={form.carClass} onChange={(e) => update('carClass', e.target.value)} />
              <Input label={t('event.carList')} placeholder={t('event.carListPlaceholder')} value={form.carList} onChange={(e) => update('carList', e.target.value)} />
              <Input label={t('event.streamUrl')} value={form.streamUrl} onChange={(e) => update('streamUrl', e.target.value)} />
              <div className="md:col-span-2 max-w-sm">
                <ImageUpload label={t('event.coverImage')} value={form.coverImage} onChange={(v) => update('coverImage', v)} />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  data-flow="create-desc"
                  label={`${t('common.description')} (${editLang === 'en' ? 'EN' : '中文'})`}
                  value={editLang === 'en' ? form.description_en : form.description_zh}
                  onChange={(e) => update(editLang === 'en' ? 'description_en' : 'description_zh', e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('common.regions')}</h3>
            <div data-flow="create-regions" className="flex flex-wrap gap-3">
              {regionOptions.map(opt => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={form.regions.includes(opt.value)}
                    onChange={() => toggleRegion(opt.value)}
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
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
                  {scoringRows.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-2 pr-3">
                        <input type="number" className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" value={row.position} readOnly />
                      </td>
                      <td className="py-2 pr-3">
                        <input type="number" className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" value={row.points} onChange={(e) => updateScoringRow(idx, 'points', Number(e.target.value))} />
                      </td>
                      <td className="py-2 pr-3">
                        <input type="text" className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" value={editLang === 'en' ? row.note_en || '' : row.note_zh || ''} onChange={(e) => updateScoringRow(idx, editLang === 'en' ? 'note_en' : 'note_zh', e.target.value)} />
                      </td>
                      <td className="py-2">
                        <Button variant="ghost" size="sm" onClick={() => removeScoringRow(idx)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Textarea
                label={`${t('event.scoringNote')} (${editLang === 'en' ? 'EN' : '中文'})`}
                value={editLang === 'en' ? form.scoringNote_en : form.scoringNote_zh}
                onChange={(e) => update(editLang === 'en' ? 'scoringNote_en' : 'scoringNote_zh', e.target.value)}
              />
            </div>
            <div className="mt-3">
              <Button variant="secondary" size="sm" onClick={addScoringRow}>
                <Plus className="w-4 h-4 mr-1" />
                {t('event.addRow')}
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionRules')}</h3>
            <div className="space-y-4">
              <Textarea
                label={`${t('event.accessRequirements')} (${editLang === 'en' ? 'EN' : '中文'})`}
                value={editLang === 'en' ? form.accessRequirements_en : form.accessRequirements_zh}
                onChange={(e) => update(editLang === 'en' ? 'accessRequirements_en' : 'accessRequirements_zh', e.target.value)}
              />
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.resources')}</h3>
            <Textarea
              label={`Resources (${editLang === 'en' ? 'EN' : '中文'})`}
              value={editLang === 'en' ? form.resources_en : form.resources_zh}
              onChange={(e) => update(editLang === 'en' ? 'resources_en' : 'resources_zh', e.target.value)}
            />
          </Card>
        </div>
      )}

      {tab === 'rounds' && (
        <div className="max-w-5xl mx-auto p-6 space-y-4">
          {rounds.length === 0 && (
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

          {rounds.map((round, roundIdx) => (
            <CreateRoundPanel
              key={round.id}
              round={round}
              roundIdx={roundIdx}
              editLang={editLang}
              game={form.game as GamePlatform}
              isExpanded={expandedRoundId === round.id}
              expandedStageId={expandedStageId}
              onToggleRound={() => setExpandedRoundId(expandedRoundId === round.id ? null : round.id)}
              onToggleStage={(stageId) => setExpandedStageId(expandedStageId === stageId ? null : stageId)}
              onUpdate={(patch) => updateRound(round.id, patch)}
              onDelete={() => deleteRound(round.id)}
              onAddStage={() => addStage(round.id)}
              onDeleteStage={(stageId) => deleteStage(round.id, stageId)}
              onUpdateStage={(stageId, updated) => updateStage(round.id, stageId, updated)}
            />
          ))}

          {rounds.length > 0 && (
            <Button variant="secondary" size="sm" onClick={addRound}>
              <Plus className="w-4 h-4 mr-1" />
              {t('competition.addRound')}
            </Button>
          )}
        </div>
      )}

      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title={t('common.unsavedChangesTitle')}
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-5">{t('common.unsavedChangesBody')}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setShowLeaveModal(false)}>
            {t('common.keepEditing')}
          </Button>
          <Button variant="danger" onClick={() => navigate('/competitions')}>
            {t('common.discardAndLeave')}
          </Button>
        </div>
      </Modal>
    </>
  )
}

function CreateRoundPanel({
  round,
  roundIdx,
  editLang,
  game,
  isExpanded,
  expandedStageId,
  onToggleRound,
  onToggleStage,
  onUpdate,
  onDelete,
  onAddStage,
  onDeleteStage,
  onUpdateStage,
}: {
  round: Round
  roundIdx: number
  editLang: 'en' | 'zh'
  game: GamePlatform
  isExpanded: boolean
  expandedStageId: string | null
  onToggleRound: () => void
  onToggleStage: (stageId: string) => void
  onUpdate: (patch: Partial<Round>) => void
  onDelete: () => void
  onAddStage: () => void
  onDeleteStage: (stageId: string) => void
  onUpdateStage: (stageId: string, updated: Stage) => void
}) {
  const { t } = useTranslation()
  const getName = (e: { name_zh: string; name_en: string }) =>
    editLang === 'en' ? (e.name_en || e.name_zh || '—') : (e.name_zh || e.name_en || '—')
  const toIso = (v: string) => v ? new Date(v).toISOString() : ''

  return (
    <Card padding={false}>
      <div
        className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50 cursor-pointer border-b"
        onClick={onToggleRound}
      >
        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
        <span className="text-sm font-medium text-gray-400 w-8 shrink-0">#{roundIdx + 1}</span>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-900 truncate">{getName(round)}</span>
          <div className="text-xs text-gray-500 mt-0.5">
            {round.track || t('event.noTrack')}
            {' · '}
            {round.stages.length} {t('competition.stages')}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete() }}>
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>

      {isExpanded && (
        <div className="px-6 pb-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
            <Input
              label={`${t('competition.roundName')} (${editLang === 'en' ? 'EN' : '中文'})`}
              value={editLang === 'en' ? round.name_en : round.name_zh}
              onChange={(e) => onUpdate(editLang === 'en' ? { name_en: e.target.value } : { name_zh: e.target.value })}
            />
            <Input
              label={t('event.track')}
              value={round.track || ''}
              onChange={(e) => onUpdate({ track: e.target.value })}
            />
            <Input
              label={t('event.registrationOpenAt')}
              type="datetime-local"
              value={round.registrationOpenAt.slice(0, 16)}
              onChange={(e) => onUpdate({ registrationOpenAt: toIso(e.target.value) })}
            />
            <Input
              label={t('event.registrationCloseAt')}
              type="datetime-local"
              value={round.registrationCloseAt.slice(0, 16)}
              onChange={(e) => onUpdate({ registrationCloseAt: toIso(e.target.value) })}
            />
            <Input
              label={t('event.cancelRegistrationDeadline')}
              type="datetime-local"
              value={round.cancelRegistrationDeadline?.slice(0, 16) || ''}
              onChange={(e) => onUpdate({ cancelRegistrationDeadline: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
            />
          </div>

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
              {round.stages.map((stage, stageIdx) => (
                <CreateStagePanel
                  key={stage.id}
                  stage={stage}
                  stageIdx={stageIdx}
                  editLang={editLang}
                  game={game}
                  isExpanded={expandedStageId === stage.id}
                  onToggle={() => onToggleStage(stage.id)}
                  onUpdate={(updated) => onUpdateStage(stage.id, updated)}
                  onDelete={() => onDeleteStage(stage.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

function CreateStagePanel({
  stage,
  stageIdx,
  editLang,
  game,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
}: {
  stage: Stage
  stageIdx: number
  editLang: 'en' | 'zh'
  game: GamePlatform
  isExpanded: boolean
  onToggle: () => void
  onUpdate: (updated: Stage) => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const getName = (e: { name_zh: string; name_en: string }) =>
    editLang === 'en' ? (e.name_en || e.name_zh || '—') : (e.name_zh || e.name_en || '—')
  const toIso = (v: string) => v ? new Date(v).toISOString() : ''
  const [showServerConfig, setShowServerConfig] = useState(false)

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
            <Input
              label={`${t('competition.stageName')} (${editLang === 'en' ? 'EN' : '中文'})`}
              value={editLang === 'en' ? stage.name_en : stage.name_zh}
              onChange={(e) => onUpdate({ ...stage, ...(editLang === 'en' ? { name_en: e.target.value } : { name_zh: e.target.value }) })}
            />
            <Input
              label={t('common.from')}
              type="datetime-local"
              value={stage.startsAt.slice(0, 16)}
              onChange={(e) => onUpdate({ ...stage, startsAt: toIso(e.target.value) })}
            />
            <Input
              label={t('common.to')}
              type="datetime-local"
              value={stage.endsAt.slice(0, 16)}
              onChange={(e) => onUpdate({ ...stage, endsAt: toIso(e.target.value) })}
            />
          </div>

          <Textarea
            label={`${t('common.description')} (${editLang === 'en' ? 'EN' : '中文'})`}
            value={editLang === 'en' ? stage.description_en || '' : stage.description_zh || ''}
            onChange={(e) => onUpdate({ ...stage, ...(editLang === 'en' ? { description_en: e.target.value } : { description_zh: e.target.value }) })}
          />

          <div className="rounded-md border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50 hover:border-gray-300">
            <button
              onClick={() => setShowServerConfig(true)}
              className="flex items-center justify-between w-full cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{t('serverConfig.title')}</span>
              </div>
              <span className="text-xs text-blue-600 hover:text-blue-700">{t('common.edit')}</span>
            </button>
          </div>
        </div>
      )}

      {showServerConfig && (
        <ServerConfigModal
          isOpen={true}
          onClose={() => setShowServerConfig(false)}
          onSave={(updated) => { onUpdate(updated); setShowServerConfig(false) }}
          stage={stage}
          editLang={editLang}
          game={game}
          splitCount={stage.enableMultiSplit ? Math.max(1, stage.maxSplits || 1) : 1}
          registeredDrivers={[]}
        />
      )}
    </div>
  )
}
