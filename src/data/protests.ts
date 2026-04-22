export interface Protest {
  id: string
  eventId: string
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
  resolution?: {
    decision: string
    penalty?: string
    reason: string
  }
}

export const protests: Protest[] = [
  {
    id: 'p1',
    eventId: 'e4',
    reporterId: 'd1',
    reportedId: 'd3',
    type: 'dangerous',
    description: 'Lap 12 at Eau Rouge, car #3 made an unsafe rejoin after going off track, causing contact with my car.',
    evidenceUrls: ['https://youtu.be/example1'],
    lapNumber: 12,
    location: 'Eau Rouge',
    status: 'resolved',
    createdAt: '2026-04-16T19:00:00Z',
    deadline: '2026-04-18T19:00:00Z',
    resolution: {
      decision: 'violation',
      penalty: '5-second time penalty applied',
      reason: 'Unsafe rejoin after off-track excursion. Car #3 failed to check for oncoming traffic.',
    },
  },
  {
    id: 'p2',
    eventId: 'e4',
    reporterId: 'd10',
    reportedId: 'd1',
    type: 'blocking',
    description: 'Multiple blocking attempts on the straight between turns 1 and 2 during laps 30-35.',
    evidenceUrls: [],
    lapNumber: 30,
    location: 'Kemmel Straight',
    status: 'pending',
    createdAt: '2026-04-16T20:30:00Z',
    deadline: '2026-04-18T20:30:00Z',
  },
  {
    id: 'p3',
    eventId: 'e9',
    reporterId: 'd5',
    reportedId: 'd16',
    type: 'dangerous',
    description: 'Lap 18 at Turn 10, car made contact under braking causing a multi-car incident. Driver rejoined without checking.',
    evidenceUrls: ['https://youtu.be/example3a', 'https://youtu.be/example3b'],
    lapNumber: 18,
    location: 'Turn 10 (Camp de Tiro)',
    status: 'reviewing',
    createdAt: '2026-04-05T21:00:00Z',
    deadline: '2026-04-07T21:00:00Z',
  },
  {
    id: 'p4',
    eventId: 'e12',
    reporterId: 'd9',
    reportedId: 'd21',
    type: 'blocking',
    description: 'Erratic blocking on the main straight during laps 24-26. Car repeatedly changed line under braking.',
    evidenceUrls: ['https://youtu.be/example4'],
    lapNumber: 24,
    location: 'Start/Ziel Gerade',
    status: 'resolved',
    createdAt: '2026-03-22T20:00:00Z',
    deadline: '2026-03-24T20:00:00Z',
    resolution: {
      decision: 'violation',
      penalty: '10-second time penalty applied, 1 championship penalty point',
      reason: 'Repeated blocking maneuvers under braking zone. Car changed direction more than once on the straight.',
    },
  },
]
