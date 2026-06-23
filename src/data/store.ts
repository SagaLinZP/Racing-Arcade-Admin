import { useSyncExternalStore } from 'react'

type AnyRow = Record<string, unknown>

interface Slice {
  key: string
  get: () => AnyRow[]
  replace: (rows: AnyRow[]) => void
}

const LS_KEY = 'racing-arcade-state-v2'
const slices: Slice[] = []
let version = 0
const listeners = new Set<() => void>()

export function registerSlice(slice: Slice) {
  slices.push(slice)
}

export function persist() {
  try {
    const data: Record<string, AnyRow[]> = {}
    for (const s of slices) data[s.key] = s.get()
    localStorage.setItem(LS_KEY, JSON.stringify(data))
  } catch {
    return
  }
}

export function hydrate() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return
    const data = JSON.parse(raw) as Record<string, AnyRow[]>
    for (const s of slices) {
      const rows = data[s.key]
      if (Array.isArray(rows)) s.replace(rows)
    }
  } catch {
    return
  }
}

export function bump() {
  version += 1
  persist()
  for (const l of listeners) l()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return version
}

export function useDataVersion() {
  return useSyncExternalStore(subscribe, getSnapshot)
}

export function resetStore() {
  try {
    localStorage.removeItem(LS_KEY)
  } catch {
    return
  }
}
