import { useId } from 'react'
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDayTime } from '@/lib/format'
import type { Stat } from '@/types/api'

export interface ChartSeries {
  /** Chave da média no row; `${key}_min` e `${key}_max` são opcionais (tooltip). */
  key: string
  label: string
  color: string
}

export type ChartRow = { t: number } & Record<string, number | null>

interface Props {
  rows: ChartRow[]
  series: ChartSeries[]
  /** Formata valores no eixo Y e no tooltip, com a unidade (ex.: "45%", "1,2 MB/s"). */
  format: (v: number | null | undefined) => string
  /** Domínio fixo do eixo Y (ex.: [0, 100] para percentuais). */
  domain?: [number, number]
  /** Duração da janela em ms — define o formato dos rótulos do eixo X. */
  spanMs: number
  height?: number
}

const AXIS_TICK = { fill: 'var(--muted-foreground)', fontSize: 11 }

function xTick(spanMs: number) {
  const day = spanMs > 24 * 3600_000
  return (v: number) => {
    const d = new Date(v)
    const hm = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return day ? `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${hm}` : hm
  }
}

interface TipProps {
  active?: boolean
  payload?: { dataKey?: string | number; payload: ChartRow }[]
  label?: number | string
  series: ChartSeries[]
  format: Props['format']
}

function ChartTooltip({ active, payload, label, series, format }: TipProps) {
  if (!active || !payload?.length) return null
  const row = payload[0]!.payload
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
      <p className="mb-1 font-medium">{formatDayTime(Number(label))}</p>
      {series.map((s) => {
        const avg = row[s.key]
        const min = row[`${s.key}_min`]
        const max = row[`${s.key}_max`]
        return (
          <div key={s.key} className="flex items-center gap-2 py-0.5">
            <span className="size-2 rounded-full" style={{ background: s.color }} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="tabular ml-auto font-medium">{format(avg)}</span>
            {min != null && max != null && min !== max && (
              <span className="tabular text-muted-foreground">
                ({format(min)} – {format(max)})
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function TimeSeriesChart({ rows, series, format, domain, spanMs, height = 220 }: Props) {
  const uid = useId().replace(/:/g, '')
  const tick = xTick(spanMs)
  return (
    <div style={{ height }} role="img" aria-label={`Gráfico de ${series.map((s) => s.label).join(', ')}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="var(--grid)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={tick}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            minTickGap={48}
          />
          <YAxis
            domain={domain ?? [0, 'auto']}
            tickFormatter={(v: number) => format(v)}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={68}
          />
          <Tooltip content={<ChartTooltip series={series} format={format} />} cursor={{ stroke: 'var(--muted-foreground)', strokeDasharray: 3 }} />
          {series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#${uid}-${s.key})`}
              dot={false}
              activeDot={{ r: 3 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Converte `Stat` (min/avg/max) de uma série em colunas planas do gráfico. */
export function statColumns(prefix: string, stat: Stat | undefined | null) {
  return {
    [prefix]: stat?.avg ?? null,
    [`${prefix}_min`]: stat?.min ?? null,
    [`${prefix}_max`]: stat?.max ?? null,
  }
}
