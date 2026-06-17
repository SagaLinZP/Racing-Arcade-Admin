import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { competitions } from '@/data/competitions'
import { drivers } from '@/data/drivers'
import { teams } from '@/data/teams'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import {
  getStageResultStatus,
  calculateCompetitionStandings,
  calculateRoundStandings,
  getName,
} from '@/lib/results'
import type { DriverStanding } from '@/lib/results'
import { ChevronDown, ChevronRight, Trophy, Pencil, ClipboardList, Settings } from 'lucide-react'

export function ResultListPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()

  const [expandedComps, setExpandedComps] = useState<Set<string>>(new Set())
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set())
  const [standingsModal, setStandingsModal] = useState<{ type: 'competition' | 'round'; id: string } | null>(null)

  const toggleComp = (id: string) =>
    setExpandedComps(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })

  const toggleRound = (id: string) =>
    setExpandedRounds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: 'default' | 'info' | 'warning' | 'success'; label: string }> = {
      pending: { variant: 'default', label: t('result.statusPending') },
      entered: { variant: 'warning', label: t('result.statusEntered') },
      partial: { variant: 'info', label: t('result.statusPartial') },
      published: { variant: 'success', label: t('result.statusPublished') },
    }
    const cfg = map[status] || map.pending
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>
  }

  const standingsData = useMemo(() => {
    if (!standingsModal) return null
    if (standingsModal.type === 'competition') {
      const comp = competitions.find(c => c.id === standingsModal.id)
      if (!comp) return null
      return { title: getName(comp, lang), standings: calculateCompetitionStandings(comp) }
    }
    for (const comp of competitions) {
      const round = comp.rounds.find(r => r.id === standingsModal.id)
      if (round) return { title: getName(round, lang), standings: calculateRoundStandings(round) }
    }
    return null
  }, [standingsModal, lang])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('result.title')}</h1>
      </div>

      <Card padding={false}>
        <div className="divide-y divide-gray-200">
          {competitions.map(comp => {
            const compExpanded = expandedComps.has(comp.id)
            return (
              <div key={comp.id}>
                <button
                  onClick={() => toggleComp(comp.id)}
                  className="flex items-center gap-2 w-full px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  {compExpanded
                    ? <ChevronDown className="w-4 h-4 text-gray-400" />
                    : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  <span className="text-sm font-semibold text-gray-900">{getName(comp, lang)}</span>
                  <Badge variant="default">{comp.game}</Badge>
                  <span className="text-xs text-gray-400">
                    {comp.rounds.length} {t('competition.rounds').toLowerCase()}
                  </span>
                  <div className="flex-1" />
                  <span
                    onClick={(e) => { e.stopPropagation(); setStandingsModal({ type: 'competition', id: comp.id }) }}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    {t('result.viewStandings')}
                  </span>
                </button>

                {compExpanded && (
                  <div className="bg-gray-50/50">
                    {comp.rounds.map(round => {
                      const roundExpanded = expandedRounds.has(round.id)
                      return (
                        <div key={round.id} className="border-l-2 border-gray-200 ml-4">
                          <button
                            onClick={() => toggleRound(round.id)}
                            className="flex items-center gap-2 w-full px-4 py-2.5 hover:bg-gray-50 transition-colors"
                          >
                            {roundExpanded
                              ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                              : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                            <span className="text-sm font-medium text-gray-700">{getName(round, lang)}</span>
                            <span className="text-xs text-gray-400">
                              {round.stages.length} {t('competition.stages').toLowerCase()}
                            </span>
                            <div className="flex-1" />
                            <span
                              onClick={(e) => { e.stopPropagation(); setStandingsModal({ type: 'round', id: round.id }) }}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 cursor-pointer"
                            >
                              <Trophy className="w-3 h-3" />
                              {t('result.roundStandings')}
                            </span>
                          </button>

                          {roundExpanded && (
                            <div className="pb-2">
                              {round.stages.map(stage => {
                                const status = getStageResultStatus(stage)
                                const hasResults = stage.splits.some(s => s.results && s.results.length > 0)
                                const totalResults = stage.splits.reduce(
                                  (sum, s) => sum + (s.results?.length ?? 0), 0,
                                )
                                return (
                                  <div
                                    key={stage.id}
                                    className="border-l-2 border-gray-200 ml-4"
                                  >
                                    <div className="flex items-center gap-2 mb-1 px-4 pt-2">
                                      <span className="text-xs font-medium text-gray-500 uppercase">{stage.type}</span>
                                      <span className="text-xs text-gray-500">{getName(stage, lang)}</span>
                                    </div>
                                    <div
                                      className={cn(
                                        'flex items-center gap-2 rounded-md mx-4 px-3 py-2 cursor-pointer hover:bg-blue-50/50 transition-colors',
                                        status === 'pending' ? 'bg-white' : 'bg-green-50/30',
                                      )}
                                      onClick={() => navigate(`/results/${stage.id}`)}
                                    >
                                      <Settings className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                      {stage.gameConfig?.track && (
                                        <Badge variant="default" className="text-xs">{stage.gameConfig.track}</Badge>
                                      )}
                                      <span className="text-xs text-gray-400">
                                        {stage.gameSessions.length} {t('competition.sessions').toLowerCase()}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        {stage.splits.length} {t('result.split').toLowerCase()}(s)
                                      </span>
                                      {totalResults > 0 && (
                                        <span className="text-xs text-gray-400">
                                          {totalResults} {t('result.entries').toLowerCase()}
                                        </span>
                                      )}
                                      <div className="flex-1" />
                                      {statusBadge(status)}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => { e.stopPropagation(); navigate(`/results/${stage.id}`) }}
                                      >
                                        {hasResults
                                          ? <Pencil className="w-3.5 h-3.5" />
                                          : <ClipboardList className="w-3.5 h-3.5" />}
                                      </Button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      <Modal
        isOpen={!!standingsModal}
        onClose={() => setStandingsModal(null)}
        title={standingsData ? `${t('result.standings')} — ${standingsData.title}` : t('result.standings')}
        size="lg"
      >
        {standingsData && standingsData.standings.length > 0 ? (
          <StandingsTable standings={standingsData.standings} />
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">{t('result.noStandings')}</p>
        )}
      </Modal>
    </div>
  )
}

function StandingsTable({ standings }: { standings: DriverStanding[] }) {
  const { t } = useTranslation()
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{t('result.position')}</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{t('result.driver')}</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{t('result.team')}</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">{t('result.points')}</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">{t('result.wins')}</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">{t('result.podiums')}</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">{t('result.entriesCount')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {standings.map((s, i) => {
            const driver = drivers.find(d => d.id === s.driverId)
            const team = s.teamId ? teams.find(t => t.id === s.teamId) : undefined
            return (
              <tr key={s.driverId} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm font-bold text-gray-900">{i + 1}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{driver?.nickname ?? s.driverId}</td>
                <td className="px-4 py-2 text-sm text-gray-500">{team?.name ?? '—'}</td>
                <td className="px-4 py-2 text-sm font-bold text-right text-blue-600">{s.totalPoints}</td>
                <td className="px-4 py-2 text-sm text-right text-gray-600">{s.wins}</td>
                <td className="px-4 py-2 text-sm text-right text-gray-600">{s.podiums}</td>
                <td className="px-4 py-2 text-sm text-right text-gray-600">{s.entries}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
