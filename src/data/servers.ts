import { registerSlice, bump } from './store'
import type { Split, SessionGameConfig } from './competitions'

export interface ServerLog {
  time: string
  message: string
}

export interface ServerInstance {
  splitId: string
  stageId: string
  serverName?: string
  status: 'stopped' | 'running' | 'error'
  startedAt?: string
  onlineCount?: number
  logs: ServerLog[]
}

export const serverInstances: ServerInstance[] = []

registerSlice({
  key: 'serverInstances',
  get: () => serverInstances as unknown as Record<string, unknown>[],
  replace: (rows) => {
    serverInstances.length = 0
    serverInstances.push(...(rows as unknown as ServerInstance[]))
  },
})

function buildLogs(serverName: string, gameConfig?: SessionGameConfig): ServerLog[] {
  const t0 = Date.now()
  const at = (offset: number) => new Date(t0 + offset).toISOString()
  return [
    { time: at(0), message: `Server '${serverName}' starting...` },
    { time: at(800), message: `Loading track: ${gameConfig?.track ?? 'n/a'}` },
    { time: at(1500), message: 'Entry list loaded' },
    { time: at(2200), message: 'Registered to lobby' },
    { time: at(3000), message: 'Server online, waiting for clients' },
  ]
}

export function getServerInstance(splitId: string): ServerInstance | undefined {
  return serverInstances.find(s => s.splitId === splitId)
}

export function startServer(stageId: string, split: Split, gameConfig?: SessionGameConfig) {
  const logs = buildLogs(split.serverName ?? `Split ${split.splitNumber}`, gameConfig)
  const existing = serverInstances.find(s => s.splitId === split.id)
  const next: ServerInstance = {
    splitId: split.id,
    stageId,
    serverName: split.serverName,
    status: 'running',
    startedAt: new Date().toISOString(),
    onlineCount: split.entryList?.length ?? 0,
    logs,
  }
  if (existing) Object.assign(existing, next)
  else serverInstances.push(next)
  bump()
}

export function stopServer(splitId: string) {
  const inst = serverInstances.find(s => s.splitId === splitId)
  if (inst) {
    inst.status = 'stopped'
    inst.onlineCount = 0
    inst.logs = [...inst.logs, { time: new Date().toISOString(), message: 'Server stopped' }]
    bump()
  }
}
