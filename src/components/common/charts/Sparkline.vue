<template>
  <apexchart type="area" height="42" :options="options" :series="apexSeries" />
</template>

<script setup>
import { computed } from 'vue'
import apexchart from 'vue3-apexcharts'

const props = defineProps({
  series: { type: Array, required: true },
  color:  { type: String, default: '#16A34A' },
})

const apexSeries = computed(() => [{ data: props.series }])

const options = computed(() => ({
  chart: { sparkline: { enabled: true }, animations: { enabled: true, speed: 600 } },
  stroke: { curve: 'smooth', width: 2 },
  fill:   { type: 'gradient', gradient: { opacityFrom: 0.45, opacityTo: 0, stops: [0, 100] } },
  colors: [props.color],
  tooltip: { enabled: false },
}))
</script>
