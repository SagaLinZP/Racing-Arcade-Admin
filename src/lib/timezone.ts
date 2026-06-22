export interface TimezoneOption {
  value: string
  label_zh: string
  label_en: string
  offsetMinutes: number
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: 'UTC+8', label_zh: '中国区 (UTC+8)', label_en: 'China (UTC+8)', offsetMinutes: 480 },
  { value: 'UTC+9', label_zh: '亚太区 (UTC+9)', label_en: 'Asia Pacific (UTC+9)', offsetMinutes: 540 },
  { value: 'UTC+1', label_zh: '欧洲区 (UTC+1)', label_en: 'Europe (UTC+1)', offsetMinutes: 60 },
  { value: 'UTC-5', label_zh: '美洲区 (UTC-5)', label_en: 'Americas (UTC-5)', offsetMinutes: -300 },
]

export const DEFAULT_TIMEZONE = 'UTC+8'

export function getTimezoneOption(tz?: string): TimezoneOption {
  return TIMEZONE_OPTIONS.find(o => o.value === tz) ?? TIMEZONE_OPTIONS[0]
}

export function tzOffsetMinutes(tz?: string): number {
  return getTimezoneOption(tz).offsetMinutes
}

export function tzShortLabel(tz?: string): string {
  return getTimezoneOption(tz).value
}

export function tzSelectOptions(lang: string): { value: string; label: string }[] {
  return TIMEZONE_OPTIONS.map(o => ({ value: o.value, label: lang === 'zh' ? o.label_zh : o.label_en }))
}

/** UTC ISO → `YYYY-MM-DDTHH:mm` wall-clock string in the given timezone (for datetime-local inputs). */
export function isoToLocalInput(iso: string | undefined, tz?: string): string {
  if (!iso) return ''
  const offset = tzOffsetMinutes(tz)
  const shifted = new Date(new Date(iso).getTime() + offset * 60000)
  return shifted.toISOString().slice(0, 16)
}

/** `YYYY-MM-DDTHH:mm` wall-clock string in the given timezone → UTC ISO. */
export function localInputToIso(local: string, tz?: string): string {
  if (!local) return ''
  const offset = tzOffsetMinutes(tz)
  const asUtc = Date.parse(local.length === 16 ? `${local}:00Z` : `${local}Z`)
  return new Date(asUtc - offset * 60000).toISOString()
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Format a UTC ISO as wall-clock in tz with a `(UTC±X)` suffix. */
export function formatDateTimeTz(iso: string | undefined, tz?: string, withSuffix = true): string {
  if (!iso) return '—'
  const offset = tzOffsetMinutes(tz)
  const d = new Date(new Date(iso).getTime() + offset * 60000)
  const body = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
  return withSuffix ? `${body} (${tzShortLabel(tz)})` : body
}

/** Format a UTC ISO as a date-only wall-clock in tz with a `(UTC±X)` suffix. */
export function formatDateTz(iso: string | undefined, tz?: string, withSuffix = true): string {
  if (!iso) return '—'
  const offset = tzOffsetMinutes(tz)
  const d = new Date(new Date(iso).getTime() + offset * 60000)
  const body = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
  return withSuffix ? `${body} (${tzShortLabel(tz)})` : body
}
