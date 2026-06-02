<template>
  <apexchart type="area" height="44" :options="options" :series="apexSeries" />
</template>

<script setup>
import { computed } from 'vue'
import apexchart from 'vue3-apexcharts'

const props = defineProps({
  series: { type: Array, required: true },
  color:  { type: String, default: '#10B981' },
})

const apexSeries = computed(() => [{ data: props.series }])

const options = computed(() => ({
  chart: { sparkline: { enabled: true }, animations: { enabled: true, speed: 700 } },
  stroke: { curve: 'smooth', width: 2.25, lineCap: 'round' },
  fill:   { type: 'gradient', gradient: { opacityFrom: 0.5, opacityTo: 0, stops: [0, 100] } },
  colors: [props.color],
  tooltip: { enabled: false },
}))
</script>
