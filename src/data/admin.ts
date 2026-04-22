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

export interface DashboardStats {
  totalUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  totalEvents: number
  weeklyEvents: number
  avgRegistrations: number
  participationRate: number
  userGrowth: Array<{ date: string; count: number }>
  registrationTrends: Array<{ date: string; count: number }>
  gameDistribution: Array<{ game: string; count: number }>
  regionDistribution: Array<{ region: string; users: number; events: number }>
  completionRate: number
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

export const dashboardStats: DashboardStats = {
  totalUsers: 2847,
  newUsersToday: 23,
  newUsersThisWeek: 156,
  newUsersThisMonth: 612,
  totalEvents: 45,
  weeklyEvents: 8,
  avgRegistrations: 18.5,
  participationRate: 0.74,
  userGrowth: [
    { date: '2026-03-01', count: 1800 },
    { date: '2026-03-08', count: 1950 },
    { date: '2026-03-15', count: 2100 },
    { date: '2026-03-22', count: 2280 },
    { date: '2026-03-29', count: 2350 },
    { date: '2026-04-05', count: 2500 },
    { date: '2026-04-12', count: 2650 },
    { date: '2026-04-19', count: 2847 },
  ],
  registrationTrends: [
    { date: '2026-03-01', count: 120 },
    { date: '2026-03-08', count: 145 },
    { date: '2026-03-15', count: 132 },
    { date: '2026-03-22', count: 168 },
    { date: '2026-03-29', count: 155 },
    { date: '2026-04-05', count: 180 },
    { date: '2026-04-12', count: 195 },
    { date: '2026-04-19', count: 210 },
  ],
  gameDistribution: [
    { game: 'ACC', count: 18 },
    { game: 'iRacing', count: 8 },
    { game: 'LMU', count: 6 },
    { game: 'AC Evo', count: 5 },
    { game: 'rF2', count: 4 },
    { game: 'ETS2', count: 2 },
    { game: 'AC', count: 2 },
  ],
  regionDistribution: [
    { region: 'CN', users: 820, events: 12 },
    { region: 'AP', users: 680, events: 10 },
    { region: 'AM', users: 750, events: 11 },
    { region: 'EU', users: 597, events: 12 },
  ],
  completionRate: 0.89,
}

export interface EventTemplate {
  id: string
  name: string
  description: string
  game: string
  carClass: string
  raceDuration: number
  raceDurationType: 'time' | 'laps'
  maxEntriesPerSplit: number
  enableMultiSplit: boolean
  hasPitstop: boolean
  scoringTable: Array<{ position: number; points: number }>
  createdAt: string
}

export const eventTemplates: EventTemplate[] = [
  {
    id: 'tpl1',
    name: 'GT3 Sprint (60min)',
    description: 'Standard GT3 sprint race template',
    game: 'ACC',
    carClass: 'GT3',
    raceDuration: 60,
    raceDurationType: 'time',
    maxEntriesPerSplit: 30,
    enableMultiSplit: true,
    hasPitstop: true,
    scoringTable: [
      { position: 1, points: 25 },
      { position: 2, points: 18 },
      { position: 3, points: 15 },
      { position: 4, points: 12 },
      { position: 5, points: 10 },
    ],
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'tpl2',
    name: 'GT4 Sprint (30min)',
    description: 'Standard GT4 sprint race template',
    game: 'ACC',
    carClass: 'GT4',
    raceDuration: 30,
    raceDurationType: 'time',
    maxEntriesPerSplit: 25,
    enableMultiSplit: false,
    hasPitstop: false,
    scoringTable: [
      { position: 1, points: 12 },
      { position: 2, points: 10 },
      { position: 3, points: 8 },
    ],
    createdAt: '2026-03-15T10:00:00Z',
  },
  {
    id: 'tpl3',
    name: 'Endurance (120min)',
    description: 'Endurance race template with mandatory pit stop',
    game: 'ACC',
    carClass: 'GT3',
    raceDuration: 120,
    raceDurationType: 'time',
    maxEntriesPerSplit: 30,
    enableMultiSplit: true,
    hasPitstop: true,
    scoringTable: [
      { position: 1, points: 50 },
      { position: 2, points: 36 },
      { position: 3, points: 30 },
    ],
    createdAt: '2026-02-20T10:00:00Z',
  },
  {
    id: 'tpl4',
    name: 'Formula Sprint (15 laps)',
    description: 'Formula sprint race template',
    game: 'iRacing',
    carClass: 'Formula',
    raceDuration: 15,
    raceDurationType: 'laps',
    maxEntriesPerSplit: 20,
    enableMultiSplit: false,
    hasPitstop: false,
    scoringTable: [
      { position: 1, points: 25 },
      { position: 2, points: 18 },
      { position: 3, points: 15 },
    ],
    createdAt: '2026-04-01T10:00:00Z',
  },
]

export interface ResultChangeLog {
  id: string
  resultId: string
  eventId: string
  field: string
  oldValue: string
  newValue: string
  changedBy: string
  changedAt: string
  reason: string
}

export const resultChangeLogs: ResultChangeLog[] = [
  {
    id: 'cl1',
    resultId: 'r_e4_8',
    eventId: 'e4',
    field: 'position',
    oldValue: '8',
    newValue: '7',
    changedBy: 'admin1',
    changedAt: '2026-04-17T10:00:00Z',
    reason: 'Protest ruling: 5-second time penalty applied to original P7 driver',
  },
  {
    id: 'cl2',
    resultId: 'r_e12_21',
    eventId: 'e12',
    field: 'status',
    oldValue: 'Finished',
    newValue: 'DSQ',
    changedBy: 'admin1',
    changedAt: '2026-03-23T14:00:00Z',
    reason: 'Protest ruling: Disqualified for repeated blocking',
  },
]
