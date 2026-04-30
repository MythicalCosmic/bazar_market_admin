<template>
  <apexchart type="area" :height="height" :options="options" :series="series" />
</template>

<script setup>
import { computed } from 'vue'
import apexchart from 'vue3-apexcharts'

const props = defineProps({
  series:     { type: Array, required: true },
  categories: { type: Array, default: () => [] },
  height:     { type: Number, default: 300 },
  colors:     { type: Array, default: () => ['#16A34A', '#3B82F6', '#F59E0B'] },
  formatY:    { type: Function, default: v => v },
})

const options = computed(() => ({
  chart: {
    toolbar: { show: false },
    animations: { enabled: true, easing: 'easeout', speed: 600 },
    zoom: { enabled: false },
    parentHeightOffset: 0,
  },
  stroke: { curve: 'smooth', width: 2.5 },
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.32, opacityTo: 0.04, stops: [0, 90, 100] },
  },
  colors: props.colors,
  dataLabels: { enabled: false },
  grid: { borderColor: 'rgba(15,23,42,0.06)', strokeDashArray: 4, padding: { left: 8, right: 8 } },
  xaxis: {
    categories: props.categories,
    labels: { style: { colors: '#94A3B8', fontSize: '11px', fontWeight: 600 } },
    axisBorder: { show: false }, axisTicks: { show: false },
  },
  yaxis: {
    labels: { style: { colors: '#94A3B8', fontSize: '11px', fontWeight: 600 }, formatter: props.formatY },
  },
  tooltip: { theme: 'light', y: { formatter: props.formatY } },
  legend: { fontSize: '12px', fontWeight: 600, markers: { width: 10, height: 10, radius: 4 } },
}))
</script>
