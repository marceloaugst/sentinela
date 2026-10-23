import type { LogRow, LogSeverity, LogSource, LogStats } from '@/types/api'

export const SOURCE_LABEL: Record<LogSource, string> = { nginx: 'nginx', fail2ban: 'fail2ban', firewall: 'Firewall' }

/** Cores por fonte, iguais na lista, nos cards e nos gráficos. */
export const SOURCE_COLOR: Record<LogSource, string> = { nginx: 'var(--chart-1)', fail2ban: 'var(--chart-3)', firewall: 'var(--danger)' }

/** Vocabulário fechado de tipos por fonte (`access_summary` não é linha de log). */
export const TYPES_BY_SOURCE: Record<LogSource, string[]> = {
  nginx: ['access', 'error'],
  fail2ban: ['found', 'ban', 'unban', 'already_banned'],
  firewall: ['block', 'allow', 'limit'],
}

export const ALL_TYPES = Object.values(TYPES_BY_SOURCE).flat()

export const SEVERITIES: { value: LogSeverity; label: string }[] = [
  { value: 'debug', label: 'Debug' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Atenção' },
  { value: 'error', label: 'Erro' },
  { value: 'critical', label: 'Crítico' },
]

export const SEVERITY_LABEL = Object.fromEntries(SEVERITIES.map((s) => [s.value, s.label])) as Record<LogSeverity, string>

export const SEVERITY_VARIANT: Record<LogSeverity, 'neutral' | 'default' | 'warning' | 'danger'> = {
  debug: 'neutral',
  info: 'default',
  warning: 'warning',
  error: 'danger',
  critical: 'danger',
}

/** Coluna "Mensagem". Sempre devolve texto: o React escapa, nunca injete como HTML. */
export function summarize(l: LogRow): string {
  const f = l.fields ?? {}
  switch (`${l.source}/${l.type}`) {
    case 'nginx/access':
      return `${f.method ?? ''} ${f.path ?? ''} → ${l.status ?? ''}`.trim()
    case 'nginx/error':
      return f.message ?? l.raw ?? ''
    case 'fail2ban/ban':
      return `Ban de ${l.ip} (jail ${f.jail})`
    case 'fail2ban/unban':
      return `Unban de ${l.ip} (jail ${f.jail})`
    case 'fail2ban/found':
      return `Tentativa de ${l.ip} (jail ${f.jail})`
    case 'fail2ban/already_banned':
      return `${l.ip} já estava banido (${f.jail})`
    case 'firewall/block':
    case 'firewall/limit':
      return `${l.type === 'limit' ? 'Limitado' : 'Bloqueado'} ${l.ip} → ${f.dst ?? ''}:${l.port ?? ''}/${(f.proto ?? '').toLowerCase()}`
    case 'firewall/allow':
      return `Permitido ${l.ip} → ${f.dst ?? ''}:${l.port ?? ''}`
    default:
      return l.raw ?? l.type
  }
}

export const KNOWN_PORTS: Record<number, string> = { 21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 80: 'HTTP', 443: 'HTTPS', 3306: 'MySQL', 3389: 'RDP', 5432: 'PostgreSQL', 6379: 'Redis', 27017: 'MongoDB' }

export function portLabel(port: number): string {
  const name = KNOWN_PORTS[port]
  return name ? `${port} (${name})` : String(port)
}

/** Aceita IPv4 e IPv6 (a API responde 422 para valores inválidos). */
export function isValidIp(v: string): boolean {
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(v)) return v.split('.').every((n) => Number(n) <= 255)
  if (!/^[0-9a-fA-F:.]+$/.test(v) || !v.includes(':')) return false
  try {
    new URL(`http://[${v}]/`)
    return true
  } catch {
    return false
  }
}

const sumBy = (s: LogStats, f: (x: LogStats['by_source'][number]) => boolean) => s.by_source.filter(f).reduce((a, x) => a + x.count, 0)

/** Números dos cards. `requests` vem dos resumos por minuto (todo o tráfego); `httpErrors` só das linhas gravadas. */
export function summaryCounts(s: LogStats) {
  return {
    bans: sumBy(s, (x) => x.source === 'fail2ban' && x.type === 'ban'),
    blocked: sumBy(s, (x) => x.source === 'firewall' && x.type !== 'allow'),
    httpErrors: sumBy(s, (x) => x.source === 'nginx' && x.type === 'access'),
    requests: s.traffic.reduce((a, p) => a + p.requests, 0),
  }
}

export type SeriesRow = { t: number } & Record<string, number>

/** Preenche com zero os buckets ausentes (a API só devolve os que têm eventos). */
function fillGaps(points: Map<number, Record<string, number>>, from: string, to: string, step: number, zero: Record<string, number>): SeriesRow[] {
  const start = Date.parse(from) / 1000
  const end = Date.parse(to) / 1000
  if (!Number.isFinite(start) || !Number.isFinite(end) || step <= 0) return []
  const out: SeriesRow[] = []
  for (let t = Math.floor(start / step) * step; t < end; t += step) {
    out.push({ t: t * 1000, ...zero, ...points.get(t) })
  }
  return out
}

const secs = (iso: string) => Math.floor(Date.parse(iso) / 1000)

export function timelineRows(s: LogStats): SeriesRow[] {
  const byTime = new Map<number, Record<string, number>>()
  for (const p of s.timeline) {
    const k = secs(p.time)
    byTime.set(k, { ...byTime.get(k), [p.source]: p.count })
  }
  return fillGaps(byTime, s.from, s.to, s.bucket_seconds, { nginx: 0, fail2ban: 0, firewall: 0 })
}

export function trafficRows(s: LogStats): SeriesRow[] {
  const byTime = new Map(s.traffic.map((p) => [secs(p.time), { requests: p.requests, errors_4xx: p.errors_4xx, errors_5xx: p.errors_5xx }]))
  return fillGaps(byTime, s.from, s.to, s.bucket_seconds, { requests: 0, errors_4xx: 0, errors_5xx: 0 })
}

/** CSV da página atual. Células iniciadas por = + - @ viram fórmula no Excel/Sheets: o apóstrofo neutraliza. */
export function toCsv(rows: LogRow[]): string {
  const esc = (v: unknown) => {
    let s = String(v ?? '')
    if (/^[=+\-@]/.test(s)) s = `'${s}`
    return `"${s.replace(/"/g, '""')}"`
  }
  const head = ['time', 'server_id', 'source', 'type', 'severity', 'ip', 'port', 'status', 'message']
  const lines = rows.map((l) => [l.time, l.server_id, l.source, l.type, l.severity, l.ip, l.port, l.status, summarize(l)].map(esc).join(','))
  return [head.join(','), ...lines].join('\n')
}
