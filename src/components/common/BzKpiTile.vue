<template>
  <div class="bz-kpitile bz-card">
    <div class="bz-kpitile-head">
      <div v-if="icon" class="bz-kpitile-ico" :style="`color:${color};background:${bg || color + '1f'}`">
        <v-icon :color="color" size="18">{{ icon }}</v-icon>
      </div>
      <span class="bz-kpitile-label">{{ label }}</span>
      <span v-if="delta != null" class="bz-kpitile-delta" :class="delta >= 0 ? 'is-up' : 'is-down'">
        <v-icon size="12">{{ delta >= 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}</v-icon>
        {{ Math.abs(delta).toFixed(1) }}%
      </span>
    </div>
    <div class="bz-kpitile-val num">
      <span v-if="loading" class="bz-skeleton" style="width:65%;height:24px;display:block;margin-top:6px;border-radius:8px" />
      <template v-else>{{ displayValue }}<small v-if="suffix">{{ suffix }}</small></template>
    </div>
    <div v-if="series && series.length" class="bz-kpitile-spark">
      <Sparkline :series="series" :color="color" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Sparkline from './charts/Sparkline.vue'

const props = defineProps({
  label:   { type: String, default: '' },
  value:   { type: [String, Number], default: '' },
  suffix:  { type: String, default: '' },
  icon:    { type: String, default: '' },
  color:   { type: String, default: '#10B981' },
  bg:      { type: String, default: '' },
  delta:   { type: Number, default: null },
  series:  { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  format:  { type: Function, default: null },
})

// Mirror BzStatCard: if a `format` fn is supplied, apply it to the value.
const displayValue = computed(() => props.format ? props.format(props.value) : props.value)
</script>

<style scoped>
.bz-kpitile { position: relative; padding: 16px 18px; overflow: hidden; min-height: 104px; }
.bz-kpitile-head { display: flex; align-items: center; gap: 8px; }
.bz-kpitile-ico { width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.bz-kpitile-label { font-size: 12px; font-weight: 600; color: var(--bz-text-3); flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bz-kpitile-delta { display: inline-flex; align-items: center; gap: 2px; font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: var(--bz-radius-pill); }
.bz-kpitile-delta.is-up { color: var(--bz-primary-strong); background: var(--bz-primary-soft); }
.bz-kpitile-delta.is-down { color: var(--bz-danger); background: var(--bz-danger-soft); }
.v-theme--dark .bz-kpitile-delta.is-up { color: var(--bz-primary); }
.bz-kpitile-val { font-size: 26px; font-weight: 800; letter-spacing: -1px; line-height: 1; margin-top: 12px; }
.bz-kpitile-val small { font-size: 13px; font-weight: 700; color: var(--bz-text-3); margin-left: 4px; }
.bz-kpitile-spark { position: absolute; left: 0; right: 0; bottom: 0; height: 34px; opacity: 0.65; pointer-events: none; }
</style>
