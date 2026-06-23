import { registerSlice, bump } from './store'
import { competitions } from './competitions'
import { drivers } from './drivers'

export type RegistrationStatus = 'approved' | 'rejected' | 'waitlisted' | 'withdrawn'
export type PaymentStatus = 'none' | 'unpaid' | 'paid' | 'refunded'

export interface Registration {
  id: string
  competitionId: string
  roundId: string
  driverId: string
  platformId: string
  preferredNumber?: number
  teamId?: string
  status: RegistrationStatus
  paymentStatus: PaymentStatus
  splitNumber?: number
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  note?: string
}

let regSeq = 1
function mockGuid(): string {
  return '7656119' + String(8100000000 + regSeq)
}

function seedRegistrations(): Registration[] {
  const out: Registration[] = []
  for (const comp of competitions) {
    for (const round of comp.rounds) {
      const approvedIds = round.registeredDriverIds ?? []
      approvedIds.forEach((driverId, i) => {
        const d = drivers.find(x => x.id === driverId)
        out.push({
          id: `reg_${regSeq}`,
          competitionId: comp.id,
          roundId: round.id,
          driverId,
          platformId: mockGuid(),
          preferredNumber: 11 + i,
          teamId: d?.teamId,
          status: 'approved',
          paymentStatus: 'paid',
          submittedAt: round.registrationOpenAt,
          reviewedAt: round.registrationOpenAt,
          reviewedBy: 'admin1',
        })
        regSeq++
      })
      const others = drivers.filter(d => !approvedIds.includes(d.id)).slice(0, 3)
      others.forEach((d, i) => {
        const status: RegistrationStatus = i === 2 ? 'waitlisted' : 'approved'
        out.push({
          id: `reg_${regSeq}`,
          competitionId: comp.id,
          roundId: round.id,
          driverId: d.id,
          platformId: mockGuid(),
          preferredNumber: 51 + i,
          teamId: d.teamId,
          status,
          paymentStatus: status === 'waitlisted' ? 'none' : 'unpaid',
          submittedAt: round.registrationOpenAt,
        })
        regSeq++
      })
    }
  }
  return out
}

export const registrations: Registration[] = seedRegistrations()

registerSlice({
  key: 'registrations',
  get: () => registrations as unknown as Record<string, unknown>[],
  replace: (rows) => {
    registrations.length = 0
    registrations.push(...(rows as unknown as Registration[]))
  },
})

export function addRegistration(r: Registration) {
  registrations.push(r)
  bump()
}

export function updateRegistration(updated: Registration) {
  const idx = registrations.findIndex(r => r.id === updated.id)
  if (idx >= 0) registrations[idx] = updated
  bump()
}

export function setRegistrationStatus(id: string, status: RegistrationStatus, reviewedBy = 'admin1') {
  const r = registrations.find(x => x.id === id)
  if (r) {
    r.status = status
    r.reviewedAt = new Date().toISOString()
    r.reviewedBy = reviewedBy
    bump()
  }
}

export function setPaymentStatus(id: string, paymentStatus: PaymentStatus) {
  const r = registrations.find(x => x.id === id)
  if (r) {
    r.paymentStatus = paymentStatus
    bump()
  }
}

export function assignSplit(id: string, splitNumber: number | undefined) {
  const r = registrations.find(x => x.id === id)
  if (r) {
    r.splitNumber = splitNumber
    bump()
  }
}

export function getRoundRegistrations(roundId: string): Registration[] {
  return registrations.filter(r => r.roundId === roundId)
}

export function getApprovedDriverIds(roundId: string): string[] {
  return registrations
    .filter(r => r.roundId === roundId && r.status === 'approved')
    .map(r => r.driverId)
}

export function countRoundRegistrations(roundId: string, status?: RegistrationStatus): number {
  return registrations.filter(r => r.roundId === roundId && (!status || r.status === status)).length
}

export function createDefaultRegistration(competitionId: string, roundId: string, driverId: string): Registration {
  return {
    id: `reg_${Date.now()}`,
    competitionId,
    roundId,
    driverId,
    platformId: '',
    status: 'approved',
    paymentStatus: 'unpaid',
    submittedAt: new Date().toISOString(),
  }
}
