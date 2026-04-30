<template>
  <div ref="mapEl" :style="`width:100%;height:${height};border-radius:${radius}px;overflow:hidden`" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw'
import 'leaflet-draw/dist/leaflet.draw.css'

const props = defineProps({
  zones:    { type: Array, default: () => [] },
  selectedId: { type: [Number, String], default: null },
  drawing:  { type: Boolean, default: false },
  marker:   { type: Object, default: null }, // { lat, lng, label }
  height:   { type: String, default: '100%' },
  radius:   { type: Number, default: 16 },
  center:   { type: Array, default: () => [41.3111, 69.2797] }, // Tashkent
  zoom:     { type: Number, default: 11 },
  readonly: { type: Boolean, default: false },
})
const emit = defineEmits(['draw', 'edit', 'select'])

const mapEl = ref(null)
let map = null
let drawControl = null
let drawnGroup = null
const layerById = new Map()

function colorFor(zone, isSelected) {
  if (!zone.is_active) return { color: '#94A3B8', fillColor: '#94A3B8' }
  if (isSelected)      return { color: '#16A34A', fillColor: '#22C55E' }
  return { color: '#3B82F6', fillColor: '#60A5FA' }
}

function rebuildLayers() {
  if (!map || !drawnGroup) return
  drawnGroup.clearLayers()
  layerById.clear()

  for (const z of props.zones) {
    if (!z.polygon) continue
    try {
      const layer = L.geoJSON(z.polygon, {
        style: () => ({ ...colorFor(z, z.id === props.selectedId), weight: 2, fillOpacity: 0.18 }),
      })
      layer.eachLayer(l => {
        l.on('click', () => emit('select', z.id))
        drawnGroup.addLayer(l)
        layerById.set(z.id, l)
      })
    } catch { /* skip malformed */ }
  }
}

function fitToSelected() {
  const layer = layerById.get(props.selectedId)
  if (layer && map) map.fitBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 14 })
}

onMounted(async () => {
  await nextTick()
  map = L.map(mapEl.value, { zoomControl: true }).setView(props.center, props.zoom)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
  }).addTo(map)

  drawnGroup = new L.FeatureGroup()
  map.addLayer(drawnGroup)

  if (!props.readonly) {
    drawControl = new L.Control.Draw({
      draw: {
        polygon: { allowIntersection: false, showArea: true, shapeOptions: { color: '#16A34A', weight: 2 } },
        polyline: false, rectangle: false, circle: false, marker: false, circlemarker: false,
      },
      edit: { featureGroup: drawnGroup, remove: false },
    })

    map.on(L.Draw.Event.CREATED, e => {
      const geo = e.layer.toGeoJSON().geometry
      emit('draw', geo)
    })
    map.on(L.Draw.Event.EDITED, e => {
      const edits = []
      e.layers.eachLayer(l => edits.push({ id: idForLayer(l), geometry: l.toGeoJSON().geometry }))
      if (edits.length) emit('edit', edits)
    })
  }

  rebuildLayers()
  if (props.marker) addMarker()
  fitToSelected()
})

function idForLayer(layer) {
  for (const [id, l] of layerById.entries()) if (l === layer) return id
  return null
}

let markerLayer = null
function addMarker() {
  if (markerLayer) { map.removeLayer(markerLayer); markerLayer = null }
  if (!props.marker) return
  markerLayer = L.marker([props.marker.lat, props.marker.lng]).addTo(map)
  if (props.marker.label) markerLayer.bindTooltip(props.marker.label, { permanent: false })
  map.setView([props.marker.lat, props.marker.lng], 14)
}

watch(() => props.zones, rebuildLayers, { deep: true })
watch(() => props.selectedId, () => { rebuildLayers(); fitToSelected() })
watch(() => props.marker, addMarker, { deep: true })
watch(() => props.drawing, on => {
  if (!drawControl || !map) return
  if (on) {
    map.addControl(drawControl)
    new L.Draw.Polygon(map, drawControl.options.draw.polygon).enable()
  } else {
    try { map.removeControl(drawControl) } catch {}
  }
})

onBeforeUnmount(() => { map?.remove(); map = null })
</script>
