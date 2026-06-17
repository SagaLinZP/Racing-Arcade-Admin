import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { useManagedOptions } from '@/hooks/useManagedOptions'
import { competitions } from '@/data/competitions'
import type { Round, Stage, GamePlatform } from '@/data/competitions'
import { drivers } from '@/data/drivers'
import { teams } from '@/data/teams'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ArrowLeft, Save, Plus, ChevronDown, ChevronRight, Trash2, Settings } from 'lucide-react'
import { cn, getCompetitionStatus, getRoundStatus } from '@/lib/utils'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { ServerConfigModal } from './ServerConfigModal'

const GAME_OPTIONS = [
  { value: 'ACC', label: 'ACC' },
  { value: 'AC', label: 'AC' },
]

const REGION_OPTIONS = [
  { value: 'CN', label: 'China (CN)' },
  { value: 'AP', label: 'Asia Pacific (AP)' },
  { value: 'AM', label: 'Americas (AM)' },
  { value: 'EU', label: 'Europe & Africa (EU)' },
]

const SPLIT_RULE_OPTIONS = [
  { value: 'First Come First Served', label: 'First Come First Served / 先到先得' },
  { value: 'By Skill', label: 'By Skill / 按实力' },
  { value: 'Manual', label: 'Manual / 手动' },
  { value: 'Random', label: 'Random / 随机' },
]

const ELIGIBILITY_OPTIONS = [
  { value: 'roundRegistration', label: 'Round Registration / 分站报名' },
  { value: 'previousStageResult', label: 'Previous Stage Result / 上一阶段成绩' },
  { value: 'manualInvite', label: 'Manual Invite / 手动邀请' },
]

type TabKey = 'info' | 'rounds'

export function CompetitionEditPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const carClassOptions = useManagedOptions('carClass', lang)
  const navigate = useNavigate()
  const { id } = useParams()
  const [tab, setTab] = useState<TabKey>('info')
  const [editLang, setEditLang] = useState<'en' | 'zh'>('en')
  const [expandedRoundId, setExpandedRoundId] = useState<string | null>(null)
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null)

  const comp = useMemo(() => competitions.find(c => c.id === id), [id])

  if (!comp) return <div className="text-center py-12 text-gray-500">Competition not found</div>

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
              <Button variant="secondary" onClick={() => navigate('/competitions')}>
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
        <div className="max-w-5xl mx-auto p-6 space-y-6" key={editLang}>
          <Card>
            <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionBasicInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label={`${t('competition.competitionName')} (${editLang === 'en' ? 'EN' : '中文'})`} defaultValue={editLang === 'en' ? comp.name_en : comp.name_zh} />
              <Select label={t('event.game')} options={GAME_OPTIONS} defaultValue={comp.game} />
              <Select label={t('event.carClass')} options={carClassOptions.length > 0 ? carClassOptions : [{ value: '', label: '' }]} defaultValue={comp.carClass} />
              <Input label={t('event.carList')} placeholder={t('event.carListPlaceholder')} defaultValue={comp.carList?.join(', ') || ''} />
              <Input label={t('event.streamUrl')} defaultValue={comp.defaultRuleset.streamUrl || ''} />
              <div className="md:col-span-2 max-w-sm">
                <ImageUpload label={t('event.coverImage')} defaultValue={comp.coverImage || ''} />
              </div>
              <div className="md:col-span-2">
                <Textarea label={`${t('common.description')} (${editLang === 'en' ? 'EN' : '中文'})`} defaultValue={editLang === 'en' ? comp.description_en : comp.description_zh} />
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('common.regions')}</h3>
            <div className="flex flex-wrap gap-6">
              {REGION_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={comp.regions.includes(opt.value as 'CN' | 'AP' | 'AM' | 'EU')}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionRules')}</h3>
            <div className="space-y-4">
              <Textarea label={`${t('event.accessRequirements')} (${editLang === 'en' ? 'EN' : '中文'})`} defaultValue={editLang === 'en' ? comp.defaultRuleset.accessRequirements_en || '' : comp.defaultRuleset.accessRequirements_zh || ''} />
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.sectionScoringTable')}</h3>
            <div className="overflow-x-auto" key={editLang}>
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
                        <input type="number" className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" defaultValue={row.position} />
                      </td>
                      <td className="py-2 pr-3">
                        <input type="number" className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" defaultValue={row.points} />
                      </td>
                      <td className="py-2 pr-3">
                        <input type="text" className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" defaultValue={editLang === 'en' ? (row.note_en || '') : (row.note_zh || '')} />
                      </td>
                      <td className="py-2">
                        <button className="text-red-500 hover:text-red-700">
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
              <Button variant="secondary" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                {t('event.addRow')}
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('event.resources')}</h3>
            <Textarea label={`Resources (${editLang === 'en' ? 'EN' : '中文'})`} defaultValue={editLang === 'en' ? comp.defaultRuleset.resources_en || '' : comp.defaultRuleset.resources_zh || ''} />
          </Card>
        </div>
      )}

      {tab === 'rounds' && (
        <div className="max-w-5xl mx-auto p-6 space-y-4">
          {comp.rounds.length === 0 && (
            <Card>
              <div className="text-center py-8">
                <p className="text-sm text-gray-400 mb-3">{t('competition.noRounds')}</p>
                <Button variant="secondary" size="sm">
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
              roundIdx={roundIdx}
              isExpanded={expandedRoundId === round.id}
              expandedStageId={expandedStageId}
              onToggleRound={() => setExpandedRoundId(expandedRoundId === round.id ? null : round.id)}
              onToggleStage={(stageId) => setExpandedStageId(expandedStageId === stageId ? null : stageId)}
              editLang={editLang}
              game={comp.game}
            />
          ))}

          {comp.rounds.length > 0 && (
            <Button variant="secondary" size="sm">
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
  roundIdx,
  isExpanded,
  expandedStageId,
  onToggleRound,
  onToggleStage,
  editLang,
  game,
}: {
  round: Round
  roundIdx: number
  isExpanded: boolean
  expandedStageId: string | null
  onToggleRound: () => void
  onToggleStage: (stageId: string) => void
  editLang: 'en' | 'zh'
  game: GamePlatform
}) {
  const { t } = useTranslation()
  const lang = useApp().state.language
  const getName = (e: { name_zh: string; name_en: string }) => lang === 'zh' ? e.name_zh : e.name_en

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
            <StatusBadge status={getRoundStatus(round)} label={t(`event.status.${getRoundStatus(round)}`)} />
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {round.track || 'No track'}
            {' · '}
            {round.stages.length} {t('competition.stages')}
            {' · '}
            {round.currentRegistrations} {t('competition.registrations')}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>

      {isExpanded && (
        <div className="px-6 pb-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4" key={editLang}>
            <Input label={`${t('competition.roundName')} (${editLang === 'en' ? 'EN' : '中文'})`} defaultValue={editLang === 'en' ? round.name_en : round.name_zh} />
            <Input label={t('event.track')} defaultValue={round.track || ''} />
            <Input label={t('event.registrationOpenAt')} type="datetime-local" defaultValue={round.registrationOpenAt.slice(0, 16)} />
            <Input label={t('event.registrationCloseAt')} type="datetime-local" defaultValue={round.registrationCloseAt.slice(0, 16)} />
            <Input label={t('event.cancelRegistrationDeadline')} type="datetime-local" defaultValue={round.cancelRegistrationDeadline?.slice(0, 16) || ''} />
          </div>

          <div className="max-w-sm">
            <ImageUpload label={t('event.coverImage')} defaultValue={round.coverImage || ''} aspectRatio="video" />
          </div>

          <Textarea label={`${t('common.description')} (${editLang === 'en' ? 'EN' : '中文'})`} defaultValue={editLang === 'en' ? round.description_en || '' : round.description_zh || ''} />

          {round.cancelledReason_zh && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {editLang === 'en' ? round.cancelledReason_en : round.cancelledReason_zh}
            </div>
          )}

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">{t('competition.stages')} ({round.stages.length})</h4>
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                {t('competition.addStage')}
              </Button>
            </div>

            {round.stages.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">{t('competition.noStages')}</p>
            )}

            <div className="space-y-2">
              {round.stages.map((stage, stageIdx) => (
                <StageAccordion
                  key={stage.id}
                  stage={stage}
                  stageIdx={stageIdx}
                  isExpanded={expandedStageId === stage.id}
                  onToggle={() => onToggleStage(stage.id)}
                  editLang={editLang}
                  registeredDriverIds={round.registeredDriverIds}
                  game={game}
                />
              ))}
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
}: {
  stage: Stage
  stageIdx: number
  isExpanded: boolean
  onToggle: () => void
  editLang: 'en' | 'zh'
  registeredDriverIds: string[]
  game: GamePlatform
}) {
  const { t } = useTranslation()
  const lang = useApp().state.language
  const getName = (e: { name_zh: string; name_en: string }) => lang === 'zh' ? e.name_zh : e.name_en
  const [eligibility, setEligibility] = useState(stage.eligibilitySource || 'roundRegistration')
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set())
  const [localStage, setLocalStage] = useState<Stage>(stage)
  const [enableMultiSplit, setEnableMultiSplit] = useState(stage.enableMultiSplit || false)
  const [maxSplits, setMaxSplits] = useState(stage.maxSplits || 2)
  const [showServerConfig, setShowServerConfig] = useState(false)

  const splitCount = enableMultiSplit ? Math.max(1, maxSplits) : 1

  const handleMultiSplitChange = (enabled: boolean) => {
    setEnableMultiSplit(enabled)
  }

  const handleSaveStage = (updated: Stage) => {
    setLocalStage(updated)
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
        <span className="text-xs text-gray-400">{localStage.gameSessions.length} {t('competition.sessions')}</span>
        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
          <Trash2 className="w-3.5 h-3.5 text-red-500" />
        </Button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3" key={editLang}>
            <Input label={`${t('competition.stageName')} (${editLang === 'en' ? 'EN' : '中文'})`} defaultValue={editLang === 'en' ? stage.name_en : stage.name_zh} />
            <Input label={t('common.from')} type="datetime-local" defaultValue={stage.startsAt.slice(0, 16)} />
            <Input label={t('common.to')} type="datetime-local" defaultValue={stage.endsAt.slice(0, 16)} />
          </div>

          <Textarea label={`${t('common.description')} (${editLang === 'en' ? 'EN' : '中文'})`} defaultValue={editLang === 'en' ? stage.description_en || '' : stage.description_zh || ''} />

          <div className="space-y-3">
            <Select
              label={t('competition.eligibilitySource')}
              options={ELIGIBILITY_OPTIONS}
              defaultValue={eligibility}
              onChange={(e) => setEligibility(e.target.value as typeof eligibility)}
            />

            {eligibility === 'previousStageResult' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-1 border-l-2 border-blue-200 pl-3">
                <Select
                  label={t('competition.advancementMetric')}
                  options={[
                    { value: 'bestLap', label: 'Best Lap / 最快圈' },
                    { value: 'points', label: 'Points / 积分' },
                    { value: 'position', label: 'Position / 名次' },
                  ]}
                  defaultValue={stage.advancementRule?.metric || 'bestLap'}
                />
                <Select
                  label={t('competition.advancementDirection')}
                  options={[
                    { value: 'asc', label: t('competition.advancementAscending') },
                    { value: 'desc', label: t('competition.advancementDescending') },
                  ]}
                  defaultValue={stage.advancementRule?.direction || 'asc'}
                />
                <Input label={t('competition.advancementLimit')} type="number" defaultValue={stage.advancementRule?.limit || ''} />
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

          <div className="rounded-md bg-gray-50 border border-gray-200 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-medium text-gray-600">{t('event.sectionSplitConfig')}</h5>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={enableMultiSplit} onChange={(e) => handleMultiSplitChange(e.target.checked)} className="rounded border-gray-300" />
                <span className="text-sm text-gray-700">{t('event.enableMultiSplit')}</span>
              </label>
            </div>
            {enableMultiSplit && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label={t('event.maxEntriesPerSplit')} type="number" defaultValue={stage.maxEntriesPerSplit || ''} />
                <Input label={t('event.maxSplits')} type="number" value={String(maxSplits)} onChange={(e) => setMaxSplits(Math.max(1, Number(e.target.value)))} />
                <Input label={t('event.minEntries')} type="number" defaultValue={stage.minEntries || ''} />
                <Select label={t('event.splitAssignmentRule')} options={SPLIT_RULE_OPTIONS} defaultValue={stage.splitAssignmentRule || ''} />
              </div>
            )}
            {!enableMultiSplit && (
              <p className="text-xs text-gray-500">{t('competition.singleSplitHint')}</p>
            )}
          </div>

          {/* Server Config button */}
          <div className="rounded-md border border-gray-200 bg-white p-3">
            <button
              onClick={() => setShowServerConfig(true)}
              className="flex items-center justify-between w-full"
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
          onSave={handleSaveStage}
          stage={localStage}
          editLang={editLang}
          game={game}
          splitCount={splitCount}
          registeredDrivers={registeredDrivers}
        />
      )}
    </div>
  )
}
