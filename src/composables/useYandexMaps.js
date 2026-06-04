// Default map view: Marhamat tumani, Andijan Region, Uzbekistan [lat, lng].
export const MAP_DEFAULT_CENTER = [40.49, 72.31]
export const MAP_DEFAULT_ZOOM = 12

// Loads the Yandex Maps JS API 2.1 once and resolves the global `ymaps` object.
let promise = null

export function loadYandexMaps() {
  if (promise) return promise

  promise = new Promise((resolve, reject) => {
    if (window.ymaps && window.ymaps.Map) {
      window.ymaps.ready(() => resolve(window.ymaps))
      return
    }

    const key = import.meta.env.VITE_YANDEX_MAPS_KEY
    const onload = () => window.ymaps.ready(() => resolve(window.ymaps))
    const onerror = () => { promise = null; reject(new Error('Yandex Maps yuklanmadi')) }

    const existing = document.getElementById('yandex-maps-jsapi')
    if (existing) {
      existing.addEventListener('load', onload)
      existing.addEventListener('error', onerror)
      return
    }

    const script = document.createElement('script')
    script.id = 'yandex-maps-jsapi'
    script.async = true
    // `geocode` enables the geocoder API; `multiRouter` powers driving directions.
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(key || '')}&lang=ru_RU&load=package.full`
    script.addEventListener('load', onload)
    script.addEventListener('error', onerror)
    document.head.appendChild(script)
  })

  return promise
}

// Geocode free-text (an order's `address_text`) to coordinates when the order has no
// stored lat/lng. Uses the standalone Yandex **Geocoder HTTP API** (not the JS API),
// keyed separately by VITE_YANDEX_GEOCODER_KEY. Returns `{ lat, lng, label }` or null.
// `boundedBy` ([[latMin,lngMin],[latMax,lngMax]]) biases results toward the operating
// region so partial addresses ("Marhamat, Andijon") resolve to the right city.
const GEOCODER_URL = 'https://geocode-maps.yandex.ru/1.x/'

export async function geocodeAddress(query, { boundedBy } = {}) {
  if (!query || !String(query).trim()) return null
  const key = import.meta.env.VITE_YANDEX_GEOCODER_KEY
  if (!key) return null

  const params = new URLSearchParams({
    apikey: key,
    geocode: String(query).trim(),
    format: 'json',
    lang: 'ru_RU',
    results: '1',
  })
  if (boundedBy) {
    // HTTP API wants bbox as "lng,lat~lng,lat" (longitude first), opposite of the
    // JS API's [lat,lng] ordering.
    const [[latMin, lngMin], [latMax, lngMax]] = boundedBy
    params.set('bbox', `${lngMin},${latMin}~${lngMax},${latMax}`)
  }

  try {
    const res = await fetch(`${GEOCODER_URL}?${params.toString()}`)
    if (!res.ok) return null
    const data = await res.json()
    const member = data?.response?.GeoObjectCollection?.featureMember?.[0]
    const go = member?.GeoObject
    if (!go) return null
    // Point.pos is "longitude latitude".
    const [lng, lat] = String(go.Point?.pos || '').split(' ').map(Number)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    const label = go.metaDataProperty?.GeocoderMetaData?.text || go.name || String(query)
    return { lat, lng, label }
  } catch {
    return null
  }
}

// Reverse-geocode raw coordinates (e.g. the courier's GPS fix) to a human address via
// the Geocoder HTTP API. `kind: 'house'` biases the result toward the exact building
// rather than the street/district. Returns `{ label, house, street }` or null.
export async function reverseGeocode(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const key = import.meta.env.VITE_YANDEX_GEOCODER_KEY
  if (!key) return null
  const params = new URLSearchParams({
    apikey: key,
    geocode: `${lng},${lat}`, // HTTP API: longitude first
    format: 'json',
    lang: 'ru_RU',
    kind: 'house',
    results: '1',
  })
  try {
    const res = await fetch(`${GEOCODER_URL}?${params.toString()}`)
    if (!res.ok) return null
    const data = await res.json()
    const go = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject
    if (!go) return null
    const meta = go.metaDataProperty?.GeocoderMetaData
    const comps = meta?.Address?.Components || []
    const pick = (kind) => comps.filter(c => c.kind === kind).map(c => c.name).pop()
    return {
      label: meta?.text || go.name || '',
      house: pick('house') || '',
      street: pick('street') || '',
    }
  } catch {
    return null
  }
}
