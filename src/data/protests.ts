import { registerSlice, bump } from './store'
import { competitions } from './competitions'

export interface ProtestResolution {
  decision: 'violation' | 'noFault'
  penaltyType?: string
  penaltySeconds?: number
  pointsDeduction?: number
  positionDrop?: number
  dsq?: boolean
  reason: string
  appliedAt?: string
  reviewedBy?: string
}

export interface Protest {
  id: string
  competitionId: string
  roundId: string
  stageId: string
  sessionId?: string
  reporterId: string
  reportedId: string
  type: 'dangerous' | 'blocking' | 'other'
  description: string
  evidenceUrls: string[]
  lapNumber?: number
  location?: string
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
  createdAt: string
  deadline: string
  resolution?: ProtestResolution
}

type ProtestTemplate = Pick<Protest, 'type' | 'description' | 'evidenceUrls' | 'lapNumber' | 'location' | 'status' | 'resolution'>

const templates: ProtestTemplate[] = [
  {
    type: 'dangerous',
    description: 'Lap 12 at Eau Rouge, the reported car made an unsafe rejoin after going off track, causing contact.',
    evidenceUrls: ['https://youtu.be/example1'],
    lapNumber: 12,
    location: 'Eau Rouge',
    status: 'resolved',
    resolution: { decision: 'violation', penaltyType: 'timePenalty', penaltySeconds: 5, reason: 'Unsafe rejoin after off-track excursion. Failed to check for oncoming traffic.', reviewedBy: 'admin1' },
  },
  {
    type: 'blocking',
    description: 'Multiple blocking attempts on the straight during laps 30-35.',
    evidenceUrls: [],
    lapNumber: 30,
    location: 'Kemmel Straight',
    status: 'pending',
  },
  {
    type: 'dangerous',
    description: 'Lap 18, contact under braking causing a multi-car incident. Driver rejoined without checking.',
    evidenceUrls: ['https://youtu.be/example3a', 'https://youtu.be/example3b'],
    lapNumber: 18,
    location: 'Turn 10',
    status: 'reviewing',
  },
  {
    type: 'blocking',
    description: 'Erratic blocking on the main straight during laps 24-26. Repeated direction changes under braking.',
    evidenceUrls: ['https://youtu.be/example4'],
    lapNumber: 24,
    location: 'Start/Finish Straight',
    status: 'resolved',
    resolution: { decision: 'violation', penaltyType: 'positionDrop', positionDrop: 3, reason: 'Repeated blocking maneuvers under braking zone.', reviewedBy: 'admin1' },
  },
]

function seedProtests(): Protest[] {
  const targets: Array<{ competitionId: string; roundId: string; stageId: string; sessionId?: string; driverIds: string[] }> = []
  for (const comp of competitions) {
    for (const round of comp.rounds) {
      for (const stage of round.stages) {
        const sp = stage.splits.find(s => s.results && s.results.length >= 2)
        if (sp && sp.results) {
          targets.push({
            competitionId: comp.id,
            roundId: round.id,
            stageId: stage.id,
            sessionId: sp.results[0].sessionId,
            driverIds: sp.results.map(r => r.driverId),
          })
        }
      }
    }
  }
  return templates.map((tpl, i) => {
    const tg = targets.length > 0 ? targets[i % targets.length] : undefined
    const driverIds = tg?.driverIds ?? []
    return {
      id: `p${i + 1}`,
      competitionId: tg?.competitionId ?? '',
      roundId: tg?.roundId ?? '',
      stageId: tg?.stageId ?? '',
      sessionId: tg?.sessionId,
      reporterId: driverIds[1] ?? driverIds[0] ?? 'd1',
      reportedId: driverIds[0] ?? 'd2',
      type: tpl.type,
      description: tpl.description,
      evidenceUrls: tpl.evidenceUrls,
      lapNumber: tpl.lapNumber,
      location: tpl.location,
      status: tpl.status,
      createdAt: '2026-04-16T19:00:00Z',
      deadline: '2026-04-18T19:00:00Z',
      resolution: tpl.resolution,
    }
  })
}

export const protests: Protest[] = seedProtests()

registerSlice({
  key: 'protests',
  get: () => protests as unknown as Record<string, unknown>[],
  replace: (rows) => {
    protests.length = 0
    protests.push(...(rows as unknown as Protest[]))
  },
})

export function updateProtest(updated: Protest) {
  const idx = protests.findIndex(p => p.id === updated.id)
  if (idx >= 0) protests[idx] = updated
  bump()
}
