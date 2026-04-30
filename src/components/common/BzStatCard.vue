<template>
  <v-card class="stat-card pa-5" :height="height">
    <div class="d-flex align-start justify-space-between">
      <div style="flex:1;min-width:0">
        <div class="section-label" style="margin-bottom:8px">{{ title }}</div>
        <div v-if="loading" class="bz-skeleton" style="width:60%;height:30px" />
        <div v-else class="num" style="font-size:28px;font-weight:800;letter-spacing:-1px;line-height:1">
          <span>{{ displayValue }}</span>
          <span v-if="suffix" style="font-size:14px;font-weight:600;color:var(--bz-text-3);margin-left:6px">{{ suffix }}</span>
        </div>

        <div class="d-flex align-center ga-2" style="margin-top:6px">
          <div v-if="delta !== null && delta !== undefined" class="d-flex align-center" :style="`color:${delta >= 0 ? 'var(--bz-primary)' : 'var(--bz-danger)'};font-size:12px;font-weight:700`">
            <v-icon size="14">{{ delta >= 0 ? 'mdi-arrow-top-right' : 'mdi-arrow-bottom-right' }}</v-icon>
            {{ Math.abs(delta).toFixed(1) }}%
          </div>
          <div v-if="sub" style="font-size:12px;color:var(--bz-text-3)">{{ sub }}</div>
        </div>
      </div>

      <div
        class="d-flex align-center justify-center flex-shrink-0"
        :style="`width:46px;height:46px;border-radius:14px;background:${bgColor};color:${color}`"
      >
        <v-icon :color="color" size="22">{{ icon }}</v-icon>
      </div>
    </div>

    <div v-if="series && series.length" style="position:absolute;left:0;right:0;bottom:0;height:42px;pointer-events:none">
      <Sparkline :series="series" :color="color" />
    </div>
  </v-card>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import Sparkline from './charts/Sparkline.vue'

const props = defineProps({
  title:   { type: String, required: true },
  value:   { type: [Number, String], default: 0 },
  suffix:  { type: String, default: '' },
  sub:     { type: String, default: '' },
  delta:   { type: Number, default: null },
  icon:    { type: String, default: 'mdi-chart-line' },
  color:   { type: String, default: '#16A34A' },
  bgColor: { type: String, default: 'rgba(22,163,74,0.10)' },
  series:  { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  height:  { type: [Number, String], default: 132 },
  format:  { type: Function, default: null },
  animate: { type: Boolean, default: true },
})

const animated = ref(0)

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3) }

function runAnimation(target) {
  if (!props.animate) { animated.value = target; return }
  const start = animated.value
  const delta = target - start
  const dur   = 700
  const t0    = performance.now()
  function tick(now) {
    const t = Math.min(1, (now - t0) / dur)
    animated.value = start + delta * easeOutCubic(t)
    if (t < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

onMounted(() => {
  const n = Number(props.value)
  runAnimation(Number.isFinite(n) ? n : 0)
})

watch(() => props.value, v => {
  const n = Number(v)
  runAnimation(Number.isFinite(n) ? n : 0)
})

const displayValue = computed(() => {
  if (props.format) return props.format(animated.value)
  const n = animated.value
  if (Number.isNaN(n)) return props.value
  if (Math.abs(n) >= 1000) return Math.round(n).toLocaleString('ru-RU')
  return Math.round(n).toString()
})
</script>
