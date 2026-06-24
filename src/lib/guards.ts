import type { Competition, Round, Stage } from '@/data/competitions'
import { getRoundStatus, getCompetitionStatus } from './utils'
import { isStageServerRunning } from './stageOps'

/**
 * 编辑锁守卫（硬拦截）。被锁字段在 UI 上禁用、提交即拒绝。
 * 详见《赛事状态流转设计》§4 字段编辑锁矩阵。
 */

/** 身份/规则（游戏、车型组、赛区、积分表、准入、锁定窗口）：报名一开放即锁定。 */
export function canEditIdentity(comp: Competition): boolean {
  if (comp.statusOverride === 'Draft') return true
  if (comp.rounds.length === 0) return true
  return comp.rounds.every(r => {
    const s = getRoundStatus(r, comp)
    return s === 'Upcoming' || s === 'Cancelled'
  })
}

/** 参赛资格来源：报名截止起锁定（仅 Upcoming / 报名开放 / 已取消 可改）。 */
export function canEditEligibility(round: Round): boolean {
  const s = getRoundStatus(round)
  return s === 'Upcoming' || s === 'RegistrationOpen' || s === 'Cancelled'
}

/** 已开赛的 Stage：开始时间锁定（结束时间仍可改）。 */
export function isStageStarted(stage: Stage): boolean {
  return Date.now() >= new Date(stage.startsAt).getTime()
}

/** 报名时间（开放/截止/取消截止/人数上限）：任一 Stage 开赛即锁定。 */
export function canEditRegistrationWindow(round: Round): boolean {
  if (round.cancelledReason_zh || round.cancelledReason_en) return false
  return !round.stages.some(isStageStarted)
}

/** 服务器配置（Split 字段、gameConfig、sessions）：已开服或 Stage 已结束（公示/锁定）即锁定。 */
export function isServerConfigLocked(stage: Stage): boolean {
  if (isStageServerRunning(stage)) return true
  return Date.now() >= new Date(stage.endsAt).getTime()
}

/** 参赛名单：Stage 一开赛即锁定（报名截止到开赛前可应用/微调）。 */
export function isEntryListLocked(round: Round): boolean {
  return round.stages.some(isStageStarted)
}

/** 删除赛事：仅草稿（Draft）可删除，其余改用取消。 */
export function canDeleteCompetition(comp: Competition): boolean {
  return getCompetitionStatus(comp) === 'Draft'
}

/** 取消赛事：成绩公示/锁定（聚合 Completed）、已存档或已取消后不可取消。 */
export function canCancelCompetition(comp: Competition): boolean {
  const s = getCompetitionStatus(comp)
  return s !== 'Completed' && s !== 'Archived' && s !== 'Cancelled'
}

/** 存档/结束赛事（管理员手动）：除已取消外均可存档或撤销存档。 */
export function canArchiveCompetition(comp: Competition): boolean {
  return getCompetitionStatus(comp) !== 'Cancelled'
}
