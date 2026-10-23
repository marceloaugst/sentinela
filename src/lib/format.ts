const NUMBER = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const DATE_TIME = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })
const TIME = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const DAY_TIME = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

/** Bytes em unidades binárias (1 KB = 1024 B). */
export function formatBytes(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  let v = Math.abs(value)
  let i = 0
  while (v >= 1024 && i < BYTE_UNITS.length - 1) {
    v /= 1024
    i++
  }
  return `${NUMBER.format(value < 0 ? -v : v)} ${BYTE_UNITS[i]}`
}

/** Taxa de transferência (bytes por segundo → "x MB/s"). Diferente de volume acumulado. */
export function formatRate(bytesPerSec: number | null | undefined): string {
  if (bytesPerSec == null || !Number.isFinite(bytesPerSec)) return '—'
  return `${formatBytes(bytesPerSec)}/s`
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(value)}%`
}

export function formatNumber(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits }).format(value)
}

export function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || !Number.isFinite(totalSeconds)) return '—'
  const s = Math.max(0, Math.floor(totalSeconds))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}min`
  if (m > 0) return `${m}min`
  return `${s}s`
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : DATE_TIME.format(d)
}

export function formatClock(iso: string | number | Date | null | undefined): string {
  if (iso == null) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : TIME.format(d)
}

export function formatDayTime(iso: string | number | Date): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : DAY_TIME.format(d)
}

const RTF = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

/** "há 5 minutos". `now` é injetável para facilitar testes. */
export function formatRelative(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return 'Nunca'
  const diff = (new Date(iso).getTime() - now) / 1000
  if (Number.isNaN(diff)) return '—'
  const abs = Math.abs(diff)
  if (abs < 45) return 'agora há pouco'
  if (abs < 3600) return RTF.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return RTF.format(Math.round(diff / 3600), 'hour')
  return RTF.format(Math.round(diff / 86400), 'day')
}
