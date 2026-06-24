import { updateCompetition } from '@/data/competitions'
import type { Competition, Round, Stage, Split } from '@/data/competitions'
import { getRoundRegistrations } from '@/data/registrations'
import { getServerInstance } from '@/data/servers'
import { protests, updateProtest } from '@/data/protests'
import { addNotification } from '@/data/notifications'
import { getRaceSessionId, getStageResultStatus } from '@/lib/results'
import { syncStageResults } from '@/lib/serverResults'
import { applyAdvancement } from '@/lib/advancement'
import { applyToEntryList } from '@/lib/registrationOps'
import { startStageServers, lockStageResults } from '@/lib/stageOps'
import {
  DEMO_COMP_ID,
  DEMO_ROUND_ID,
  DEMO_RACE_STAGE_ID,
  DEMO_FINAL_STAGE_ID,
  DEMO_RACE_SPLIT_ID,
  createDemoScenario,
  findDemoCompetition,
} from '@/data/demoScenario'

export interface FlowCtx {
  comp: Competition
  round: Round
  raceStage: Stage
  finalStage?: Stage
  raceSplit: Split
}

function ctx(): FlowCtx | null {
  const comp = findDemoCompetition()
  if (!comp) return null
  const round = comp.rounds[0]
  if (!round) return null
  const raceStage = round.stages.find(s => s.id === DEMO_RACE_STAGE_ID) ?? round.stages[0]
  if (!raceStage) return null
  const finalStage = round.stages.find(s => s.id === DEMO_FINAL_STAGE_ID)
  const raceSplit = raceStage.splits.find(s => s.id === DEMO_RACE_SPLIT_ID) ?? raceStage.splits[0]
  return { comp, round, raceStage, finalStage, raceSplit }
}

export interface FlowStep {
  id: string
  optional?: boolean
  /** data-flow key of the on-page control to highlight; absent for manual/do-for-me steps. */
  target?: string
  /** direction of game-server interaction, used to label the explainer. */
  serverDir?: 'push' | 'pull'
  isDone: () => boolean
  route: () => string
  run?: () => void
}

const REG_ROUTE = `/registrations/competition/${DEMO_COMP_ID}/round/${DEMO_ROUND_ID}`
const RESULTS_ROUTE = `/results/competition/${DEMO_COMP_ID}`

export const flowSteps: FlowStep[] = [
  {
    id: 'create',
    isDone: () => !!findDemoCompetition(),
    route: () => '/competitions/create',
    run: () => { createDemoScenario() },
  },
  {
    id: 'review',
    isDone: () => {
      const c = ctx()
      if (!c) return false
      return getRoundRegistrations(c.round.id).some(r => r.status === 'approved')
    },
    route: () => REG_ROUTE,
  },
  {
    id: 'server',
    target: 'server',
    serverDir: 'push',
    isDone: () => getServerInstance(DEMO_RACE_SPLIT_ID)?.status === 'running',
    route: () => RESULTS_ROUTE,
    run: () => {
      const c = ctx()
      if (!c) return
      applyToEntryList(c.comp, c.round)
      startStageServers(c.raceStage)
    },
  },
  {
    id: 'results',
    target: 'results',
    serverDir: 'pull',
    isDone: () => {
      const c = ctx()
      if (!c) return false
      const raceId = getRaceSessionId(c.raceStage)
      return c.raceStage.splits.some(sp => sp.results?.some(r => r.sessionId === raceId))
    },
    route: () => RESULTS_ROUTE,
    run: () => {
      const c = ctx()
      if (!c) return
      syncStageResults(c.raceStage, c.round, c.comp)
      updateCompetition(c.comp)
    },
  },
  {
    id: 'protest',
    optional: true,
    isDone: () => {
      const p = protests.find(x => x.id === 'demo_protest_1')
      return !!p && (p.status === 'resolved' || p.status === 'dismissed')
    },
    route: () => '/protests/demo_protest_1',
    run: () => {
      const p = protests.find(x => x.id === 'demo_protest_1')
      if (!p) return
      updateProtest({
        ...p,
        status: 'resolved',
        resolution: {
          decision: 'noFault',
          reason: '演示：经回放核实为正常比赛接触，不予处罚。',
          reviewedBy: 'admin1',
          appliedAt: new Date().toISOString(),
        },
      })
      addNotification({
        id: 'ntf_demo_protest_1',
        type: 'protest',
        title_zh: '抗议处理结果',
        title_en: 'Protest Resolved',
        body_zh: '【演示】正赛日抗议已审结：无责，不予处罚。',
        body_en: '[Demo] Race day protest resolved: no fault, no penalty.',
        link: '/protests/demo_protest_1',
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    },
  },
  {
    id: 'publish',
    target: 'publish',
    isDone: () => {
      const c = ctx()
      return !!c && getStageResultStatus(c.raceStage, c.comp) === 'locked'
    },
    route: () => RESULTS_ROUTE,
    run: () => {
      const c = ctx()
      if (!c) return
      const locked = lockStageResults(c.raceStage, c.comp)
      if (!locked) return
      addNotification({
        id: 'ntf_demo_lock',
        type: 'results',
        title_zh: '成绩已锁定',
        title_en: 'Results Locked',
        body_zh: '【演示】流程示例赛事 - 第 1 站 正赛日成绩已锁定，积分已发放。',
        body_en: '[Demo] Flow Example Competition - Round 1 race day results locked, points awarded.',
        link: RESULTS_ROUTE,
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    },
  },
  {
    id: 'advance',
    target: 'advance',
    serverDir: 'push',
    isDone: () => {
      const c = ctx()
      if (!c?.finalStage) return false
      return c.finalStage.splits.some(sp => sp.entryList?.some(e => e.id.startsWith('ele_adv_')))
    },
    route: () => RESULTS_ROUTE,
    run: () => {
      const c = ctx()
      if (c?.finalStage) applyAdvancement(c.comp, c.round, c.finalStage)
    },
  },
  {
    id: 'done',
    isDone: () => {
      const c = ctx()
      if (!c?.finalStage) return false
      return c.finalStage.splits.some(sp => sp.entryList?.some(e => e.id.startsWith('ele_adv_')))
    },
    route: () => RESULTS_ROUTE,
  },
]

export interface FlowProgress {
  doneCount: number
  requiredCount: number
  currentIndex: number
}

export function getFlowProgress(skipped: Set<string>): FlowProgress {
  const actionable = flowSteps.filter(s => !s.optional && !!s.run)
  const requiredCount = actionable.length
  const doneCount = actionable.filter(s => s.isDone()).length
  let currentIndex = flowSteps.findIndex(s => !s.isDone() && !skipped.has(s.id))
  if (currentIndex === -1) currentIndex = flowSteps.length - 1
  return { doneCount, requiredCount, currentIndex }
}
