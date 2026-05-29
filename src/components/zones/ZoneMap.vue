<template>
  <div ref="mapEl" :style="`width:100%;height:${height};border-radius:${radius}px;overflow:hidden`" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { loadYandexMaps, MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from '@/composables/useYandexMaps'

const props = defineProps({
  zones:    { type: Array, default: () => [] },
  selectedId: { type: [Number, String], default: null },
  drawing:  { type: Boolean, default: false },
  marker:   { type: Object, default: null }, // { lat, lng, label }
  height:   { type: String, default: '100%' },
  radius:   { type: Number, default: 16 },
  center:   { type: Array, default: () => [...MAP_DEFAULT_CENTER] }, // Marhamat tumani [lat, lng]
  zoom:     { type: Number, default: MAP_DEFAULT_ZOOM },
  readonly: { type: Boolean, default: false },
})
const emit = defineEmits(['draw', 'edit', 'select'])

const mapEl = ref(null)
let ymaps = null
let map = null
let ready = false
let drawPoly = null
let markerObj = null
const objById = new Map()      // zoneId -> ymaps.Polygon
const origCoords = new Map()   // zoneId -> JSON snapshot taken when editing started

function styleFor(zone, isSelected) {
  if (!zone.is_active) return { strokeColor: '#94A3B8', fillColor: '#94A3B8' }
  if (isSelected)      return { strokeColor: '#16A34A', fillColor: '#22C55E' }
  return { strokeColor: '#3B82F6', fillColor: '#60A5FA' }
}

// GeoJSON Polygon (rings of [lng, lat]) -> Yandex contours (rings of [lat, lng]).
function geojsonToContours(geom) {
  return (geom.coordinates || []).map(ring => ring.map(([lng, lat]) => [lat, lng]))
}
// Yandex contours (rings of [lat, lng]) -> GeoJSON Polygon (rings of [lng, lat], closed).
function contoursToGeojson(contours) {
  const coordinates = contours.map(ring => {
    const r = ring.map(([lat, lng]) => [lng, lat])
    const first = r[0]
    const last = r[r.length - 1]
    if (first && last && (first[0] !== last[0] || first[1] !== last[1])) r.push([...first])
    return r
  })
  return { type: 'Polygon', coordinates }
}

function rebuildLayers() {
  if (!ready) return
  for (const obj of objById.values()) map.geoObjects.remove(obj)
  objById.clear()

  for (const z of props.zones) {
    if (!z.polygon) continue
    try {
      const s = styleFor(z, z.id === props.selectedId)
      const poly = new ymaps.Polygon(geojsonToContours(z.polygon), { zoneId: z.id }, {
        fillColor: s.fillColor, fillOpacity: 0.18, strokeColor: s.strokeColor, strokeWidth: 2,
      })
      poly.events.add('click', () => emit('select', z.id))
      map.geoObjects.add(poly)
      objById.set(z.id, poly)
    } catch { /* skip malformed */ }
  }

  if (props.drawing && !props.readonly) enableEditing()
}

function fitToSelected() {
  const obj = objById.get(props.selectedId)
  if (!obj || !map) return
  map.setBounds(obj.geometry.getBounds(), { checkZoomRange: true, zoomMargin: 40 })
    .then(() => { if (map.getZoom() > 14) map.setZoom(14) })
    .catch(() => {})
}

function startDrawing() {
  if (!map || props.readonly) return
  cancelDrawing()
  drawPoly = new ymaps.Polygon([], {}, {
    editorDrawingCursor: 'crosshair',
    fillColor: '#22C55E', fillOpacity: 0.18, strokeColor: '#16A34A', strokeWidth: 2,
  })
  map.geoObjects.add(drawPoly)
  drawPoly.editor.startDrawing()
  drawPoly.editor.events.add('drawingstop', onDrawingStop)
}

function onDrawingStop(e) {
  if (!drawPoly) return
  const coords = drawPoly.geometry.getCoordinates()
  if (!coords || !coords[0] || coords[0].length < 3) return
  if (e && e.get && e.get('handled')) return
  if (e && e.set) e.set('handled', true)
  drawPoly.editor.stopDrawing()
  drawPoly.editor.stopEditing()
  const geom = contoursToGeojson(coords)
  map.geoObjects.remove(drawPoly)
  drawPoly = null
  emit('draw', geom)
}

function cancelDrawing() {
  if (!drawPoly) return
  try { drawPoly.editor.stopDrawing(); drawPoly.editor.stopEditing() } catch {}
  map.geoObjects.remove(drawPoly)
  drawPoly = null
}

function enableEditing() {
  for (const [id, poly] of objById.entries()) {
    try {
      origCoords.set(id, JSON.stringify(poly.geometry.getCoordinates()))
      poly.editor.startEditing()
    } catch {}
  }
}

function collectEdits() {
  const edits = []
  for (const [id, poly] of objById.entries()) {
    try {
      poly.editor.stopEditing()
      const now = JSON.stringify(poly.geometry.getCoordinates())
      if (origCoords.has(id) && origCoords.get(id) !== now) {
        edits.push({ id, geometry: contoursToGeojson(poly.geometry.getCoordinates()) })
      }
    } catch {}
  }
  origCoords.clear()
  if (edits.length) emit('edit', edits)
}

function addMarker() {
  if (markerObj) { map.geoObjects.remove(markerObj); markerObj = null }
  if (!props.marker) return
  markerObj = new ymaps.Placemark([props.marker.lat, props.marker.lng], {
    hintContent: props.marker.label || '',
  })
  map.geoObjects.add(markerObj)
  map.setCenter([props.marker.lat, props.marker.lng], 14)
}

onMounted(async () => {
  await nextTick()
  try {
    ymaps = await loadYandexMaps()
  } catch { return }
  map = new ymaps.Map(mapEl.value, {
    center: props.center,
    zoom: props.zoom,
    controls: ['zoomControl'],
  }, { suppressMapOpenBlock: true })
  ready = true

  rebuildLayers()
  if (props.marker) addMarker()
  fitToSelected()
  if (props.drawing && !props.readonly) startDrawing()
})

watch(() => props.zones, rebuildLayers, { deep: true })
watch(() => props.selectedId, () => { rebuildLayers(); fitToSelected() })
watch(() => props.marker, () => { if (ready) addMarker() }, { deep: true })
watch(() => props.drawing, on => {
  if (!ready || props.readonly) return
  if (on) { startDrawing(); enableEditing() }
  else { cancelDrawing(); collectEdits() }
})

onBeforeUnmount(() => { if (map) { map.destroy(); map = null } })
</script>
