import { BarChart, MapChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import type { EChartsCoreOption } from 'echarts/core'
import { UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import { ChartColumn, Map as MapIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChartCard } from '@/components/charts/ChartCard'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/input'
import { formatNumber } from '@/lib/format'
import type { CountryMetric, CountryStats } from '@/types/api'
import { countryName, loadWorldMap, MAP_NAME_PROPERTY, METRIC_LABEL, WORLD_MAP } from '../geo'

echarts.use([MapChart, BarChart, VisualMapComponent, TooltipComponent, GridComponent, UniversalTransition, CanvasRenderer])

type Mode = 'map' | 'bar'

const TOP_BARS = 15
const HEIGHT = 420
const count = (v: number | null | undefined) => formatNumber(v, 0)

interface Props {
  stats: CountryStats | undefined
  loading: boolean
  error: unknown
  onRetry: () => void
  metric: CountryMetric
  onMetric: (m: CountryMetric) => void
}

/** Canvas não entende `var(--x)`: resolve o token no tema atual. */
function cssColor(value: string) {
  const m = /^var\((--[\w-]+)\)$/.exec(value)
  return m ? getComputedStyle(document.documentElement).getPropertyValue(m[1]!).trim() || value : value
}

interface Item {
  id: string
  name: string
  value: number
  ips: number
  avgScore: number
}

function buildOption(mode: Mode, items: Item[], total: number, metric: CountryMetric): EChartsCoreOption {
  const muted = cssColor('var(--muted-foreground)')
  const border = cssColor('var(--border)')
  const grid = cssColor('var(--grid)')
  const max = Math.max(1, ...items.map((i) => i.value))

  const tooltip = {
    trigger: 'item',
    confine: true,
    backgroundColor: cssColor('var(--popover)'),
    borderColor: border,
    padding: [8, 12],
    textStyle: { color: cssColor('var(--popover-foreground)'), fontSize: 12 },
    extraCssText: 'box-shadow: 0 8px 24px rgb(0 0 0 / 0.15); border-radius: 8px;',
    formatter: (p: unknown) => {
      const { name, data } = p as { name: string; data?: Item }
      const title = `<div style="font-weight:500;margin-bottom:4px">${escapeHtml(countryName(name))}</div>`
      if (!data) return `${title}<span style="color:${muted}">Sem registros</span>`
      const pct = total > 0 ? ` (${formatNumber((data.value / total) * 100, 1)}%)` : ''
      const row = (label: string, value: string) =>
        `<div style="display:flex;gap:16px;padding:1px 0"><span style="color:${muted}">${label}</span><span style="margin-left:auto;font-weight:500;font-variant-numeric:tabular-nums">${value}</span></div>`
      return title + row(METRIC_LABEL[metric], count(data.value) + pct) + row('IPs distintos', count(data.ips)) + row('Pontuação média', `${count(data.avgScore)}/100`)
    },
  }

  if (mode === 'map') {
    return {
      animationDurationUpdate: 800,
      tooltip,
      visualMap: {
        min: 0,
        max,
        calculable: false,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        itemWidth: 12,
        itemHeight: 140,
        text: ['mais', 'menos'],
        textStyle: { color: muted, fontSize: 11 },
        formatter: (v: number) => count(v),
        inRange: { color: [cssColor('var(--chart-3)') + '55', cssColor('var(--danger)')] },
      },
      series: [
        {
          id: 'countries',
          type: 'map',
          map: WORLD_MAP,
          nameProperty: MAP_NAME_PROPERTY,
          universalTransition: true,
          // O mapa é limitado pela altura; um fator de aspecto maior o estica na horizontal para ocupar mais o cartão.
          aspectScale: 1.2,
          top: 0,
          bottom: 40,
          left: 0,
          right: 0,
          itemStyle: { areaColor: grid, borderColor: border, borderWidth: 0.6 },
          emphasis: { label: { show: false }, itemStyle: { areaColor: cssColor('var(--chart-1)') } },
          select: { disabled: true },
          data: items,
        },
      ],
    }
  }

  const bars = items.slice(0, TOP_BARS)
  return {
    animationDurationUpdate: 800,
    tooltip: { ...tooltip, trigger: 'item' },
    grid: { top: 8, right: 56, bottom: 8, left: 8, containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { color: muted, fontSize: 11, formatter: (v: number) => count(v) },
      axisTick: { show: false },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: grid, type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: bars.map((b) => b.id),
      axisLabel: { color: muted, fontSize: 11, formatter: (code: string) => countryName(code) },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: border } },
    },
    series: [
      {
        id: 'countries',
        type: 'bar',
        universalTransition: true,
        barMaxWidth: 18,
        itemStyle: { color: cssColor('var(--danger)'), borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', color: muted, fontSize: 11, formatter: (p: { value: number }) => count(p.value) },
        data: bars,
      },
    ],
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

export function CountryMapChart({ stats, loading, error, onRetry, metric, onMetric }: Props) {
  const [mode, setMode] = useState<Mode>('map')
  const [mapError, setMapError] = useState<unknown>(null)
  const [mapReady, setMapReady] = useState(false)
  const el = useRef<HTMLDivElement>(null)
  const chart = useRef<echarts.ECharts | null>(null)

  const items = useMemo<Item[]>(
    () => (stats?.countries ?? []).map((c) => ({ id: c.code, name: c.code, value: c.events, ips: c.ips, avgScore: c.avgScore })),
    [stats],
  )
  const total = stats?.total ?? 0
  const empty = !loading && !error && items.length === 0
  const showChart = !loading && !error && !empty

  useEffect(() => {
    loadWorldMap().then(
      () => setMapReady(true),
      (e) => setMapError(e),
    )
  }, [])

  // O elemento só existe depois dos estados de carregando/erro/vazio; (re)cria o gráfico quando ele aparece.
  useEffect(() => {
    const node = el.current
    if (!showChart || !mapReady || !node) return
    const c = echarts.init(node, undefined, { renderer: 'canvas' })
    chart.current = c
    const resize = new ResizeObserver(() => c.resize())
    resize.observe(node)
    return () => {
      resize.disconnect()
      c.dispose()
      chart.current = null
    }
  }, [showChart, mapReady])

  const latest = useRef({ mode, items, total, metric })
  useEffect(() => {
    latest.current = { mode, items, total, metric }
  })

  useEffect(() => {
    const c = chart.current
    if (!c) return
    // notMerge limpa eixos e visualMap do modo anterior; as séries com o mesmo `id` fazem o morph.
    c.setOption(buildOption(mode, items, total, metric), true)
  }, [mode, items, total, metric, showChart, mapReady])

  // alternância claro/escuro: troca a classe `.dark` no <html>; refaz as cores
  useEffect(() => {
    const obs = new MutationObserver(() => {
      const { mode, items, total, metric } = latest.current
      chart.current?.setOption(buildOption(mode, items, total, metric), true)
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  const next: Mode = mode === 'map' ? 'bar' : 'map'

  return (
    <ChartCard
      title="Ataques por país"
      description="Origem dos IPs, segundo o AbuseIPDB. Alterne entre mapa e barras."
      loading={loading}
      error={error ?? mapError}
      onRetry={onRetry}
      empty={empty}
      emptyText={
        stats && stats.unknown.ips > 0
          ? 'Os países ainda estão sendo consultados no AbuseIPDB. Eles aparecem aos poucos.'
          : 'Nenhum IP com país conhecido neste período.'
      }
      height={HEIGHT}
      actions={
        <div className="flex items-center gap-2">
          <Select aria-label="Métrica do gráfico por país" value={metric} onChange={(e) => onMetric(e.target.value as CountryMetric)}>
            {(Object.keys(METRIC_LABEL) as CountryMetric[]).map((m) => (
              <option key={m} value={m}>
                {METRIC_LABEL[m]}
              </option>
            ))}
          </Select>
          <Button size="sm" variant="outline" onClick={() => setMode(next)} aria-label={next === 'bar' ? 'Ver como barras' : 'Ver como mapa'}>
            {next === 'bar' ? <ChartColumn /> : <MapIcon />}
            {next === 'bar' ? 'Barras' : 'Mapa'}
          </Button>
        </div>
      }
    >
      {mapReady ? (
        <div ref={el} style={{ height: HEIGHT }} role="img" aria-label={`Gráfico de ${METRIC_LABEL[metric].toLowerCase()} por país`} />
      ) : (
        <div style={{ height: HEIGHT }} className="flex items-center justify-center text-sm text-muted-foreground">
          Carregando mapa…
        </div>
      )}
      {stats && stats.unknown.events > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Sem país: {count(stats.unknown.events)} {METRIC_LABEL[metric].toLowerCase()} de {count(stats.unknown.ips)} IPs (rede interna ou ainda não consultados). Total: {count(total)}.
        </p>
      )}
    </ChartCard>
  )
}
