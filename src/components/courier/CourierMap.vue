<template>
  <div class="courier-map-wrap">
    <div ref="mapEl" class="courier-map" />

    <!-- Recenter button -->
    <v-btn
      icon
      class="courier-map-fab courier-map-fab-locate"
      color="surface"
      elevation="4"
      @click="recenterMe"
    >
      <v-icon color="primary">mdi-crosshairs-gps</v-icon>
    </v-btn>

    <!-- Fit both button -->
    <v-btn
      v-if="destination"
      icon
      class="courier-map-fab courier-map-fab-fit"
      color="surface"
      elevation="4"
      @click="fitBoth"
    >
      <v-icon>mdi-map-marker-distance</v-icon>
    </v-btn>

    <!-- Open in external navigator -->
    <v-btn
      v-if="destination"
      class="courier-map-fab courier-map-fab-nav"
      color="primary"
      elevation="6"
      rounded="pill"
      @click="openExternal"
    >
      <v-icon start>mdi-navigation</v-icon>
      Yo'l ko'rsatish
    </v-btn>

    <!-- Distance / ETA badge -->
    <div v-if="destination" class="courier-map-info">
      <div class="courier-map-info-row">
        <v-icon size="16" color="primary">mdi-map-marker-distance</v-icon>
        <span class="num">{{ distanceLabel }}</span>
      </div>
      <div v-if="durationLabel" class="courier-map-info-row">
        <v-icon size="16" color="info">mdi-clock-outline</v-icon>
        <span class="num">{{ durationLabel }}</span>
      </div>
    </div>

    <!-- Geo error banner -->
    <div v-if="geoError" class="courier-map-error">
      <v-icon size="16" color="error">mdi-alert-circle-outline</v-icon>
      {{ geoError }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
import { loadYandexMaps, MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from '@/composables/useYandexMaps'

const props = defineProps({
  destination: { type: Object, default: null }, // { lat, lng, label }
  initialCenter: { type: Array, default: () => [...MAP_DEFAULT_CENTER] }, // Marhamat tumani [lat, lng]
})
const emit = defineEmits(['route', 'position'])

const mapEl = ref(null)
let ymaps = null
let map = null
let meMarker = null
let meAccuracyCircle = null
let destMarker = null
let routeLine = null
let multiRoute = null
let watchId = null
let MeLayout = null
let DestLayout = null

const myPos = ref(null) // { lat, lng, acc }
const routeMeters = ref(null)
const routeSeconds = ref(null)
const geoError = ref('')

const distanceLabel = computed(() => {
  const m = routeMeters.value
  if (m === null || m === undefined) {
    // fall back to straight line
    if (myPos.value && props.destination) {
      const km = haversine(myPos.value, props.destination) / 1000
      return formatKm(km) + ' (toʻgʻri)'
    }
    return '—'
  }
  return formatKm(m / 1000)
})

const durationLabel = computed(() => {
  const s = routeSeconds.value
  if (s === null || s === undefined) {
    // fallback: 25 km/h avg city speed
    if (myPos.value && props.destination) {
      const km = haversine(myPos.value, props.destination) / 1000
      return formatMin((km / 25) * 60) + ' (taxminan)'
    }
    return ''
  }
  return formatMin(s / 60)
})

function formatKm(km) {
  if (km < 1) return Math.round(km * 1000) + ' m'
  return km.toFixed(km < 10 ? 1 : 0) + ' km'
}
function formatMin(min) {
  if (min < 1) return '< 1 min'
  if (min < 60) return Math.round(min) + ' min'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return `${h} soat ${m} min`
}

function haversine(a, b) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function buildLayouts() {
  MeLayout = ymaps.templateLayoutFactory.createClass(
    '<div class="courier-me-icon" style="position:absolute;left:-11px;top:-11px;width:22px;height:22px;pointer-events:none">' +
      '<div class="courier-me-pulse"></div><div class="courier-me-dot"></div>' +
    '</div>'
  )
  DestLayout = ymaps.templateLayoutFactory.createClass(
    '<div class="courier-dest-icon" style="position:absolute;left:-19px;top:-46px;width:38px;height:48px">' +
      '<svg width="38" height="48" viewBox="0 0 24 24"><path fill="#EF4444" stroke="#fff" stroke-width="1.3" d="M12 2C7.6 2 4 5.6 4 10c0 5.5 8 12 8 12s8-6.5 8-12c0-4.4-3.6-8-8-8z"/><circle cx="12" cy="10" r="3" fill="#fff"/></svg>' +
    '</div>'
  )
}

function updateMeMarker() {
  if (!map || !myPos.value) return
  const ll = [myPos.value.lat, myPos.value.lng]
  if (!meMarker) {
    meMarker = new ymaps.Placemark(ll, {}, {
      iconLayout: MeLayout,
      iconShape: { type: 'Circle', coordinates: [0, 0], radius: 11 },
      zIndex: 1000,
    })
    map.geoObjects.add(meMarker)
  } else {
    meMarker.geometry.setCoordinates(ll)
  }
  if (myPos.value.acc) {
    if (!meAccuracyCircle) {
      meAccuracyCircle = new ymaps.Circle([ll, myPos.value.acc], {}, {
        fillColor: '#3B82F61F',
        strokeColor: '#3B82F6',
        strokeOpacity: 0.5,
        strokeWidth: 1,
        interactivityModel: 'default#transparent',
      })
      map.geoObjects.add(meAccuracyCircle)
    } else {
      meAccuracyCircle.geometry.setCoordinates(ll)
      meAccuracyCircle.geometry.setRadius(myPos.value.acc)
    }
  }
}

function updateDestMarker() {
  if (!map) return
  if (destMarker) { map.geoObjects.remove(destMarker); destMarker = null }
  if (!props.destination) return
  destMarker = new ymaps.Placemark([props.destination.lat, props.destination.lng], {
    hintContent: props.destination.label || '',
  }, {
    iconLayout: DestLayout,
    iconShape: { type: 'Rectangle', coordinates: [[-19, -46], [19, 2]] },
  })
  map.geoObjects.add(destMarker)
}

function clearRoute() {
  if (multiRoute) { map.geoObjects.remove(multiRoute); multiRoute = null }
  if (routeLine) { map.geoObjects.remove(routeLine); routeLine = null }
}

function refreshRoute() {
  if (!map) return
  clearRoute()
  routeMeters.value = null
  routeSeconds.value = null
  if (!myPos.value || !props.destination) return

  const a = myPos.value
  const b = props.destination

  // Yandex traffic-aware driving route (better local data than OSRM for UZ).
  multiRoute = new ymaps.multiRouter.MultiRoute({
    referencePoints: [[a.lat, a.lng], [b.lat, b.lng]],
    params: { routingMode: 'auto', results: 1 },
  }, {
    boundsAutoApply: false,
    wayPointVisible: false,
    pinVisible: false,
    routeActiveStrokeColor: '#16A34A',
    routeActiveStrokeWidth: 5,
  })

  multiRoute.model.events.add('requestsuccess', () => {
    const active = multiRoute && multiRoute.getActiveRoute()
    if (!active) { drawStraightFallback(a, b); return }
    const dist = active.properties.get('distance')
    const durTraffic = active.properties.get('durationInTraffic')
    const dur = active.properties.get('duration')
    routeMeters.value = dist ? dist.value : null
    routeSeconds.value = (durTraffic && durTraffic.value) || (dur && dur.value) || null
    emit('route', { meters: routeMeters.value, seconds: routeSeconds.value })
  })
  multiRoute.model.events.add('requestfail', () => drawStraightFallback(a, b))

  map.geoObjects.add(multiRoute)
}

function drawStraightFallback(a, b) {
  if (!map) return
  clearRoute()
  routeMeters.value = null
  routeSeconds.value = null
  routeLine = new ymaps.Polyline([[a.lat, a.lng], [b.lat, b.lng]], {}, {
    strokeColor: '#3B82F6', strokeWidth: 4, strokeOpacity: 0.6, strokeStyle: 'dash',
  })
  map.geoObjects.add(routeLine)
  const straightM = haversine(a, b)
  emit('route', { meters: straightM, seconds: (straightM / 1000) / 25 * 3600, approximate: true })
}

function fitBoth() {
  if (!map) return
  const pts = []
  if (myPos.value) pts.push([myPos.value.lat, myPos.value.lng])
  if (props.destination) pts.push([props.destination.lat, props.destination.lng])
  if (pts.length === 1) {
    map.setCenter(pts[0], 15, { duration: 300 })
  } else if (pts.length >= 2) {
    const lats = pts.map(p => p[0])
    const lngs = pts.map(p => p[1])
    const bounds = [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]]
    map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 60 })
      .then(() => { if (map.getZoom() > 16) map.setZoom(16) })
      .catch(() => {})
  }
}

function recenterMe() {
  if (myPos.value && map) {
    map.setCenter([myPos.value.lat, myPos.value.lng], 16, { duration: 300 })
  } else {
    startWatch()
  }
}

function openExternal() {
  if (!props.destination) return
  const { lat, lng } = props.destination
  const dest = `${lat},${lng}`
  const url = myPos.value
    ? `https://yandex.com/maps/?rtext=${myPos.value.lat},${myPos.value.lng}~${dest}&rtt=auto`
    : `https://yandex.com/maps/?rtext=~${dest}&rtt=auto`
  window.open(url, '_blank', 'noopener')
}

function startWatch() {
  if (!('geolocation' in navigator)) {
    geoError.value = 'Brauzer geolokatsiyani qo\'llab-quvvatlamaydi'
    return
  }
  if (watchId !== null) return
  geoError.value = ''
  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords
      const first = !myPos.value
      myPos.value = { lat: latitude, lng: longitude, acc: accuracy }
      updateMeMarker()
      emit('position', myPos.value)
      if (first) {
        if (props.destination) fitBoth()
        else map?.setCenter([latitude, longitude], 15, { duration: 300 })
        refreshRoute()
      }
    },
    (err) => {
      geoError.value =
        err.code === 1 ? 'Joylashuvga ruxsat berilmagan'
        : err.code === 2 ? 'Joylashuv aniqlanmadi'
        : err.code === 3 ? 'Joylashuv vaqti tugadi'
        : 'Joylashuv xatosi'
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
  )
}

onMounted(async () => {
  await nextTick()
  try {
    ymaps = await loadYandexMaps()
  } catch {
    geoError.value = 'Xarita yuklanmadi'
    return
  }
  buildLayouts()
  map = new ymaps.Map(mapEl.value, {
    center: props.initialCenter,
    zoom: MAP_DEFAULT_ZOOM,
    controls: ['zoomControl'],
  }, { suppressMapOpenBlock: true })

  updateDestMarker()
  startWatch()
})

onBeforeUnmount(() => {
  if (watchId !== null && 'geolocation' in navigator) navigator.geolocation.clearWatch(watchId)
  if (map) { map.destroy(); map = null }
})

watch(() => props.destination, () => {
  updateDestMarker()
  refreshRoute()
  if (myPos.value && props.destination) fitBoth()
}, { deep: true })

defineExpose({ recenterMe, fitBoth })
</script>

<style>
.courier-map-wrap {
  position: relative;
  width: 100%;
  height: 100%;
}
.courier-map {
  width: 100%;
  height: 100%;
}
.courier-map-fab {
  position: absolute;
  z-index: 500;
}
.courier-map-fab-locate { top: 12px; right: 12px; }
.courier-map-fab-fit    { top: 64px; right: 12px; }
.courier-map-fab-nav    { bottom: 14px; left: 50%; transform: translateX(-50%); font-weight: 700; }

.courier-map-info {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 500;
  background: color-mix(in srgb, var(--bz-surface-1, #fff) 94%, transparent);
  backdrop-filter: blur(8px);
  border-radius: 14px;
  padding: 8px 12px;
  box-shadow: 0 6px 16px rgba(15,23,42,0.22);
  border: 1px solid var(--bz-border, rgba(15,23,42,0.06));
  color: var(--bz-text-1, #0F172A);
  font-size: 13px;
  font-weight: 700;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 90px;
}
.courier-map-info-row { display: flex; align-items: center; gap: 6px; }

.v-theme--dark .courier-map-info {
  background: rgba(15, 23, 42, 0.92);
  border-color: rgba(255,255,255,0.08);
  color: #F1F5F9;
  box-shadow: 0 6px 16px rgba(0,0,0,0.5);
}

.courier-map-error {
  position: absolute;
  bottom: 14px;
  right: 12px;
  z-index: 500;
  background: rgba(239,68,68,0.95);
  color: #fff;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 12.5px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 240px;
  box-shadow: 0 4px 12px rgba(239,68,68,0.35);
}
.courier-map-error .v-icon { color: #fff !important; }

/* My location marker */
.courier-me-icon {
  position: relative;
}
.courier-me-dot {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 16px;
  height: 16px;
  background: #3B82F6;
  border: 3px solid #fff;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(59,130,246,0.5);
}
.courier-me-pulse {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  background: rgba(59,130,246,0.35);
  animation: courier-pulse 1.6s ease-out infinite;
}
@keyframes courier-pulse {
  0%   { transform: scale(0.6); opacity: 0.8; }
  100% { transform: scale(1.8); opacity: 0; }
}

.courier-dest-icon {
  filter: drop-shadow(0 4px 6px rgba(239,68,68,0.45));
}
</style>
