import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { DataZoomComponent, GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsCoreOption } from 'echarts/core'
import { formatDayTime } from '@/lib/format'
import type { Stat } from '@/types/api'

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer])

export interface ChartSeries {
  /** Chave da média no row; `${key}_min` e `${key}_max` são opcionais (tooltip). */
  key: string
  label: string
  /** Cor CSS; aceita `var(--token)`, resolvida no tema atual. */
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

/** Canvas não entende `var(--x)`: resolve o token no tema atual. */
function cssColor(value: string) {
  const m = /^var\((--[\w-]+)\)$/.exec(value)
  return m ? getComputedStyle(document.documentElement).getPropertyValue(m[1]!).trim() || value : value
}

function xTick(spanMs: number) {
  const day = spanMs > 24 * 3600_000
  return (v: number) => {
    const d = new Date(v)
    const hm = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return day ? `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${hm}` : hm
  }
}

function buildOption({ rows, series, format, domain, spanMs }: Props, resetZoom: boolean): EChartsCoreOption {
  const muted = cssColor('var(--muted-foreground)')
  const grid = cssColor('var(--grid)')
  const border = cssColor('var(--border)')
  const multi = series.length > 1
  const zoomable = rows.length > 1
  const reset = resetZoom ? { start: 0, end: 100 } : {}

  return {
    animation: false,
    grid: { top: multi ? 30 : 10, right: 12, bottom: zoomable ? 44 : 24, left: 8, containLabel: true },
    legend: multi
      ? { show: true, top: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: muted, fontSize: 12 } }
      : { show: false },
    tooltip: {
      trigger: 'axis',
      confine: true,
      backgroundColor: cssColor('var(--popover)'),
      borderColor: border,
      padding: [8, 12],
      textStyle: { color: cssColor('var(--popover-foreground)'), fontSize: 12 },
      extraCssText: 'box-shadow: 0 8px 24px rgb(0 0 0 / 0.15); border-radius: 8px;',
      axisPointer: { type: 'line', lineStyle: { color: muted, type: 'dashed' } },
      formatter: (params: unknown) => {
        const first = (params as { dataIndex: number }[])[0]
        const row = first && rows[first.dataIndex]
        if (!row) return ''
        const lines = series.map((s) => {
          const min = row[`${s.key}_min`]
          const max = row[`${s.key}_max`]
          const range =
            min != null && max != null && min !== max ? `<span style="color:${muted}">(${format(min)} – ${format(max)})</span>` : ''
          return (
            `<div style="display:flex;align-items:center;gap:8px;padding:2px 0">` +
            `<span style="width:8px;height:8px;border-radius:50%;background:${cssColor(s.color)}"></span>` +
            `<span style="color:${muted}">${s.label}</span>` +
            `<span style="margin-left:auto;font-weight:500;font-variant-numeric:tabular-nums">${format(row[s.key])}</span>${range}</div>`
          )
        })
        return `<div style="font-weight:500;margin-bottom:4px">${formatDayTime(row.t)}</div>${lines.join('')}`
      },
    },
    xAxis: {
      type: 'time',
      axisLabel: { color: muted, fontSize: 11, hideOverlap: true, formatter: xTick(spanMs) },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: border } },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      min: domain ? domain[0] : 0,
      max: domain ? domain[1] : undefined,
      axisLabel: { color: muted, fontSize: 11, formatter: (v: number) => format(v) },
      axisTick: { show: false },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: grid, type: 'dashed' } },
    },
    dataZoom: zoomable
      ? [
          { type: 'inside', xAxisIndex: 0, filterMode: 'none', ...reset },
          {
            type: 'slider',
            xAxisIndex: 0,
            filterMode: 'none',
            height: 18,
            bottom: 4,
            borderColor: border,
            fillerColor: grid,
            handleSize: '100%',
            moveHandleSize: 0,
            textStyle: { color: muted, fontSize: 10 },
            labelFormatter: (v: number) => xTick(spanMs)(v),
            dataBackground: { lineStyle: { color: grid }, areaStyle: { color: grid } },
            selectedDataBackground: { lineStyle: { color: muted }, areaStyle: { color: grid } },
            ...reset,
          },
        ]
      : [],
    series: series.map((s) => {
      const color = cssColor(s.color)
      return {
        id: s.key,
        name: s.label,
        type: 'line',
        smooth: true,
        showSymbol: false,
        connectNulls: false,
        sampling: 'lttb',
        lineStyle: { width: 2, color },
        itemStyle: { color },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: color + '4d' },
              { offset: 1, color: color + '00' },
            ],
          },
        },
        emphasis: { disabled: true },
        data: rows.map((r) => [r.t, r[s.key]]),
      }
    }),
  }
}

export function TimeSeriesChart(props: Props) {
  const { height = 220, series } = props
  const el = useRef<HTMLDivElement>(null)
  const chart = useRef<echarts.ECharts | null>(null)
  const lastSpan = useRef<number | null>(null)
  const latest = useRef(props)

  useEffect(() => {
    latest.current = props
  })

  useEffect(() => {
    const node = el.current!
    const c = echarts.init(node, undefined, { renderer: 'canvas' })
    chart.current = c
    const resize = new ResizeObserver(() => c.resize())
    resize.observe(node)
    // alternância claro/escuro: troca a classe `.dark` no <html>; refaz as cores
    const themeObserver = new MutationObserver(() => c.setOption(buildOption(latest.current, false), { replaceMerge: ['series'] }))
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    // duplo clique volta ao período completo
    c.getZr().on('dblclick', () => c.dispatchAction({ type: 'dataZoom', start: 0, end: 100 }))
    return () => {
      resize.disconnect()
      themeObserver.disconnect()
      c.dispose()
      chart.current = null
      lastSpan.current = null
    }
  }, [])

  useEffect(() => {
    const spanChanged = lastSpan.current !== null && lastSpan.current !== props.spanMs
    lastSpan.current = props.spanMs
    // mescla para preservar o zoom do usuário entre atualizações de dados
    chart.current?.setOption(buildOption(props, spanChanged), { replaceMerge: ['series'] })
  })

  return <div ref={el} style={{ height }} role="img" aria-label={`Gráfico de ${series.map((s) => s.label).join(', ')}`} />
}

/** Converte `Stat` (min/avg/max) de uma série em colunas planas do gráfico. */
export function statColumns(prefix: string, stat: Stat | undefined | null) {
  return {
    [prefix]: stat?.avg ?? null,
    [`${prefix}_min`]: stat?.min ?? null,
    [`${prefix}_max`]: stat?.max ?? null,
  }
}
