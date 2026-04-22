export interface Team {
  id: string
  name: string
  logo: string
  description: string
  region: 'CN' | 'AP' | 'AM' | 'EU'
  captainId: string
  members: Array<{ userId: string; role: 'captain' | 'member'; joinedAt: string }>
  totalEntries: number
  bestResult: number
  totalPoints: number
}

export const teams: Team[] = [
  {
    id: 't1',
    name: 'Dragon Racing',
    logo: '',
    description: 'Asia-based racing team focused on GT3 competition.',
    region: 'AP',
    captainId: 'd1',
    members: [
      { userId: 'd1', role: 'captain', joinedAt: '2026-01-01T00:00:00Z' },
      { userId: 'd2', role: 'member', joinedAt: '2026-01-15T00:00:00Z' },
      { userId: 'd11', role: 'member', joinedAt: '2026-02-10T00:00:00Z' },
    ],
    totalEntries: 18,
    bestResult: 1,
    totalPoints: 520,
  },
  {
    id: 't2',
    name: 'Apex Velocity',
    logo: '',
    description: 'Trans-Atlantic racing team competing in multiple series.',
    region: 'AM',
    captainId: 'd3',
    members: [
      { userId: 'd3', role: 'captain', joinedAt: '2026-01-05T00:00:00Z' },
      { userId: 'd4', role: 'member', joinedAt: '2026-02-01T00:00:00Z' },
      { userId: 'd15', role: 'member', joinedAt: '2026-02-15T00:00:00Z' },
    ],
    totalEntries: 24,
    bestResult: 1,
    totalPoints: 780,
  },
  {
    id: 't3',
    name: 'Thunder Squad',
    logo: '',
    description: 'Pacific racing team with diverse experience.',
    region: 'AP',
    captainId: 'd6',
    members: [
      { userId: 'd6', role: 'captain', joinedAt: '2026-01-10T00:00:00Z' },
      { userId: 'd7', role: 'member', joinedAt: '2026-02-05T00:00:00Z' },
      { userId: 'd13', role: 'member', joinedAt: '2026-03-01T00:00:00Z' },
    ],
    totalEntries: 15,
    bestResult: 3,
    totalPoints: 380,
  },
  {
    id: 't4',
    name: 'Continental Racing',
    logo: '',
    description: 'European racing powerhouse.',
    region: 'EU',
    captainId: 'd8',
    members: [
      { userId: 'd8', role: 'captain', joinedAt: '2026-01-01T00:00:00Z' },
      { userId: 'd10', role: 'member', joinedAt: '2026-01-20T00:00:00Z' },
      { userId: 'd14', role: 'member', joinedAt: '2026-02-01T00:00:00Z' },
    ],
    totalEntries: 30,
    bestResult: 1,
    totalPoints: 1150,
  },
  {
    id: 't5',
    name: 'Euro Thunder',
    logo: '',
    description: 'European multi-discipline racing team with a passion for endurance.',
    region: 'EU',
    captainId: 'd17',
    members: [
      { userId: 'd17', role: 'captain', joinedAt: '2026-01-08T00:00:00Z' },
      { userId: 'd18', role: 'member', joinedAt: '2026-02-20T00:00:00Z' },
      { userId: 'd24', role: 'member', joinedAt: '2026-03-05T00:00:00Z' },
    ],
    totalEntries: 20,
    bestResult: 1,
    totalPoints: 680,
  },
  {
    id: 't6',
    name: 'Global Titans',
    logo: '',
    description: 'International racing team with drivers from multiple continents.',
    region: 'EU',
    captainId: 'd21',
    members: [
      { userId: 'd21', role: 'captain', joinedAt: '2026-01-12T00:00:00Z' },
      { userId: 'd22', role: 'member', joinedAt: '2026-02-08T00:00:00Z' },
      { userId: 'd25', role: 'member', joinedAt: '2026-03-10T00:00:00Z' },
    ],
    totalEntries: 28,
    bestResult: 1,
    totalPoints: 920,
  },
]
