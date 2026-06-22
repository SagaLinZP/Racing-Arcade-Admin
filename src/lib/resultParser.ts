import type { SessionResult, Stage } from '@/data/competitions'
import { registrations } from '@/data/registrations'
import { drivers } from '@/data/drivers'
import { getPointsForPosition } from './results'
import type { ScoringTableEntry } from './utils'

export interface ParsedRow {
  position: number
  raceNumber?: number
  playerId?: string
  driverName?: string
  totalTimeMs?: number
  bestLapMs?: number
  laps?: number
  matchedDriverId?: string
  matched: boolean
}

export interface ParseResult {
  ok: boolean
  error?: 'invalidJson' | 'unrecognized' | 'empty'
  game: 'AC' | 'ACC'
  rows: ParsedRow[]
}

interface AccDriver {
  playerId?: string
  firstName?: string
  lastName?: string
}
interface AccLine {
  car?: { raceNumber?: number; drivers?: AccDriver[] }
  currentDriver?: AccDriver
  timing?: { totalTime?: number; bestLap?: number; lapCount?: number }
}
interface AccJson {
  sessionResult?: { leaderBoardLines?: AccLine[] }
}
interface AcResultRow {
  DriverGuid?: string
  DriverName?: string
  CarId?: number
  BestLap?: number
  TotalTime?: number
  Laps?: number
}
interface AcCar {
  CarId?: number
  Driver?: { Name?: string; Guid?: string }
  Skin?: string
}
interface AcJson {
  Cars?: AcCar[]
  Result?: AcResultRow[]
}

function msToLap(ms?: number): string | undefined {
  if (!ms || ms <= 0) return undefined
  const totalSec = ms / 1000
  const m = Math.floor(totalSec / 60)
  const s = (totalSec % 60).toFixed(3).padStart(6, '0')
  return `${m}:${s}`
}

function msToDuration(ms?: number): string | undefined {
  if (!ms || ms <= 0) return undefined
  const totalSec = ms / 1000
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = Math.floor(totalSec % 60)
  const milli = Math.floor(ms % 1000)
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(milli).padStart(3, '0')}`
    : `${m}:${String(s).padStart(2, '0')}.${String(milli).padStart(3, '0')}`
}

export function parseResultsJson(text: string): ParseResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: 'invalidJson', game: 'ACC', rows: [] }
  }

  const acc = data as AccJson
  if (acc?.sessionResult?.leaderBoardLines) {
    const lines = acc.sessionResult.leaderBoardLines
    const rows: ParsedRow[] = lines.map((ln, i) => {
      const car = ln.car ?? {}
      const drv = car.drivers?.[0] ?? ln.currentDriver ?? {}
      const timing = ln.timing ?? {}
      return {
        position: i + 1,
        raceNumber: car.raceNumber,
        playerId: drv.playerId,
        driverName: [drv.firstName, drv.lastName].filter(Boolean).join(' ') || undefined,
        totalTimeMs: timing.totalTime,
        bestLapMs: timing.bestLap,
        laps: timing.lapCount,
        matched: false,
      }
    })
    if (rows.length === 0) return { ok: false, error: 'empty', game: 'ACC', rows: [] }
    return { ok: true, game: 'ACC', rows }
  }

  const ac = data as AcJson
  if (Array.isArray(ac?.Result)) {
    const cars = ac.Cars ?? []
    const result = ac.Result.filter(r => r.DriverGuid || r.DriverName)
    result.sort((a, b) => (b.Laps ?? 0) - (a.Laps ?? 0) || (a.TotalTime ?? Number.MAX_SAFE_INTEGER) - (b.TotalTime ?? Number.MAX_SAFE_INTEGER))
    const rows: ParsedRow[] = result.map((r, i) => {
      const car = cars.find(c => c.CarId === r.CarId)
      return {
        position: i + 1,
        playerId: r.DriverGuid || car?.Driver?.Guid,
        driverName: r.DriverName || car?.Driver?.Name,
        totalTimeMs: r.TotalTime,
        bestLapMs: r.BestLap,
        laps: r.Laps,
        matched: false,
      }
    })
    if (rows.length === 0) return { ok: false, error: 'empty', game: 'AC', rows: [] }
    return { ok: true, game: 'AC', rows }
  }

  return { ok: false, error: 'unrecognized', game: 'ACC', rows: [] }
}

export function reconcileRows(rows: ParsedRow[], stage: Stage, splitNumber: number): ParsedRow[] {
  const split = stage.splits.find(s => s.splitNumber === splitNumber)
  const entryList = split?.entryList ?? []
  return rows.map(row => {
    let driverId: string | undefined
    if (row.playerId) {
      const reg = registrations.find(r => r.platformId === row.playerId)
      if (reg) driverId = reg.driverId
    }
    if (!driverId && row.raceNumber != null) {
      const e = entryList.find(en => en.raceNumber === row.raceNumber)
      if (e) driverId = e.driverId
    }
    if (!driverId && row.driverName) {
      const d = drivers.find(dr => dr.nickname.toLowerCase() === row.driverName!.toLowerCase())
      if (d) driverId = d.id
    }
    return { ...row, matchedDriverId: driverId, matched: !!driverId }
  })
}

export function rowsToSessionResults(
  rows: ParsedRow[],
  sessionId: string,
  splitNumber: number,
  scoringTable?: ScoringTableEntry[],
): SessionResult[] {
  const matched = rows.filter(r => r.matchedDriverId)
  const leaderMs = matched.find(r => r.position === 1)?.totalTimeMs
  return matched.map(r => {
    const driver = drivers.find(d => d.id === r.matchedDriverId)
    const finished = r.totalTimeMs != null && r.totalTimeMs > 0
    const gap = r.position === 1
      ? '-'
      : finished && leaderMs
        ? `+${((r.totalTimeMs! - leaderMs) / 1000).toFixed(3)}`
        : undefined
    return {
      position: r.position,
      driverId: r.matchedDriverId!,
      teamId: driver?.teamId,
      sessionId,
      splitNumber,
      totalTime: msToDuration(r.totalTimeMs),
      bestLap: msToLap(r.bestLapMs),
      lapsCompleted: r.laps,
      gapToLeader: gap,
      status: finished ? 'Finished' : 'DNF',
      points: finished ? getPointsForPosition(scoringTable, r.position) : 0,
    }
  })
}
