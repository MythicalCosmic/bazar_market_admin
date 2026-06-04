<template>
  <div class="courier-map-wrap">
    <div ref="mapEl" class="courier-map" />

    <!-- Geocoding spinner (resolving an order address that has no coordinates) -->
    <div v-if="geocoding" class="courier-map-geocoding">
      <v-progress-circular indeterminate size="16" width="2" color="primary" />
      Manzil aniqlanmoqda…
    </div>

    <!-- The one and only action: hand navigation off to Yandex Maps, which does
         turn-by-turn, live location and traffic far better than we can in-app. -->
    <button
      v-if="destPoint"
      class="courier-nav-go"
      :style="bottomStyle"
      @click="openExternal"
    >
      <v-icon size="22" color="white">mdi-navigation-variant</v-icon>
      <span>Yandex Maps'da yo'l ko'rsatish</span>
    </button>

    <!-- Map load error -->
    <div v-if="mapError" class="courier-map-error">
      <v-icon size="16" color="error">mdi-alert-circle-outline</v-icon>
      {{ mapError }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
import { loadYandexMaps, geocodeAddress, MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from '@/composables/useYandexMaps'

const props = defineProps({
  destination: { type: Object, default: null }, // { lat, lng, label, query? }
  initialCenter: { type: Array, default: () => [...MAP_DEFAULT_CENTER] }, // Marhamat tumani [lat, lng]
  // Height (px) of the page's bottom sheet so the button floats just above it.
  bottomInset: { type: Number, default: 0 },
})

const bottomStyle = computed(() => ({ bottom: (props.bottomInset + 14) + 'px' }))

const mapEl = ref(null)
let ymaps = null
let map = null
let destMarker = null
let DestLayout = null

const mapError = ref('')
const geocoding = ref(false)
const geocoded = ref(null) // resolved { lat, lng, label } when the order lacked coords

// Resolved destination: prop coordinates if present, else the geocoded result.
const destPoint = computed(() => {
  const d = props.destination
  if (d && Number.isFinite(d.lat) && Number.isFinite(d.lng)) {
    return { lat: d.lat, lng: d.lng, label: d.label || '' }
  }
  return geocoded.value
})

function buildLayouts() {
  DestLayout = ymaps.templateLayoutFactory.createClass(
    '<div class="courier-dest-icon" style="position:absolute;left:-19px;top:-46px;width:38px;height:48px">' +
      '<svg width="38" height="48" viewBox="0 0 24 24"><path fill="#EF4444" stroke="#fff" stroke-width="1.3" d="M12 2C7.6 2 4 5.6 4 10c0 5.5 8 12 8 12s8-6.5 8-12c0-4.4-3.6-8-8-8z"/><circle cx="12" cy="10" r="3" fill="#fff"/></svg>' +
    '</div>'
  )
}

function updateDestMarker() {
  if (!map) return
  if (destMarker) { map.geoObjects.remove(destMarker); destMarker = null }
  const d = destPoint.value
  if (!d) return
  destMarker = new ymaps.Placemark([d.lat, d.lng], {
    hintContent: d.label || '',
  }, {
    iconLayout: DestLayout,
    iconShape: { type: 'Rectangle', coordinates: [[-19, -46], [19, 2]] },
  })
  map.geoObjects.add(destMarker)
  map.setCenter([d.lat, d.lng], 16, { duration: 300 })
}

// Open Yandex Maps with a driving route to the order. Leaving the origin empty (`~`)
// lets Yandex use the device's own location, so it owns the full navigation.
function openExternal() {
  const d = destPoint.value
  if (!d) return
  const url = `https://yandex.com/maps/?rtext=~${d.lat},${d.lng}&rtt=auto`
  window.open(url, '_blank', 'noopener')
}

// When an order has no stored coordinates, geocode its address text via Yandex so the
// pin still lands on the real location.
async function resolveGeocode() {
  geocoded.value = null
  const d = props.destination
  if (!d) return
  if (Number.isFinite(d.lat) && Number.isFinite(d.lng)) return
  const query = d.query || d.label
  if (!query) return
  geocoding.value = true
  try {
    const c = props.initialCenter
    const span = 0.5
    const bounded = [[c[0] - span, c[1] - span], [c[0] + span, c[1] + span]]
    geocoded.value = await geocodeAddress(query, { boundedBy: bounded })
  } finally {
    geocoding.value = false
  }
}

onMounted(async () => {
  await nextTick()
  try {
    ymaps = await loadYandexMaps()
  } catch {
    mapError.value = 'Xarita yuklanmadi'
    return
  }
  buildLayouts()
  map = new ymaps.Map(mapEl.value, {
    center: props.initialCenter,
    zoom: MAP_DEFAULT_ZOOM,
    controls: ['zoomControl'],
  }, { suppressMapOpenBlock: true })

  await resolveGeocode()
  updateDestMarker()
})

onBeforeUnmount(() => {
  if (map) { map.destroy(); map = null }
})

watch(() => props.destination, async () => {
  await resolveGeocode()
  updateDestMarker()
}, { deep: true })

watch(geocoded, () => updateDestMarker())
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

/* Geocoding pill */
.courier-map-geocoding {
  position: absolute;
  top: 70px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 540;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--bz-surface-1, #fff) 94%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: 0 6px 16px rgba(15,23,42,0.22);
  font-size: 12.5px;
  font-weight: 700;
  color: var(--bz-text-1, #0F172A);
}
.v-theme--dark .courier-map-geocoding { background: rgba(15,23,42,0.92); color: #F1F5F9; }

/* Single "navigate in Yandex Maps" button */
.courier-nav-go {
  position: absolute;
  left: 12px;
  right: 12px;
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 52px;
  border: 0;
  border-radius: 18px;
  background: linear-gradient(135deg, #10B981, #059669);
  box-shadow: 0 8px 22px rgba(16,185,129,0.4);
  color: #fff;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.2px;
  cursor: pointer;
  transition: transform 0.15s ease;
}
.courier-nav-go:active { transform: scale(0.98); }

.courier-map-error {
  position: absolute;
  bottom: 86px;
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

.courier-dest-icon {
  filter: drop-shadow(0 4px 6px rgba(239,68,68,0.45));
}
</style>
