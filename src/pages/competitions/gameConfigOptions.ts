import type { SessionGameConfig } from '@/data/competitions'

export const YES_NO = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
]

export const ACC_TRACKS = [
  'monza', 'brands_hatch', 'silverstone', 'paul_ricard', 'misano',
  'nurburgring', 'spa_24h', 'barcelona', 'hungaroring', 'zandvoort',
  'mount_panorama', 'suzuka', 'slogrena', 'imola', 'indianapolis',
  'kyalami', 'watkins_glen',
].map(t => ({ value: t, label: t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }))

export const ACC_CAR_GROUPS = [
  { value: 'FreeForAll', label: 'Free For All' },
  { value: 'GT3', label: 'GT3' },
  { value: 'GT4', label: 'GT4' },
  { value: 'GTC', label: 'GTC' },
  { value: 'TCX', label: 'TCX' },
]

export const FORMATION_LAP_TYPES = [
  { value: '0', label: 'Old Style' },
  { value: '1', label: 'Free (no limit)' },
  { value: '2', label: 'Free (with limit)' },
  { value: '3', label: 'Position Control / Short' },
]

export const TRACK_MEDALS = [
  { value: '-1', label: 'No Requirement' },
  { value: '0', label: '0' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
]

export const TC_ABS_OPTIONS = [
  { value: '0', label: 'Off' },
  { value: '1', label: 'Factory' },
  { value: '2', label: 'On' },
]

export const START_RULE_OPTIONS = [
  { value: '0', label: 'Grid (default)' },
  { value: '1', label: 'Fast Rolling' },
  { value: '2', label: 'Standing' },
]

export const SIMRACER_WEATHER_OPTIONS = [
  { value: '0', label: 'Real' },
  { value: '1', label: 'Fixed (1x)' },
  { value: '2', label: 'Fixed (custom)' },
]

export const QUALIFY_STANDING_OPTIONS = [
  { value: '1', label: 'Fastest Lap' },
  { value: '2', label: 'Average Lap' },
  { value: '3', label: 'Total Time' },
]

export const IS_OPEN_OPTIONS = [
  { value: '0', label: 'No' },
  { value: '1', label: 'Yes' },
  { value: '2', label: 'Yes + Rejoins' },
]

export const LAN_DISCOVERY_OPTIONS = [
  { value: '0', label: 'No' },
  { value: '1', label: 'Yes' },
]

export const BLACKLIST_MODE_OPTIONS = [
  { value: '0', label: 'Off' },
  { value: '1', label: 'On' },
]

export const YES_NO_INT = [
  { value: '0', label: 'No' },
  { value: '1', label: 'Yes' },
]

export const SESSION_TYPE_OPTIONS_T = (t: (k: string) => string) => [
  { value: 'practice', label: t('competition.sessionTypePractice') },
  { value: 'qualifying', label: t('competition.sessionTypeQualifying') },
  { value: 'race', label: t('competition.sessionTypeRace') },
]

export type GameConfigKey = keyof SessionGameConfig
