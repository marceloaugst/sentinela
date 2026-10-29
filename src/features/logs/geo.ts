import * as echarts from 'echarts/core'
import type { CountryMetric } from '@/types/api'

export const WORLD_MAP = 'world'

/** Propriedade do GeoJSON com o código ISO 3166-1 alfa-2; é a chave que casa mapa e barras. */
export const MAP_NAME_PROPERTY = 'iso'

export const METRIC_LABEL: Record<CountryMetric, string> = {
  events: 'Eventos',
  bans: 'Bans',
  blocks: 'Bloqueios',
  http_errors: 'Erros HTTP',
}

const regionNames = new Intl.DisplayNames(['pt-BR'], { type: 'region' })

/** "BR" → "Brasil". Códigos fora do padrão voltam como vieram. */
export function countryName(code: string) {
  try {
    return regionNames.of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

let worldMap: Promise<void> | null = null

/** Baixa e registra o mapa-múndi uma única vez (public/maps/world.json, ~170 KB). */
export function loadWorldMap() {
  worldMap ??= fetch(`${import.meta.env.BASE_URL}maps/world.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`mapa-múndi: HTTP ${r.status}`)
      return r.json()
    })
    .then((geoJson) => {
      echarts.registerMap(WORLD_MAP, geoJson)
    })
    .catch((e) => {
      worldMap = null // permite nova tentativa
      throw e
    })
  return worldMap
}
