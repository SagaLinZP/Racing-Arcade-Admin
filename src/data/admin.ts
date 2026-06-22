import { registerSlice, bump } from './store'

export interface BanRecord {
  id: string
  userId: string
  type: 'warning' | 'temporary' | 'permanent' | 'race'
  reason_zh: string
  reason_en: string
  startDate: string
  endDate?: string
  issuedBy: string
  status: 'active' | 'expired' | 'revoked'
}

export const banRecords: BanRecord[] = [
  {
    id: 'b1',
    userId: 'd5',
    type: 'warning',
    reason_zh: '多次危险驾驶',
    reason_en: 'Repeated dangerous driving',
    startDate: '2026-04-10T12:00:00Z',
    issuedBy: 'admin1',
    status: 'expired',
  },
  {
    id: 'b2',
    userId: 'd21',
    type: 'race',
    reason_zh: '故意阻挡其他车手，被处罚赛事禁赛2场',
    reason_en: 'Intentional blocking of other drivers, banned from 2 races',
    startDate: '2026-03-24T16:00:00Z',
    endDate: '2026-04-24T16:00:00Z',
    issuedBy: 'admin1',
    status: 'active',
  },
  {
    id: 'b3',
    userId: 'd16',
    type: 'temporary',
    reason_zh: '填写不合规信息，禁止使用平台7天',
    reason_en: 'Inappropriate profile information, banned for 7 days',
    startDate: '2026-04-15T08:00:00Z',
    endDate: '2026-04-22T08:00:00Z',
    issuedBy: 'admin1',
    status: 'active',
  },
]

export interface AuditLog {
  id: string
  competitionId: string
  stageId: string
  sessionId?: string
  driverId: string
  field: string
  oldValue: string
  newValue: string
  changedBy: string
  changedAt: string
  reason: string
  protestId?: string
}

export const auditLogs: AuditLog[] = []

registerSlice({
  key: 'banRecords',
  get: () => banRecords as unknown as Record<string, unknown>[],
  replace: (rows) => {
    banRecords.length = 0
    banRecords.push(...(rows as unknown as BanRecord[]))
  },
})

registerSlice({
  key: 'auditLogs',
  get: () => auditLogs as unknown as Record<string, unknown>[],
  replace: (rows) => {
    auditLogs.length = 0
    auditLogs.push(...(rows as unknown as AuditLog[]))
  },
})

export function addBanRecord(b: BanRecord) {
  banRecords.push(b)
  bump()
}

export function addAuditLog(log: AuditLog) {
  auditLogs.unshift(log)
  bump()
}
