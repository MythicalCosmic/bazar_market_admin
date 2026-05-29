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
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(key || '')}&lang=ru_RU`
    script.addEventListener('load', onload)
    script.addEventListener('error', onerror)
    document.head.appendChild(script)
  })

  return promise
}
