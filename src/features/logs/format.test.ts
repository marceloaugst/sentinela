import { describe, expect, it } from 'vitest'
import type { LogRow, LogStats } from '@/types/api'
import { isValidIp, summarize, summaryCounts, timelineRows, toCsv, trafficRows } from './format'

const row = (over: Partial<LogRow>): LogRow => ({ time: '2026-10-22T10:00:00Z', server_id: 's1', source: 'nginx', type: 'access', severity: 'warning', fields: {}, ...over })

describe('summarize', () => {
  it('descreve acesso nginx', () => {
    expect(summarize(row({ status: 404, fields: { method: 'GET', path: '/x' } }))).toBe('GET /x → 404')
  })
  it('descreve bloqueio de firewall', () => {
    expect(summarize(row({ source: 'firewall', type: 'block', ip: '1.2.3.4', port: 22, fields: { dst: '10.0.0.1', proto: 'TCP' } }))).toBe('Bloqueado 1.2.3.4 → 10.0.0.1:22/tcp')
  })
  it('cai no raw para tipos desconhecidos', () => {
    expect(summarize(row({ type: 'novo', raw: 'linha' }))).toBe('linha')
  })
})

describe('isValidIp', () => {
  it.each([
    ['1.2.3.4', true],
    ['999.1.1.1', false],
    ['::1', true],
    ['2001:db8::1', true],
    ['abc', false],
    ['', false],
  ])('%s → %s', (v, ok) => {
    expect(isValidIp(v)).toBe(ok)
  })
})

describe('toCsv', () => {
  it('neutraliza injeção de fórmula e escapa aspas', () => {
    const lines = toCsv([row({ ip: '=cmd', fields: { method: 'GET', path: '"p"' }, status: 500 })]).split('\n')
    expect(lines[1]).toContain(`"'=cmd"`)
    expect(lines[1]).toContain('GET ""p"" → 500')
  })
})

const stats: LogStats = {
  from: '2026-10-22T10:00:00Z',
  to: '2026-10-22T10:03:00Z',
  bucket_seconds: 60,
  by_source: [
    { source: 'fail2ban', type: 'ban', count: 2 },
    { source: 'firewall', type: 'block', count: 5 },
    { source: 'firewall', type: 'allow', count: 9 },
    { source: 'nginx', type: 'access', count: 4 },
  ],
  top_ips: [],
  top_blocked_ports: [],
  timeline: [{ time: '2026-10-22T10:01:00Z', source: 'nginx', count: 3 }],
  traffic: [{ time: '2026-10-22T10:00:00Z', requests: 10, errors_4xx: 1, errors_5xx: 0 }],
}

describe('stats', () => {
  it('soma os cards', () => {
    expect(summaryCounts(stats)).toEqual({ bans: 2, blocked: 5, httpErrors: 4, requests: 10 })
  })
  it('preenche buracos da linha do tempo com zero', () => {
    const rows = timelineRows(stats)
    expect(rows).toHaveLength(3)
    expect(rows[1]).toMatchObject({ nginx: 3, fail2ban: 0, firewall: 0 })
    expect(rows[0]).toMatchObject({ nginx: 0 })
  })
  it('preenche buracos do tráfego com zero', () => {
    const rows = trafficRows(stats)
    expect(rows.map((r) => r.requests)).toEqual([10, 0, 0])
  })
})
