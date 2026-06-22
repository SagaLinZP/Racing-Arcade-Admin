import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { useDataVersion } from '@/data/store'
import { competitions } from '@/data/competitions'
import { drivers } from '@/data/drivers'
import { teams } from '@/data/teams'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { calculateCompetitionStandings, calculateTeamStandings, getName } from '@/lib/results'
import { cn } from '@/lib/utils'
import { ArrowLeft, ChevronDown, ChevronRight, Trophy } from 'lucide-react'

export function StandingsPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const navigate = useNavigate()
  const { competitionId } = useParams<{ competitionId: string }>()
  useDataVersion()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [view, setView] = useState<'drivers' | 'teams'>('drivers')

  const comp = competitions.find(c => c.id === competitionId)
  if (!comp) {
    return (
      <div className="p-6">
        <p className="text-gray-500">{t('result.sessionNotFound')}</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/results')}>{t('common.back')}</Button>
      </div>
    )
  }

  const standings = calculateCompetitionStandings(comp)

  const stageLabel = (stageId: string, roundId: string) => {
    const round = comp.rounds.find(r => r.id === roundId)
    const stage = round?.stages.find(s => s.id === stageId)
    const roundName = round ? getName(round, lang) : ''
    const stageName = stage ? getName(stage, lang) : stageId
    return roundName ? `${roundName} · ${stageName}` : stageName
  }

  const toggle = (driverId: string) =>
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(driverId)) next.delete(driverId)
      else next.add(driverId)
      return next
    })

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate(`/results/competition/${comp.id}`)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-bold text-gray-900">{t('result.standingsTitle')}</h1>
            <Badge variant="default">{comp.game}</Badge>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{getName(comp, lang)}</div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        <button onClick={() => setView('drivers')} className={cn('px-4 py-2 text-sm font-medium border-b-2 transition-colors', view === 'drivers' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>{t('result.driverStandings')}</button>
        <button onClick={() => setView('teams')} className={cn('px-4 py-2 text-sm font-medium border-b-2 transition-colors', view === 'teams' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>{t('result.teamStandings')}</button>
      </div>

      {view === 'teams' ? (
        <TeamStandingsCard comp={comp} lang={lang} />
      ) : standings.length === 0 ? (
        <Card><p className="text-sm text-gray-400 text-center py-10">{t('result.noPointsYet')}</p></Card>
      ) : (
        <Card padding={false}>
          <div className="divide-y divide-gray-200">
            {standings.map((s, i) => {
              const driver = drivers.find(d => d.id === s.driverId)
              const team = s.teamId ? teams.find(tm => tm.id === s.teamId) : undefined
              const isOpen = expanded.has(s.driverId)
              const breakdown = [...s.results].sort((a, b) => (a.roundId.localeCompare(b.roundId)) || a.position - b.position)
              return (
                <div key={s.driverId}>
                  <button
                    onClick={() => toggle(s.driverId)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className={cnRank(i)}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{driver?.nickname ?? s.driverId}</div>
                      <div className="text-xs text-gray-400">{team?.name ?? '—'} · {s.results.length} {t('result.entries').toLowerCase()}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-bold text-blue-600">{s.totalPoints}</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">{t('result.totalPoints')}</div>
                    </div>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-gray-300 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="bg-gray-50 px-4 pb-3 pt-1">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 px-1">{t('result.pointsBreakdown')}</div>
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-xs text-gray-400">
                            <th className="text-left font-medium px-2 py-1">{t('result.stageColumn')}</th>
                            <th className="text-right font-medium px-2 py-1 w-16">{t('result.position')}</th>
                            <th className="text-right font-medium px-2 py-1 w-28">{t('result.bestLap')}</th>
                            <th className="text-right font-medium px-2 py-1 w-16">{t('result.points')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {breakdown.map((r, idx) => (
                            <tr key={idx} className="border-t border-gray-200">
                              <td className="px-2 py-1.5 text-gray-700">{stageLabel(r.stageId, r.roundId)}</td>
                              <td className="px-2 py-1.5 text-right text-gray-700">P{r.position}</td>
                              <td className="px-2 py-1.5 text-right font-mono text-gray-500">{r.bestLap ?? '—'}</td>
                              <td className="px-2 py-1.5 text-right font-semibold text-blue-600">{r.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

function cnRank(i: number): string {
  const base = 'flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold shrink-0 '
  if (i === 0) return base + 'bg-amber-100 text-amber-700'
  if (i === 1) return base + 'bg-gray-200 text-gray-600'
  if (i === 2) return base + 'bg-orange-100 text-orange-700'
  return base + 'bg-gray-100 text-gray-500'
}

function TeamStandingsCard({ comp, lang }: { comp: import('@/data/competitions').Competition; lang: string }) {
  const { t } = useTranslation()
  void lang
  const teamStandings = calculateTeamStandings(comp)
  if (teamStandings.length === 0) {
    return <Card><p className="text-sm text-gray-400 text-center py-10">{t('result.noPointsYet')}</p></Card>
  }
  return (
    <Card padding={false}>
      <div className="divide-y divide-gray-200">
        {teamStandings.map((s, i) => {
          const team = teams.find(tm => tm.id === s.teamId)
          return (
            <div key={s.teamId} className="flex items-center gap-3 px-4 py-3">
              <span className={cnRank(i)}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{team?.name ?? s.teamId}</div>
                <div className="text-xs text-gray-400">{s.drivers.length} {t('result.driver').toLowerCase()} · {s.entries} {t('result.entries').toLowerCase()}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-base font-bold text-blue-600">{s.totalPoints}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">{t('result.totalPoints')}</div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
